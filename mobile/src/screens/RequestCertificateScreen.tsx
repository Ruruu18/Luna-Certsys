import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { createCertificateRequest } from '../lib/supabase';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';

interface RequestCertificateScreenProps {
  navigation: import('../types/navigation').AppNavigationProp;
}

interface CertificateRequest {
  certificateType: string;
  purpose: string;
  quantity: string;
  urgency: string;
  additionalNotes: string;
}

export default function RequestCertificateScreen({ navigation }: RequestCertificateScreenProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CertificateRequest>({
    certificateType: '',
    purpose: '',
    quantity: '1',
    urgency: '',
    additionalNotes: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const certificateTypes = [
    'Barangay Clearance',
    'Certificate of Residency',
    'Certificate of Indigency',
    'Business Permit',
    'Building Permit',
  ];

  const urgencyOptions = [
    { label: 'Regular (7-10 days)', value: 'Regular (7-10 days)', fee: 50 },
    { label: 'Rush (3-5 days)', value: 'Rush (3-5 days)', fee: 100 },
    { label: 'Express (1-2 days)', value: 'Express (1-2 days)', fee: 150 },
  ];

  const handleInputChange = (field: keyof CertificateRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.certificateType) {
      newErrors.certificateType = 'Please select a certificate type';
    }
    if (!formData.purpose) {
      newErrors.purpose = 'Please specify the purpose';
    }
    if (!formData.quantity || parseInt(formData.quantity) < 1) {
      newErrors.quantity = 'Please enter a valid quantity';
    }
    if (!formData.urgency) {
      newErrors.urgency = 'Please select urgency level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotalFee = () => {
    const selectedUrgency = urgencyOptions.find(opt => opt.value === formData.urgency);
    const feePerCopy = selectedUrgency ? selectedUrgency.fee : 50;
    const quantity = parseInt(formData.quantity) || 1;
    return feePerCopy * quantity;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to submit a request');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const requestData = {
        user_id: user.id,
        certificate_type: formData.certificateType,
        purpose: formData.purpose,
        status: 'pending' as const,
        notes: formData.additionalNotes,
        amount: calculateTotalFee(),
        payment_amount: calculateTotalFee(), // Set payment_amount
        payment_status: 'pending' as 'pending' | 'paid' | 'failed' | 'refunded', // Initialize payment status
      };

      const { data, error } = await createCertificateRequest(requestData);

      if (error) {
        Alert.alert('Error', 'Failed to submit certificate request. Please try again.');
        console.error('Certificate request error:', error);
        return;
      }

      // Navigate to payment screen
      Alert.alert(
        'Request Submitted',
        `Your certificate request has been submitted successfully.\n\nTotal fee: ₱${calculateTotalFee()}\nRequest ID: ${data?.id?.slice(0, 8)}\n\nPlease proceed to payment to complete your request.`,
        [
          {
            text: 'Pay Now',
            onPress: () => {
              navigation.navigate('Payment', {
                certificateRequestId: data.id,
                amount: calculateTotalFee(),
                certificateType: formData.certificateType,
              });
              setFormData({
                certificateType: '',
                purpose: '',
                quantity: '1',
                urgency: '',
                additionalNotes: '',
              });
            }
          },
          {
            text: 'Pay Later',
            style: 'cancel',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (
    label: string,
    field: keyof CertificateRequest,
    placeholder: string,
    options?: {
      multiline?: boolean;
      numberOfLines?: number;
      keyboardType?: 'default' | 'numeric';
    }
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label} {field !== 'additionalNotes' && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          options?.multiline && styles.multilineInput,
          errors[field] && styles.inputError
        ]}
        value={formData[field]}
        onChangeText={(text) => handleInputChange(field, text)}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        {...options}
      />
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  const renderDropdown = (
    label: string,
    field: keyof CertificateRequest,
    options: string[] | any[],
    placeholder: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label} <Text style={styles.required}>*</Text>
      </Text>
      <View style={[styles.dropdownContainer, errors[field] && styles.inputError]}>
        {options.map((option, index) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          const isSelected = formData[field] === optionValue;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dropdownOption,
                isSelected && styles.selectedOption,
                index === options.length - 1 && styles.lastOption
              ]}
              onPress={() => handleInputChange(field, optionValue)}
            >
              <Text style={[
                styles.dropdownOptionText,
                isSelected && styles.selectedOptionText
              ]}>
                {optionLabel}
                {typeof option === 'object' && ` - ₱${option.fee}`}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark" size={moderateScale(16)} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={moderateScale(24)} color="white" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>Request Certificate</Text>
          </View>

          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text" size={moderateScale(32)} color={theme.colors.primary} />
            </View>
            <Text style={styles.formTitle}>Certificate Request Form</Text>
            <Text style={styles.formSubtitle}>
              Fill out the form below to request your certificate
            </Text>
          </View>

          {renderDropdown(
            'Certificate Type',
            'certificateType',
            certificateTypes,
            'Select certificate type'
          )}

          {renderInput(
            'Purpose',
            'purpose',
            'e.g., Employment, School requirements, etc.'
          )}

          {renderInput(
            'Number of Copies',
            'quantity',
            'Enter quantity',
            { keyboardType: 'numeric' }
          )}

          {renderDropdown(
            'Processing Time',
            'urgency',
            urgencyOptions,
            'Select processing time'
          )}

          {renderInput(
            'Additional Notes (Optional)',
            'additionalNotes',
            'Any special instructions or requirements',
            { multiline: true, numberOfLines: 4 }
          )}

          {/* Fee Summary */}
          {formData.urgency && formData.quantity && (
            <View style={styles.feeSection}>
              <View style={styles.feeHeader}>
                <Ionicons name="receipt-outline" size={moderateScale(20)} color={theme.colors.primary} />
                <Text style={styles.feeTitle}>Fee Summary</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Processing Type:</Text>
                <Text style={styles.feeValue}>{formData.urgency.split(' (')[0]}</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Quantity:</Text>
                <Text style={styles.feeValue}>{formData.quantity} copy/copies</Text>
              </View>
              <View style={[styles.feeRow, styles.totalFeeRow]}>
                <Text style={styles.totalFeeLabel}>Total Fee:</Text>
                <Text style={styles.totalFeeValue}>₱{calculateTotalFee()}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="send" size={moderateScale(16)} color="white" />
            )}
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Text>
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
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  headerRight: {
    width: moderateScale(40),
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(4),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(8),
    elevation: 5,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  formTitle: {
    fontSize: fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: verticalScale(20),
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  required: {
    color: theme.colors.error,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  multilineInput: {
    height: verticalScale(100),
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  selectedOption: {
    backgroundColor: theme.colors.primary + '10',
  },
  dropdownOptionText: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
    flex: 1,
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  feeSection: {
    backgroundColor: theme.colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  feeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  feeTitle: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginLeft: spacing.sm,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  feeLabel: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  feeValue: {
    fontSize: fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  totalFeeRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: 0,
  },
  totalFeeLabel: {
    fontSize: fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
  },
  totalFeeValue: {
    fontSize: fontSize.lg,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(4),
    elevation: 4,
  },
  submitButtonText: {
    color: 'white',
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginLeft: spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});