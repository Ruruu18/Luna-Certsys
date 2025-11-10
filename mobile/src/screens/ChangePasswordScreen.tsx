import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';

interface ChangePasswordScreenProps {
  navigation: any;
}

export default function ChangePasswordScreen({ navigation }: ChangePasswordScreenProps) {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long' };
    }

    if (password.length > 72) {
      return { valid: false, message: 'Password must be less than 72 characters' };
    }

    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }

    return { valid: true };
  };

  const handleChangePassword = async () => {
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    // Validate new password strength
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      Alert.alert('Weak Password', validation.message);
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Error', 'Current password is incorrect');
        setIsSubmitting(false);
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      Alert.alert(
        'Success',
        'Your password has been changed successfully! Please use your new password for future logins.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear form
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              // Navigate back
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.message || 'Failed to change password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: string; color: string; percentage: number } => {
    if (!password) return { strength: '', color: theme.colors.textSecondary, percentage: 0 };

    let score = 0;

    // Length check
    if (password.length >= 6) score += 20;
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;

    // Character variety
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15; // Special characters

    if (score <= 40) {
      return { strength: 'Weak', color: theme.colors.error, percentage: 33 };
    } else if (score <= 70) {
      return { strength: 'Medium', color: theme.colors.warning, percentage: 66 };
    } else {
      return { strength: 'Strong', color: theme.colors.success, percentage: 100 };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarWrapper backgroundColor={theme.colors.primary} style="light" />

      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={moderateScale(24)} color="white" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Change Password</Text>
          </View>

          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={moderateScale(48)} color={theme.colors.primary} />
            <Text style={styles.infoTitle}>Secure Your Account</Text>
            <Text style={styles.infoText}>
              Change your password regularly to keep your account secure. Use a strong password that you don't use elsewhere.
            </Text>
          </View>

          {/* Current Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Current Password *</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter your current password"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={moderateScale(22)}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>New Password *</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter your new password"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={moderateScale(22)}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      { width: `${passwordStrength.percentage}%`, backgroundColor: passwordStrength.color },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.strength}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm New Password *</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your new password"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={moderateScale(22)}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Match Indicator */}
            {confirmPassword.length > 0 && (
              <View style={styles.matchContainer}>
                <Ionicons
                  name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                  size={moderateScale(16)}
                  color={newPassword === confirmPassword ? theme.colors.success : theme.colors.error}
                />
                <Text
                  style={[
                    styles.matchText,
                    { color: newPassword === confirmPassword ? theme.colors.success : theme.colors.error },
                  ]}
                >
                  {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                </Text>
              </View>
            )}
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <View style={styles.requirementItem}>
              <Ionicons
                name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                size={moderateScale(16)}
                color={newPassword.length >= 6 ? theme.colors.success : theme.colors.textSecondary}
              />
              <Text style={styles.requirementText}>At least 6 characters</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons
                name={/[A-Z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                size={moderateScale(16)}
                color={/[A-Z]/.test(newPassword) ? theme.colors.success : theme.colors.textSecondary}
              />
              <Text style={styles.requirementText}>One uppercase letter</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons
                name={/[a-z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                size={moderateScale(16)}
                color={/[a-z]/.test(newPassword) ? theme.colors.success : theme.colors.textSecondary}
              />
              <Text style={styles.requirementText}>One lowercase letter</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons
                name={/[0-9]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                size={moderateScale(16)}
                color={/[0-9]/.test(newPassword) ? theme.colors.success : theme.colors.textSecondary}
              />
              <Text style={styles.requirementText}>One number</Text>
            </View>
          </View>

          {/* Change Password Button */}
          <TouchableOpacity
            style={[styles.changeButton, isSubmitting && styles.changeButtonDisabled]}
            onPress={handleChangePassword}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={moderateScale(20)} color="white" />
                <Text style={styles.changeButtonText}>Change Password</Text>
              </>
            )}
          </TouchableOpacity>
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
    justifyContent: 'space-between',
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
  headerTitle: {
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
  section: {
    padding: spacing.lg,
  },
  infoCard: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  infoTitle: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
    minHeight: moderateScale(50),
  },
  eyeButton: {
    padding: spacing.md,
  },
  strengthContainer: {
    marginTop: spacing.sm,
  },
  strengthBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  matchText: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.medium,
  },
  requirementsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  requirementsTitle: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  requirementText: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  changeButtonDisabled: {
    opacity: 0.6,
  },
  changeButtonText: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
  },
});
