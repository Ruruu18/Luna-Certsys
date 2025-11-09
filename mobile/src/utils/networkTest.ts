import { supabase } from '../lib/supabase';

export const testNetworkConnection = async () => {
  console.log('🔍 Testing network connection...');
  let hasAnyFailure = false;
  
  try {
    // Test 1: Basic fetch to a reliable endpoint
    console.log('Test 1: Basic HTTP request');
    try {
      const response = await fetch('https://httpbin.org/get');
      console.log('✅ Basic HTTP request successful:', response.status);
    } catch (fetchError) {
      console.log('❌ Basic HTTP request failed:', fetchError.message);
      hasAnyFailure = true;
    }
    
    // Test 1.5: Test direct Supabase URL
    console.log('Test 1.5: Direct Supabase API test');
    try {
      const directResponse = await fetch('https://xxwenpzultmevzolfiby.supabase.co/rest/v1/', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4d2VucHp1bHRtZXZ6b2xmaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MjAzOTUsImV4cCI6MjA3MTk5NjM5NX0.WsgdtpgIwQ1HohRZtGCrZbRpRIIxAU1AUx0ObQtpsp0'
        }
      });
      console.log('✅ Direct Supabase API successful:', directResponse.status);
    } catch (supabaseError) {
      console.log('❌ Direct Supabase API failed:', supabaseError.message);
      hasAnyFailure = true;
    }
    
    // Test 2: Test Supabase connection
    console.log('Test 2: Supabase connection');
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        console.log('❌ Supabase connection failed:', error.message);
        hasAnyFailure = true;
      } else {
        console.log('✅ Supabase connection successful');
      }
    } catch (supabaseClientError) {
      console.log('❌ Supabase client error:', supabaseClientError.message);
      hasAnyFailure = true;
    }
    
    // Test 3: Test auth endpoint specifically
    console.log('Test 3: Supabase auth endpoint');
    try {
      const { data: session } = await supabase.auth.getSession();
      console.log('✅ Supabase auth endpoint accessible');
    } catch (authError) {
      console.log('❌ Supabase auth endpoint failed:', authError.message);
      hasAnyFailure = true;
    }
    
    if (hasAnyFailure) {
      console.log('\n❌ NETWORK TESTS FAILED - Some requests are not working');
      return false;
    } else {
      console.log('\n✅ ALL NETWORK TESTS PASSED');
      return true;
    }
  } catch (error) {
    console.log('❌ Network test failed:', error);
    if (error instanceof Error) {
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
    }
    return false;
  }
};

export const testSupabaseAuth = async (email: string, password: string) => {
  console.log('🔍 Testing Supabase auth...');

  try {
    // Test with provided credentials
    console.log('Testing login...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log('❌ Login failed:', error.message);
      console.log('Error code:', error.status);
      return false;
    } else {
      console.log('✅ Login successful!');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);

      // Test profile lookup after auth
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.log('❌ Profile lookup failed:', profileError.message);
      } else {
        console.log('✅ Profile loaded:', profile.full_name, '-', profile.role);
      }

      // Clean up
      await supabase.auth.signOut();
      console.log('✅ Signed out successfully');
      return true;
    }
  } catch (error) {
    console.log('❌ Auth test exception:', error);
    return false;
  }
};

export const testFullAuthFlow = async (email: string, password: string) => {
  console.log('\n🚀 Starting comprehensive auth flow test...');

  const networkOk = await testNetworkConnection();
  const authOk = await testSupabaseAuth(email, password);

  console.log('\n📊 Test Results:');
  console.log('Network:', networkOk ? '✅ OK' : '❌ Failed');
  console.log('Auth:', authOk ? '✅ OK' : '❌ Failed');

  if (networkOk && authOk) {
    console.log('\n🎉 All tests passed! The mobile app should work correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above for details.');
  }
};
