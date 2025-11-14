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
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }
  return supabaseInstance;
})();

// Export supabaseAdmin as alias to the same client for backward compatibility
export const supabaseAdmin = supabase;

// Auto-clear invalid sessions to prevent "Refresh Token Not Found" errors
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('✅ Auth token refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    console.log('🚪 User signed out');
  } else if (event === 'SIGNED_IN') {
    console.log('✅ User signed in');
  }
});

// Detect and clear invalid sessions on startup
(async () => {
  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      console.warn('⚠️  Invalid session detected, clearing...', error.message);
      await supabase.auth.signOut();
      localStorage.removeItem('resare-web-auth');
    }
  } catch (err) {
    console.error('Error checking session:', err);
  }
})();

// Test connection on startup
console.log('Supabase client initialized with URL:', supabaseUrl);

// Add connection test with authentication
async function testConnection() {
  try {
    // Test basic connection without auth first
    // Use a lightweight head request with count to avoid selecting non-existent columns
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'estimated', head: true });

    if (error) {
      console.warn('Supabase connection test warning:', error.message || error);
    }
    console.log('Supabase connection test: SUCCESS');
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
  try {
    console.log('🔄 [UPDATE USER] Starting update for user:', userId)
    console.log('🔄 [UPDATE USER] Update data:', updates)

    // Use admin client to bypass RLS policies
    const { data, error } = await supabaseAdmin
      .from('users')
      // @ts-ignore - Supabase type inference issue
      .update(updates as any)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ [UPDATE USER] Update failed:', error)
      return { data: null, error }
    }

    console.log('✅ [UPDATE USER] Update successful:', data)
    return { data, error: null };
  } catch (err: any) {
    console.error('❌ [UPDATE USER] Exception:', err)
    return { data: null, error: err }
  }
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
  try {
    console.log('🗑️ Starting user deletion for ID:', userId);

    // Verify service role key is configured
    if (!supabaseServiceKey) {
      const errorMsg = 'Service role key not configured. Cannot delete users without admin privileges.';
      console.error('❌', errorMsg);
      return { error: { message: errorMsg } };
    }

    console.log('✅ Using service role key for admin deletion');

    // First, delete the auth user using admin privileges
    console.log('🗑️ Step 1: Deleting auth user...');
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('❌ Error deleting auth user:', authError);
      console.log('⚠️  Continuing to try database deletion...');
      // If auth deletion fails, still try to delete database record
      // (user might not exist in auth but exist in database)
    } else {
      console.log('✅ Auth user deleted successfully');
    }

    // Then delete the database record using admin client (bypasses RLS)
    console.log('🗑️ Step 2: Deleting database record...');
    const { error: dbError, count } = await supabaseAdmin
      .from('users')
      .delete({ count: 'exact' })
      .eq('id', userId);

    if (dbError) {
      console.error('❌ Error deleting database record:', dbError);
      console.error('Full error details:', JSON.stringify(dbError, null, 2));
      return { error: dbError };
    }

    console.log(`✅ User deleted successfully from both auth and database (${count} record(s) deleted)`);
    return { error: null };
  } catch (exception: any) {
    console.error('❌ Exception during user deletion:', exception);
    console.error('Exception details:', JSON.stringify(exception, null, 2));
    return { error: exception };
  }
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

    // Step 2: Create database profile using the Auth user's UUID (use admin client to bypass RLS)
    // Build full_name from parts
    const fullNameParts = [first_name, middle_name, last_name, suffix].filter(Boolean);
    const full_name = fullNameParts.join(' ');

    console.log('Inserting user into database with data:', {
      id: authData.user.id,
      email: userData.email,
      first_name,
      last_name,
      full_name,
      role: userData.role,
      purok: userData.purok
    });

    // Add timeout to prevent infinite loading
    const insertPromise = supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id, // ✅ Use Auth UUID to prevent mismatches
        email: userData.email,
        first_name,
        middle_name: middle_name || null,
        last_name,
        suffix: suffix || null,
        full_name, // ✅ Add computed full_name
        role: userData.role,
        purok: userData.purok || null,
        phone_number: userData.phone_number || null,
        address: userData.address || null,
        purok_chairman_id: userData.purok_chairman_id || null,
        // Personal information fields
        date_of_birth: userData.date_of_birth || null,
        place_of_birth: userData.place_of_birth || null,
        gender: userData.gender || null,
        civil_status: userData.civil_status || null,
        age: userData.age ? parseInt(userData.age as any, 10) : null,
        nationality: userData.nationality || null,
        face_verified: false, // Default values
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .select()
      .single();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database insert timeout after 15 seconds. Check RLS policies or database triggers.')), 15000)
    );

    let dbUser, dbError;
    try {
      const result = await Promise.race([insertPromise, timeoutPromise]) as any;
      dbUser = result.data;
      dbError = result.error;
      console.log('Database insert completed:', { dbUser, dbError });
    } catch (timeoutError) {
      console.error('Database insert timed out!', timeoutError);
      dbError = timeoutError;
    }

    if (dbError) {
      console.error('Database user creation failed:', dbError);
      console.error('Database error details:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code
      });

      // Cleanup: Delete the auth user since database profile creation failed
      console.log('Cleaning up auth user:', authData.user.id);
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('✅ Cleaned up orphaned auth user');
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }

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
  // Filter out undefined values - Supabase doesn't handle them well
  // Convert undefined to null for fields that should be cleared
  const cleanUpdates: Record<string, any> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  });

  const { data, error } = await supabase
    .from('certificate_requests')
    // @ts-ignore - Supabase type inference issue
    .update(cleanUpdates as any)
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
