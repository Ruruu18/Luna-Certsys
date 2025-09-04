// Simple test script to verify Supabase connection
// Run this with: node test-connection.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxwenpzultmevzolfiby.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4d2VucHp1bHRtZXZ6b2xmaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MjAzOTUsImV4cCI6MjA3MTk5NjM5NX0.WsgdtpgIwQ1HohRZtGCrZbRpRIIxAU1AUx0ObQtpsp0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('email, role')
      .limit(5);

    if (error) {
      console.error('Connection test failed:', error);
    } else {
      console.log('Connection successful! Found users:', data);
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

    // Test auth login
    console.log('\nTesting admin login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@resare.com',
      password: 'admin123'
    });

    if (loginError) {
      console.error('Login test failed:', loginError);
    } else {
      console.log('Login successful:', loginData.user?.email);

      // Sign out
      await supabase.auth.signOut();
    }

  } catch (err) {
    console.error('Test exception:', err);
  }
}

testConnection();
