// @ts-nocheck
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
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { createCertificateRequest } from '../lib/supabase';

interface RequestCertificateScreenProps {
  navigation: any;
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
    'Certificate of Good Moral Character',
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
        amount: calculateTotalFee()
      };

      const { data, error } = await createCertificateRequest(requestData);

      if (error) {
        Alert.alert('Error', 'Failed to submit certificate request. Please try again.');
        console.error('Certificate request error:', error);
        return;
      }

      Alert.alert(
        'Request Submitted',
        `Your certificate request has been submitted successfully. Total fee: ₱${calculateTotalFee()}. Request ID: ${data?.id?.slice(0, 8)}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setFormData({
                certificateType: '',
                purpose: '',
                quantity: '1',
                urgency: '',
                additionalNotes: '',
              });
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
                <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
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
      <StatusBar style="light" backgroundColor={theme.colors.primary} />
      
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
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Request Certificate</Text>
          
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
              <Ionicons name="document-text" size={32} color={theme.colors.primary} />
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
                <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
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
              <Ionicons name="send" size={16} color="white" />
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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  formTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  formSubtitle: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.error,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.regular,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
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
    fontSize: theme.fontSize.md,
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
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  feeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  feeTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  feeLabel: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  feeValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  totalFeeRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginBottom: 0,
  },
  totalFeeLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semibold,
  },
  totalFeeValue: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    color: 'white',
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semibold,
    marginLeft: theme.spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});