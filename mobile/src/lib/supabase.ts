import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// React Native network debugging
console.log('Initializing Supabase client...');
console.log('Platform:', typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js');
console.log('Global fetch available:', typeof global.fetch !== 'undefined');
console.log('Fetch available:', typeof fetch !== 'undefined');

// Enhanced fetch wrapper for React Native
const createRobustFetch = () => {
  return async (url, options = {}) => {
    console.log('🌐 Robust fetch request to:', url);
    console.log('🔧 Request options:', {
      method: options.method || 'GET',
      headers: options.headers ? Object.keys(options.headers) : 'none'
    });
    
    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const enhancedOptions = {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        }
      };
      
      const response = await fetch(url, enhancedOptions);
      clearTimeout(timeoutId);
      
      console.log('✅ Response received:', response.status, response.statusText);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ Robust fetch error:', {
        message: error.message,
        name: error.name,
        url: url,
        method: options.method || 'GET'
      });
      
      // Provide more specific error information
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your internet connection');
      } else if (error.message === 'Network request failed') {
        throw new Error('Network connection failed - please check your internet connection and try again');
      }
      
      throw error;
    }
  };
};

const supabaseUrl = 'https://xxwenpzultmevzolfiby.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4d2VucHp1bHRtZXZ6b2xmaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MjAzOTUsImV4cCI6MjA3MTk5NjM5NX0.WsgdtpgIwQ1HohRZtGCrZbRpRIIxAU1AUx0ObQtpsp0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Test connection on startup
console.log('Mobile Supabase client initialized with URL:', supabaseUrl);

// Add connection test for mobile with RLS awareness
async function testMobileConnection() {
  try {
    // Test basic connection without auth first
    const { data: healthCheck } = await supabase.from('users').select('count').limit(1);
    if (healthCheck && healthCheck.length === 0) {
      console.log('Mobile Supabase connection test: SUCCESS (RLS protecting data as expected)');
    } else {
      console.log('Mobile Supabase connection test: SUCCESS');
    }
  } catch (error) {
    console.error('Mobile Supabase connection test failed:', error);
  }
}
testMobileConnection();

// Database types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'purok_chairman' | 'resident';
  purok?: string;
  phone_number?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  purok_chairman_id?: string; // For residents, links to their purok chairman
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
}

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
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    return userProfile;
  }
  return null;
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
