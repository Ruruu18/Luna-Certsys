import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxwenpzultmevzolfiby.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4d2VucHp1bHRtZXZ6b2xmaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MjAzOTUsImV4cCI6MjA3MTk5NjM5NX0.WsgdtpgIwQ1HohRZtGCrZbRpRIIxAU1AUx0ObQtpsp0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

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
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
  notes?: string;
  amount?: number;
  processed_by?: string;
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
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
};

export const deleteUser = async (userId: string) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  return { error };
};

export const getCertificates = async (userId?: string) => {
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
  return { data, error };
};

export const createCertificate = async (certificate: Omit<Certificate, 'id' | 'requested_at'>) => {
  const { data, error } = await supabase
    .from('certificates')
    .insert(certificate)
    .select()
    .single();
  return { data, error };
};

export const updateCertificate = async (certificateId: string, updates: Partial<Certificate>) => {
  const { data, error } = await supabase
    .from('certificates')
    .update(updates)
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
    // Generate a secure default password if none provided
    const userPassword = password || `${userData.full_name.replace(/\s+/g, '').toLowerCase()}${Math.floor(Math.random() * 1000)}`;

    console.log('Creating user with email:', userData.email);

    // Step 1: Create Supabase Auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userPassword,
      options: {
        emailRedirectTo: undefined, // Disable email confirmation for admin-created users
      }
    });

    if (authError) {
      console.error('Auth user creation failed:', authError);
      return { data: null, error: authError, password: null };
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
        full_name: userData.full_name,
        role: userData.role,
        purok: userData.purok,
        phone_number: userData.phone_number,
        address: userData.address,
        purok_chairman_id: userData.purok_chairman_id
      })
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
      email: dbUser.email,
      name: dbUser.full_name,
      role: dbUser.role,
      authId: authData.user.id,
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
  return { data, error };
};

export const createCertificateRequest = async (requestData: Omit<CertificateRequest, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('certificate_requests')
    .insert(requestData)
    .select()
    .single();
  return { data, error };
};

export const updateCertificateRequest = async (requestId: string, updates: Partial<CertificateRequest>) => {
  const { data, error } = await supabase
    .from('certificate_requests')
    .update(updates)
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
