import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { testNetworkConnection, testSupabaseAuth } from '../utils/networkTest';
import { NetworkDebugger } from '../components/NetworkDebugger';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  
  const { signIn } = useAuth();

  // Removed automatic network tests - use debug button instead

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    console.log('Mobile login attempt for:', email);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('Mobile login error:', error);
        Alert.alert('Login Failed', error.message || 'Invalid credentials');
        setIsLoading(false);
      } else {
        console.log('Mobile login successful! AuthContext will handle navigation.');
        // Don't manually navigate - let AppNavigator handle it based on auth state
        // The loading state will be cleared by the AuthContext
      }
    } catch (error) {
      console.error('Mobile login exception:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Registration');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ImageBackground
        source={require('../../assets/images/backdrop.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.8)']}
          style={styles.overlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.contentContainer}>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
               <View style={styles.formInner}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#1e3c72', '#2a5298']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.loginButtonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={navigateToRegister} style={styles.registerContainer}>
                  <Text style={styles.registerLink}>
                    Don't have an account? <Text style={styles.registerText}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>

                {/* Debug button */}
                <TouchableOpacity 
                  onPress={() => setShowDebugger(true)} 
                  style={styles.debugButton}
                >
                  <Text style={styles.debugButtonText}>🔧 Debug Network</Text>
                </TouchableOpacity>
              </View>
             </View>
          </View>
        </LinearGradient>
      </ImageBackground>
      
      {/* Network Debugger Overlay */}
      {showDebugger && (
        <NetworkDebugger onClose={() => setShowDebugger(false)} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  logo: {
    width: Math.min(width * 0.7, 300),
    height: Math.min(width * 0.45, 180),
    minWidth: 240,
    minHeight: 120,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    width: '100%',
    maxWidth: 380,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  formInner: {
    padding: theme.spacing.lg + 4,
    paddingVertical: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl + 2,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: theme.fontSize.md + 1,
    fontFamily: theme.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: theme.spacing.lg + 4,
    letterSpacing: 0.3,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: 'white',
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: theme.borderRadius.md + 2,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md + 4,
    fontSize: theme.fontSize.md + 1,
    fontFamily: theme.fontFamily.regular,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    color: 'white',
    minHeight: 52,
  },
  loginButton: {
    borderRadius: theme.borderRadius.md + 4,
    marginTop: theme.spacing.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  loginButtonText: {
    color: 'white',
    fontSize: theme.fontSize.lg + 2,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  registerContainer: {
    marginTop: theme.spacing.lg + 4,
    alignItems: 'center',
  },
  registerLink: {
    textAlign: 'center',
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.2,
  },
  registerText: {
    color: 'white',
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    textDecorationLine: 'underline',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  debugButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  debugButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.regular,
  },
});
