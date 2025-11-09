import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, User, getCurrentUser, checkAndRefreshSession, handleAuthError as handleAuthErrorUtil } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  handleAuthError: (error: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session with error handling
    const initializeAuth = async () => {
      try {
        const session = await checkAndRefreshSession();
        setSession(session);
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await handleAuthErrorUtil(error);
        setLoading(false);
      }
    };
    
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event, session?.user?.id);
      
      // Handle specific auth events
      if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }
      
      setSession(session);
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading user profile for ID:', userId);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('Auth user:', authUser);

      if (!authUser?.email) {
        console.error('No auth user email found');
        setUser(null);
        setLoading(false);
        return;
      }

      // Try to load user profile from database using the user ID (more reliable)
      try {
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        console.log('Database profile query result:', { userProfile, error });

        if (userProfile && !error) {
          setUser(userProfile);
          console.log('Successfully loaded profile from database');
        } else {
          console.error('Profile lookup failed:', error);
          
          // Fallback: try lookup by email for existing users (handles UUID mismatches)
          console.log('Trying email fallback for UUID mismatch...');
          const { data: emailProfile, error: emailError } = await supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email)
            .single();

          if (emailProfile && !emailError) {
            console.log('✅ Found user by email - UUID mismatch detected and handled');
            console.log('   Auth UUID:', userId);
            console.log('   Database UUID:', emailProfile.id);
            console.log('   This should be fixed in the database for better performance');
            setUser(emailProfile);
          } else {
            console.error('Email fallback also failed:', emailError);
            console.error('❌ User profile not found - user may need to be created in database');
            setUser(null);
          }
        }
      } catch (dbError) {
        console.error('Database query exception:', dbError);
        setUser(null);
      }
    } catch (error) {
      console.error('Exception in loadUserProfile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        setLoading(false);
        return { error };
      }

      if (data.user) {
        console.log('Sign in successful, loading user profile...');
        // Add a small delay to ensure the auth session is fully established
        await new Promise(resolve => setTimeout(resolve, 200));
        await loadUserProfile(data.user.id);
      }
      
      return { error: null };
    } catch (exception) {
      console.error('Sign in exception:', exception);
      setLoading(false);
      return { error: exception };
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!error && data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          ...userData,
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }

    setLoading(false);
    return { error };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setLoading(false);
  };

  const refreshUser = async () => {
    if (session?.user) {
      await loadUserProfile(session.user.id);
    }
  };

  const handleAuthError = async (error: any) => {
    const { shouldReauth } = await handleAuthErrorUtil(error);
    
    if (shouldReauth) {
      // Clear local state when reauth is needed
      setUser(null);
      setSession(null);
      setLoading(false);
      console.log('✅ Local auth state cleared due to token error');
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    handleAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
