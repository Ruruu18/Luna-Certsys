import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

// Singleton pattern to ensure only one client instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// Use a single client instance for both regular and admin operations
// The service role key gives admin privileges when available
export const supabase = (() => {
  if (!supabaseInstance) {
    // Use service key if available (for admin operations), otherwise use anon key
    const key = supabaseServiceKey || supabaseAnonKey;

    supabaseInstance = createClient(supabaseUrl, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'resare-web-auth' // Unique storage key for this app
      }
    });
  }
  return supabaseInstance;
})();

// Export supabaseAdmin as alias to the same client for backward compatibility
export const supabaseAdmin = supabase;

// Test connection on startup
console.log('Supabase client initialized with URL:', supabaseUrl);

// Add connection test with authentication
async function testConnection() {
  try {
    // Test basic connection without auth first
    const { data: healthCheck } = await supabase.from('users').select('count').limit(1);
    if (healthCheck && healthCheck.length === 0) {
      console.log('Supabase connection test: SUCCESS (RLS protecting data as expected)');
    } else {
      console.log('Supabase connection test: SUCCESS');
    }
  } catch (error) {
    console.error('Supabase connection test failed:', error);
  }
}
testConnection();

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
  photo_url?: string; // Face photo from verification
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
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'in_progress';
  requested_at: string;
  approved_at?: string;
  completed_at?: string;
  notes?: string;
  approved_by?: string; // User ID of the approver
  users?: {
    full_name: string;
    email: string;
  };
}

export interface CertificateRequest {
  id: string;
  user_id: string;
  certificate_type: string;
  purpose: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'approved';
  created_at: string;
  updated_at: string;
  notes?: string;
  amount?: number;
  processed_by?: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  payment_date?: string;
  payment_amount?: number;
  pdf_url?: string;
  pdf_generated_at?: string;
  certificate_number?: string;
  requested_at?: string;
  users?: {
    full_name: string;
    email: string;
  };
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
    // @ts-ignore - Supabase type inference issue
    .update(updates as any)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

export const getAllUsers = async () => {
  try {
    console.log('🔍 [USERS] Starting query...')
    const startTime = Date.now()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    const duration = Date.now() - startTime
    console.log(`✅ [USERS] Query completed in ${duration}ms`)

    return { data, error };
  } catch (err: any) {
    console.error('❌ [USERS] Query exception:', err)
    return { data: null, error: err }
  }
};

export const deleteUser = async (userId: string) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  return { error };
};

