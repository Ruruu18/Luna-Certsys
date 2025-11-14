import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { testNetworkConnection, testSupabaseAuth } from '../utils/networkTest';
import { NetworkDebugger } from '../components/NetworkDebugger';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <View style={styles.container}>
      <StatusBarWrapper style="light" />
      <ImageBackground
        source={require('../../assets/images/backdrop.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={
            Platform.OS === 'android'
              ? ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)']  // Transparent on Android - no overlay
              : ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.25)', 'rgba(0, 0, 0, 0.3)']  // Original iOS
          }
          style={styles.overlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              contentContainerStyle={styles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
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
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor="#999999"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={24}
                      color="#666666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#2563eb', '#3b82f6']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="white" size="small" style={styles.loadingSpinner} />
                      <Text style={styles.loadingText}>Welcome...</Text>
                    </View>
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
              </View>
            </View>
          </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>

      {/* Network Debugger Overlay */}
      {showDebugger && (
        <NetworkDebugger onClose={() => setShowDebugger(false)} />
      )}
    </View>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(20),
    minHeight: dimensions.height,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logo: {
    width: scale(400),
    height: verticalScale(200),
    maxWidth: dimensions.width * 0.9,
    maxHeight: dimensions.height * 0.25,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',  // Solid white container
    borderRadius: borderRadius.xl,
    borderWidth: 0,
    borderColor: 'transparent',
    width: '100%',
    maxWidth: dimensions.isTablet ? 500 : 420,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  formInner: {
    padding: spacing.lg,
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: '#1a1a1a',  // Very dark gray/black
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: fontSize.lg,
    fontFamily: theme.fontFamily.medium,
    fontWeight: theme.fontWeight.medium,
    color: '#4a4a4a',  // Medium dark gray
    textAlign: 'center',
    marginBottom: spacing.lg,
    letterSpacing: 0.3,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: '#2a2a2a',  // Very dark, almost black
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#FFFFFF',  // Pure white for inputs
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    fontFamily: theme.fontFamily.regular,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',  // Darker border for definition
    color: '#1a1a1a',  // Very dark text
    minHeight: moderateScale(52),
    fontWeight: theme.fontWeight.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  passwordInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingRight: moderateScale(55),  // Extra padding for eye icon
    fontSize: fontSize.base,
    fontFamily: theme.fontFamily.regular,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    color: '#1a1a1a',
    minHeight: moderateScale(52),
    fontWeight: theme.fontWeight.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.md,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  loginButton: {
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
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
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(54),
  },
  loginButtonText: {
    color: 'white',
    fontSize: fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  registerContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  registerLink: {
    textAlign: 'center',
    fontSize: fontSize.base,
    fontFamily: theme.fontFamily.medium,
    fontWeight: theme.fontWeight.medium,
    color: '#4a4a4a',  // Darker gray for better visibility
    letterSpacing: 0.2,
  },
  registerText: {
    color: '#2563eb',  // Blue for Sign Up link
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    textDecorationLine: 'underline',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    marginRight: spacing.sm,
  },
  loadingText: {
    color: 'white',
    fontSize: fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    letterSpacing: 0.5,
  },
});
