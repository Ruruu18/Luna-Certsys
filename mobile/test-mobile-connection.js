// Mobile Supabase connection test
// This can help debug mobile-specific issues

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxwenpzultmevzolfiby.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4d2VucHp1bHRtZXZ6b2xmaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MjAzOTUsImV4cCI6MjA3MTk5NjM5NX0.WsgdtpgIwQ1HohRZtGCrZbRpRIIxAU1AUx0ObQtpsp0';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

async function testMobileConnection() {
  console.log('Testing mobile Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('email, role')
      .limit(5);
    
    if (error) {
      console.error('Mobile connection test failed:', error);
    } else {
      console.log('Mobile connection successful! Found users:', data);
    }

    // Test admin user specifically
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@resare.com')
      .single();
    
    if (adminError) {
      console.error('Admin user check failed:', adminError);
    } else {
      console.log('Admin user found:', adminUser);
    }

    // Test mobile auth login
    console.log('\nTesting mobile admin login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@resare.com',
      password: 'admin123'
    });

    if (loginError) {
      console.error('Mobile login test failed:', loginError);
    } else {
      console.log('Mobile login successful:', loginData.user?.email);
      
      // Sign out
      await supabase.auth.signOut();
    }

  } catch (err) {
    console.error('Mobile test exception:', err);
  }
}

export default testMobileConnection;