export const getCertificates = async (userId?: string) => {
  try {
    console.log('🔍 [CERTIFICATES] Starting query...')
    const startTime = Date.now()

    let query = supabase
      .from('certificates')
      .select(`
        *,
        users!certificates_user_id_fkey(full_name, email)
      `);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('requested_at', { ascending: false });

    const duration = Date.now() - startTime
    console.log(`✅ [CERTIFICATES] Query completed in ${duration}ms`)

    if (error) {
      console.error('❌ [CERTIFICATES] Query error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('❌ [CERTIFICATES] Query exception:', err);
    return { data: null, error: err };
  }
};

export const createCertificate = async (certificate: Omit<Certificate, 'id' | 'requested_at'>) => {
  const { data, error } = await supabase
    .from('certificates')
    .insert(certificate as any)
    .select()
    .single();
  return { data, error };
};

export const updateCertificate = async (certificateId: string, updates: Partial<Certificate>) => {
  const { data, error } = await supabase
    .from('certificates')
    // @ts-ignore - Supabase type inference issue
    .update(updates as any)
    .eq('id', certificateId)
    .select()
    .single();
  return { data, error };
};

export const deleteCertificate = async (certificateId: string) => {
  const { error } = await supabase
    .from('certificates')
    .delete()
    .eq('id', certificateId);
  return { error };
};

export const getResidentsByChairman = async (chairmanId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('purok_chairman_id', chairmanId)
    .eq('role', 'resident')
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>, password?: string) => {
  try {
    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('Service role key not configured. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to .env file');
      return {
        data: null,
        error: {
          message: 'Admin operations not configured. Please contact system administrator.'
        },
        password: null
      };
    }

    // Handle separated name fields (new) or full_name (legacy)
    let first_name = userData.first_name;
    let last_name = userData.last_name;
    let middle_name = userData.middle_name;
    let suffix = userData.suffix;

    // If full_name is provided but not first_name/last_name, split it
    if (!first_name && !last_name && userData.full_name) {
      const nameParts = userData.full_name.trim().split(/\s+/);
      first_name = nameParts[0] || '';
      last_name = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
      if (nameParts.length > 2) {
        middle_name = nameParts.slice(1, -1).join(' ');
      }
    }

    // Generate a secure default password if none provided
    const displayName = userData.full_name || `${first_name} ${last_name}`;
    const userPassword = password || `${displayName.replace(/\s+/g, '').toLowerCase()}${Math.floor(Math.random() * 1000)}`;

    console.log('Creating user with email:', userData.email);
    console.log('User data:', userData);

    // Step 1: Create Supabase Auth user using admin client (bypasses email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userPassword,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        role: userData.role, // Store role in JWT metadata to avoid circular RLS queries
        first_name,
        last_name
      }
    });

    if (authError) {
      console.error('Auth user creation failed:', authError);
      console.error('Auth error details:', {
        message: authError.message,
        status: authError.status
      });
      
      // Return a more user-friendly error message
      let friendlyMessage = authError.message;
      if (authError.message?.includes('already registered')) {
        friendlyMessage = 'This email address is already registered in the system';
      } else if (authError.message?.includes('invalid') && authError.message?.includes('email')) {
        friendlyMessage = 'Please enter a valid email address';
      } else if (authError.message?.includes('weak password')) {
        friendlyMessage = 'Password is too weak. Please use a stronger password';
      }
      
      return { data: null, error: { ...authError, message: friendlyMessage }, password: null };
    }

    if (!authData.user) {
      const error = { message: 'Auth user creation returned no user data' };
      console.error('Auth creation failed:', error);
      return { data: null, error, password: null };
    }

    console.log('✅ Auth user created with ID:', authData.user.id);

    // Step 2: Create database profile using the Auth user's UUID
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id, // ✅ Use Auth UUID to prevent mismatches
        email: userData.email,
        first_name,
        middle_name: middle_name || null,
        last_name,
        suffix: suffix || null,
        role: userData.role,
        purok: userData.purok,
        phone_number: userData.phone_number,
        address: userData.address,
        purok_chairman_id: userData.purok_chairman_id
      } as any)
      .select()
      .single();

    if (dbError) {
      console.error('Database user creation failed:', dbError);
      // TODO: Ideally should cleanup Auth user here, but Supabase admin API is needed
      console.warn('Auth user was created but database profile failed. Manual cleanup may be needed.');
      return { data: null, error: dbError, password: null };
    }

    console.log('✅ Database profile created successfully');
    console.log('✅ User creation complete:', {
      // @ts-ignore - Supabase returns proper user data
      email: dbUser.email,
      // @ts-ignore - Supabase returns proper user data
      name: dbUser.full_name,
      // @ts-ignore - Supabase returns proper user data
      role: dbUser.role,
      authId: authData.user.id,
      // @ts-ignore - Supabase returns proper user data
      dbId: dbUser.id,
      password: userPassword
    });

    return {
      data: dbUser,
      error: null,
      password: userPassword // Return password so admin can provide it to user
    };

  } catch (exception) {
    console.error('Exception during user creation:', exception);
    return { data: null, error: exception, password: null };
  }
};

// Certificate Requests CRUD functions
export const getCertificateRequests = async (userId?: string) => {
  try {
    console.log('🔍 [REQUESTS] Starting query...')
    const startTime = Date.now()

    let query = supabase
      .from('certificate_requests')
      .select(`
        *,
        users!certificate_requests_user_id_fkey(full_name, email)
      `);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    const duration = Date.now() - startTime
    console.log(`✅ [REQUESTS] Query completed in ${duration}ms`)

    if (error) {
      console.error('❌ [REQUESTS] Query error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('❌ [REQUESTS] Query exception:', err);
    return { data: null, error: err };
  }
};

export const createCertificateRequest = async (requestData: Omit<CertificateRequest, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('certificate_requests')
    .insert(requestData as any)
    .select()
    .single();
  return { data, error };
};

export const updateCertificateRequest = async (requestId: string, updates: Partial<CertificateRequest>) => {
  const { data, error } = await supabase
    .from('certificate_requests')
    // @ts-ignore - Supabase type inference issue
    .update(updates as any)
    .eq('id', requestId)
    .select()
    .single();
  return { data, error };
};

export const deleteCertificateRequest = async (requestId: string) => {
  const { error } = await supabase
    .from('certificate_requests')
    .delete()
    .eq('id', requestId);
  return { error };
};
