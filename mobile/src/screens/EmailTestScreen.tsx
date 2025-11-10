import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { sendPasswordEmail, sendTestEmail } from '../services/emailService';
import { spacing, fontSize, borderRadius, moderateScale, verticalScale } from '../utils/responsive';

interface EmailTestScreenProps {
  navigation: import('../types/navigation').AppNavigationProp;
}

export default function EmailTestScreen({ navigation }: EmailTestScreenProps) {
  const [testEmail, setTestEmail] = useState('');
  const [recipientName, setRecipientName] = useState('Juan Dela Cruz');
  const [chairmanName, setChairmanName] = useState('Maria Santos');
  const [tempPassword, setTempPassword] = useState('Test123Pass456');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setLoading(true);
    setLastResult(null);

    try {
      const result = await sendTestEmail(testEmail.trim());

      if (result.success) {
        setLastResult({ success: true, message: 'Test email sent successfully!' });
        Alert.alert(
          'Success! ✓',
          `Test email sent to ${testEmail}\n\nCheck your inbox (and spam folder).`,
          [{ text: 'OK' }]
        );
      } else {
        setLastResult({ success: false, message: result.error || 'Failed to send' });
        Alert.alert(
          'Failed ✗',
          `Error: ${result.error}\n\nPlease check:\n• API key in .env file\n• Internet connection\n• Email address is valid`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      setLastResult({ success: false, message: error.message });
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordEmail = async () => {
    if (!testEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setLoading(true);
    setLastResult(null);

    try {
      const result = await sendPasswordEmail({
        recipientEmail: testEmail.trim(),
        recipientName: recipientName.trim() || 'Test User',
        password: tempPassword,
        purokChairmanName: chairmanName.trim() || 'Test Chairman',
      });

      if (result.success) {
        setLastResult({ success: true, message: 'Password email sent successfully!' });
        Alert.alert(
          'Success! ✓',
          `Password email sent to ${testEmail}\n\nCheck your inbox for the formatted registration approval email.`,
          [{ text: 'OK' }]
        );
      } else {
        setLastResult({ success: false, message: result.error || 'Failed to send' });
        Alert.alert(
          'Failed ✗',
          `Error: ${result.error}\n\nPlease check:\n• EXPO_PUBLIC_RESEND_API_KEY in .env\n• Restart app after adding API key\n• Email address is valid`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      setLastResult({ success: false, message: error.message });
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setTempPassword(password);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarWrapper backgroundColor={theme.colors.primary} style="light" />

      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={moderateScale(24)} color="white" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>Email Service Test</Text>
          </View>

          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={moderateScale(24)} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Test the email service before using in production. Make sure you've set up Resend API key in .env file.
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Recipient Email *</Text>
            <TextInput
              style={styles.input}
              value={testEmail}
              onChangeText={setTestEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>Enter your email to receive test emails</Text>
          </View>

          {/* Simple Test Email */}
          <View style={styles.testSection}>
            <Text style={styles.sectionTitle}>1. Simple Test Email</Text>
            <Text style={styles.sectionDescription}>
              Sends a basic test email to verify the service is working.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleSendTestEmail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="mail-outline" size={moderateScale(20)} color="white" />
                  <Text style={styles.buttonText}>Send Simple Test</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Password Email Test */}
          <View style={styles.testSection}>
            <Text style={styles.sectionTitle}>2. Password Email (Full Template)</Text>
            <Text style={styles.sectionDescription}>
              Sends the actual registration approval email with password.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Recipient Name</Text>
              <TextInput
                style={styles.input}
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="Juan Dela Cruz"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Chairman Name</Text>
              <TextInput
                style={styles.input}
                value={chairmanName}
                onChangeText={setChairmanName}
                placeholder="Maria Santos"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Temporary Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={tempPassword}
                  onChangeText={setTempPassword}
                  placeholder="Password123"
                />
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={generateRandomPassword}
                >
                  <Ionicons name="refresh" size={moderateScale(20)} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSendPasswordEmail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={moderateScale(20)} color="white" />
                  <Text style={styles.buttonText}>Send Password Email</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Result Display */}
          {lastResult && (
            <View style={[
              styles.resultBox,
              lastResult.success ? styles.resultSuccess : styles.resultError
            ]}>
              <Ionicons
                name={lastResult.success ? "checkmark-circle" : "close-circle"}
                size={moderateScale(24)}
                color={lastResult.success ? theme.colors.success : theme.colors.error}
              />
              <Text style={[
                styles.resultText,
                lastResult.success ? styles.resultTextSuccess : styles.resultTextError
              ]}>
                {lastResult.message}
              </Text>
            </View>
          )}

          {/* Setup Instructions */}
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>Setup Required:</Text>
            <Text style={styles.instructionsText}>
              1. Create account at resend.com{'\n'}
              2. Get API key from dashboard{'\n'}
              3. Add to .env file:{'\n'}
              <Text style={styles.codeText}>EXPO_PUBLIC_RESEND_API_KEY=re_...</Text>{'\n'}
              4. Restart app (npm start){'\n'}
              5. Test here!
            </Text>
            <Text style={styles.instructionsNote}>
              See EMAIL_SERVICE_SETUP.md for detailed instructions.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
  },
  headerRight: {
    width: moderateScale(40),
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    gap: spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.accent,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: theme.colors.text,
    fontFamily: theme.fontFamily.regular,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  hint: {
    fontSize: fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: spacing.xs,
    fontFamily: theme.fontFamily.regular,
  },
  testSection: {
    backgroundColor: theme.colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.secondary,
  },
  buttonText: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.semiBold,
    color: 'white',
  },
  passwordRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  generateButton: {
    backgroundColor: theme.colors.accent,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resultBox: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  resultSuccess: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  resultError: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  resultText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.medium,
  },
  resultTextSuccess: {
    color: '#065f46',
  },
  resultTextError: {
    color: '#991b1b',
  },
  instructionsBox: {
    backgroundColor: '#fef3c7',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  instructionsTitle: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.bold,
    color: '#78350f',
    marginBottom: spacing.sm,
  },
  instructionsText: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: '#78350f',
    lineHeight: 20,
  },
  codeText: {
    fontFamily: 'Courier New',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 2,
  },
  instructionsNote: {
    fontSize: fontSize.xs,
    fontFamily: theme.fontFamily.regular,
    color: '#78350f',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
