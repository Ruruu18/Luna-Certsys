import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging
console.log('Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING');
console.log('Supabase Key:', supabaseAnonKey ? 'PRESENT' : 'MISSING');

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please create a .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'supabase.auth.token',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
    // Custom fetch with timeout for Android network issues
    fetch: (url, options = {}) => {
      const timeout = 30000; // 30 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    },
  },
});

// Listen for auth state changes and handle refresh token errors silently
supabase.auth.onAuthStateChange(async (event, session) => {
  // Silently handle sign-out and token refresh
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    if (!session) {
      // Session cleared or refresh failed - handled silently
    }
  }
});

// Clear invalid sessions on startup silently
async function initializeAuth() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      // If there's an error getting the session (like invalid refresh token), clear it silently
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('supabase.auth.token');
    }
  } catch (error) {
    // Clear storage silently on error
    await AsyncStorage.removeItem('supabase.auth.token');
  }
}
initializeAuth();

// Database types
export interface User {
  id: string;
  email: string;

  // Name fields (NEW - separated for certificates)
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  full_name: string; // Computed from first_name + middle_name + last_name + suffix

  // Account info
  role: 'admin' | 'purok_chairman' | 'resident';
  purok?: string;
  phone_number?: string;
  address?: string;

  // Personal details (for certificates)
  date_of_birth?: string;
  place_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  civil_status?: 'Single' | 'Married' | 'Widowed' | 'Divorced' | 'Separated';
  age?: number;
  nationality?: string;

  // Face verification (NEW)
  photo_url?: string; // Face photo from verification (auto-captured, read-only)
  face_verified: boolean;
  face_verified_at?: string;

  // System fields
  created_at: string;
  updated_at: string;
  purok_chairman_id?: string; // For residents, links to their purok chairman
  push_token?: string; // For push notifications
}

export interface Certificate {
  id: string;
  user_id: string;
  certificate_type: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_at: string;
  approved_at?: string;
  completed_at?: string;
  notes?: string;
  approved_by?: string; // User ID of the approver
}

export interface CertificateRequest {
  id: string;
  user_id: string;
  certificate_type: string;
  purpose: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
  notes?: string;
  amount?: number;
  processed_by?: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  payment_reference?: string;
  payment_date?: string;
  payment_amount?: number;
  pdf_url?: string;
  pdf_generated_at?: string;
  certificate_number?: string;
}

// Utility function to handle auth errors, especially refresh token issues
export const handleAuthError = async (error: any) => {
  if (error?.message?.includes('refresh') ||
      error?.message?.includes('Invalid Refresh Token') ||
      error?.message?.includes('Refresh Token Not Found')) {

    try {
      // Clear the session from storage silently
      await supabase.auth.signOut();
    } catch (signOutError) {
      // Handle silently
    }

    return { shouldReauth: true, error };
  }

  return { shouldReauth: false, error };
};

// Auth helpers
export const signUp = async (email: string, password: string, userData: Partial<User>) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const { shouldReauth } = await handleAuthError(error);
      return { data, error, shouldReauth };
    }

    return { data, error: null, shouldReauth: false };
  } catch (exception) {
    const { shouldReauth } = await handleAuthError(exception);
    return { data: null, error: exception, shouldReauth };
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      const { shouldReauth } = await handleAuthError(error);
      if (shouldReauth) {
        return null;
      }
      throw error;
    }
    return user;
  } catch (error) {
    return null;
  }
};

// Function to check session health and refresh if needed
export const checkAndRefreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      await handleAuthError(error);
      return null;
    }

    if (!session) {
      return null;
    }

    // Check if token is close to expiry (within 5 minutes)
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;

    if (timeUntilExpiry < 300) { // Less than 5 minutes
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        await handleAuthError(refreshError);
        return null;
      }

      return refreshData.session;
    }

    return session;
  } catch (error) {
    await handleAuthError(error);
    return null;
  }
};

// Database helpers
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

export const getCertificates = async (userId: string) => {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const getCertificateRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from('certificate_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createCertificateRequest = async (request: Omit<CertificateRequest, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('certificate_requests')
    .insert(request)
    .select()
    .single();
  return { data, error };
};

export const getCertificateRequestsByChairman = async (chairmanId: string) => {
  // First get all residents under this chairman
  const { data: residents, error: residentsError } = await supabase
    .from('users')
    .select('id')
    .eq('purok_chairman_id', chairmanId)
    .eq('role', 'resident');

  if (residentsError) return { data: null, error: residentsError };

  if (!residents || residents.length === 0) {
    return { data: [], error: null };
  }

  const residentIds = residents.map(r => r.id);

  // Get certificate requests for these residents
  const { data, error } = await supabase
    .from('certificate_requests')
    .select(`
      *,
      user:users!certificate_requests_user_id_fkey(*)
    `)
    .in('user_id', residentIds)
    .order('created_at', { ascending: false });

  return { data, error };
};

export const updateCertificateRequestStatus = async (
  requestId: string, 
  status: 'pending' | 'in_progress' | 'completed' | 'rejected',
  processedBy: string,
  notes?: string
) => {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
    processed_by: processedBy,
  };

  if (notes) {
    updateData.notes = notes;
  }

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('certificate_requests')
    .update(updateData)
    .eq('id', requestId)
    .select()
    .single();

  return { data, error };
};
