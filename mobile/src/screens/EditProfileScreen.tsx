import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  Modal,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../lib/supabase';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { ExtendedUserProfile, UserProfileUpdateData } from '../types/user';

interface EditProfileScreenProps {
  navigation: import('../types/navigation').AppNavigationProp;
}

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const extendedUser = user as ExtendedUserProfile;

  const [formData, setFormData] = useState({
    first_name: extendedUser?.first_name || '',
    last_name: extendedUser?.last_name || '',
    middle_name: extendedUser?.middle_name || '',
    suffix: extendedUser?.suffix || '',
    phone_number: extendedUser?.phone_number || '',
    address: extendedUser?.address || '',
    date_of_birth: extendedUser?.date_of_birth || '',
    place_of_birth: extendedUser?.place_of_birth || '',
    gender: extendedUser?.gender || '',
    civil_status: extendedUser?.civil_status || '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showCivilStatusPicker, setShowCivilStatusPicker] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // On Android, close the picker after selection
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    // On iOS, keep modal open (user closes with Cancel/Done buttons)

    if (selectedDate) {
      // Format date in Philippines timezone to avoid timezone shifting
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      handleInputChange('date_of_birth', formattedDate);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Invalid phone number format';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Certificate fields validation (optional but recommended)
    if (formData.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(formData.date_of_birth)) {
      newErrors.date_of_birth = 'Invalid date format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setLoading(true);
    try {
      const updateData: UserProfileUpdateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        middle_name: formData.middle_name.trim() || undefined,
        suffix: formData.suffix.trim() || undefined,
        phone_number: formData.phone_number.trim(),
        address: formData.address.trim(),
        date_of_birth: formData.date_of_birth || undefined,
        place_of_birth: formData.place_of_birth.trim() || undefined,
        gender: formData.gender as any || undefined,
        civil_status: formData.civil_status as any || undefined,
      };

      const { error } = await updateUserProfile(user.id, updateData);

      if (error) {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
        console.error('Update profile error:', error);
      } else {
        if (refreshUser) {
          await refreshUser();
        }
        Alert.alert(
          'Success',
          'Your profile has been updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    field: string,
    placeholder: string,
    icon: string,
    options?: {
      multiline?: boolean;
      keyboardType?: 'default' | 'phone-pad' | 'email-address';
      required?: boolean;
    }
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label}
        {options?.required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={[styles.inputWrapper, errors[field] && styles.inputError]}>
        <Ionicons name={icon as any} size={moderateScale(20)} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.input, options?.multiline && styles.multilineInput]}
          value={formData[field]}
          onChangeText={(text) => handleInputChange(field, text)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          editable={!loading}
          {...options}
        />
      </View>
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  const renderPicker = (
    label: string,
    field: string,
    icon: string,
    options: string[],
    showModal: boolean,
    setShowModal: (show: boolean) => void,
    required?: boolean
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[styles.inputWrapper, errors[field] && styles.inputError]}
        onPress={() => setShowModal(true)}
        disabled={loading}
      >
        <Ionicons name={icon as any} size={moderateScale(20)} color={theme.colors.textSecondary} />
        <Text style={[
          styles.dateText,
          !formData[field] && styles.placeholderText
        ]}>
          {formData[field] || `Select ${label}`}
        </Text>
        <Ionicons name="chevron-down" size={moderateScale(20)} color={theme.colors.textSecondary} />
      </TouchableOpacity>
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}

      {/* Modal Picker */}
      {Platform.OS === 'ios' && showModal && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showModal}
          onRequestClose={() => setShowModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalCancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select {label}</Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalDoneButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={formData[field]}
                onValueChange={(value) => handleInputChange(field, value as string)}
                itemStyle={styles.pickerItemStyle}
              >
                <Picker.Item label={`Select ${label}`} value="" />
                {options.map((option) => (
                  <Picker.Item key={option} label={option} value={option} />
                ))}
              </Picker>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Android Picker (inline) */}
      {Platform.OS === 'android' && showModal && (
        <View style={styles.androidPickerContainer}>
          <Picker
            selectedValue={formData[field]}
            onValueChange={(value) => {
              handleInputChange(field, value as string);
              setShowModal(false);
            }}
            style={styles.androidPicker}
          >
            <Picker.Item label={`Select ${label}`} value="" />
            {options.map((option) => (
              <Picker.Item key={option} label={option} value={option} />
            ))}
          </Picker>
        </View>
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
            <Text style={styles.title}>Edit Profile</Text>
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
          {/* Face Verification Display (Read-Only) */}
          <View style={styles.photoSection}>
            <View style={styles.photoWrapper}>
              <View style={styles.photoContainer}>
                {extendedUser?.photo_url ? (
                  <Image source={{ uri: extendedUser.photo_url }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="person" size={moderateScale(40)} color={theme.colors.textSecondary} />
                  </View>
                )}
              </View>
              {extendedUser?.face_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={moderateScale(28)} color={theme.colors.success} />
                </View>
              )}
            </View>
            {extendedUser?.face_verified ? (
              <View style={styles.verificationStatus}>
                <Ionicons name="shield-checkmark" size={moderateScale(16)} color={theme.colors.success} />
                <Text style={styles.verifiedText}>Face Verified</Text>
              </View>
            ) : (
              <Text style={styles.photoHint}>Complete registration to verify your face</Text>
            )}
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            {renderInput(
              'First Name',
              'first_name',
              'Enter your first name',
              'person-outline',
              { required: true }
            )}

            {renderInput(
              'Last Name',
              'last_name',
              'Enter your last name',
              'person-outline',
              { required: true }
            )}

            {renderInput(
              'Middle Name',
              'middle_name',
              'Enter your middle name (optional)',
              'person-outline'
            )}

            {renderInput(
              'Suffix',
              'suffix',
              'Jr., Sr., III, etc. (optional)',
              'text-outline'
            )}

            {renderInput(
              'Phone Number',
              'phone_number',
              'Enter your phone number',
              'call-outline',
              { keyboardType: 'phone-pad', required: true }
            )}

            {renderInput(
              'Address',
              'address',
              'Enter your complete address',
              'location-outline',
              { multiline: true, required: true }
            )}
          </View>

          {/* Certificate Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certificate Information</Text>
            <Text style={styles.sectionSubtitle}>
              Required for generating official certificates
            </Text>

            {/* Date of Birth */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={[styles.inputWrapper, errors.date_of_birth && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <Ionicons name="calendar-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
                <Text style={[styles.dateText, !formData.date_of_birth && styles.placeholderText]}>
                  {formData.date_of_birth || 'Select date of birth'}
                </Text>
                <Ionicons name="chevron-down" size={moderateScale(20)} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              {errors.date_of_birth && (
                <Text style={styles.errorText}>{errors.date_of_birth}</Text>
              )}
            </View>

            {/* Date Picker Modal for iOS */}
            {Platform.OS === 'ios' && showDatePicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowDatePicker(false)}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                    style={styles.modalContent}
                  >
                    <View style={styles.modalHeader}>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={styles.modalButton}
                      >
                        <Text style={styles.modalCancelButton}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.modalTitle}>Select Date of Birth</Text>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={styles.modalButton}
                      >
                        <Text style={styles.modalDoneButton}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.datePickerContainer}>
                      <DateTimePicker
                        value={
                          formData.date_of_birth
                            ? new Date(formData.date_of_birth + 'T00:00:00')
                            : (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 25); return d; })()
                        }
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                        minimumDate={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 120); return d; })()}
                        maximumDate={new Date()}
                        locale="en-US"
                        textColor="black"
                      />
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>
            )}

            {/* Date Picker for Android */}
            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={
                  formData.date_of_birth
                    ? new Date(formData.date_of_birth + 'T00:00:00')
                    : (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 25); return d; })()
                }
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 120); return d; })()}
                maximumDate={new Date()}
              />
            )}

            {renderInput(
              'Place of Birth',
              'place_of_birth',
              'Enter your place of birth',
              'location-outline'
            )}

            {renderPicker(
              'Gender',
              'gender',
              'male-female-outline',
              ['Male', 'Female', 'Other'],
              showGenderPicker,
              setShowGenderPicker
            )}

            {renderPicker(
              'Civil Status',
              'civil_status',
              'heart-outline',
              ['Single', 'Married', 'Widowed', 'Divorced', 'Separated'],
              showCivilStatusPicker,
              setShowCivilStatusPicker
            )}
          </View>

          {/* Read-only fields */}
          <View style={styles.readOnlySection}>
            <Text style={styles.readOnlyLabel}>Email (Cannot be changed)</Text>
            <View style={styles.readOnlyField}>
              <Ionicons name="mail-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
              <Text style={styles.readOnlyText}>{user?.email || 'N/A'}</Text>
            </View>

            {user?.purok && (
              <>
                <Text style={styles.readOnlyLabel}>Purok (Cannot be changed)</Text>
                <View style={styles.readOnlyField}>
                  <Ionicons name="business-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
                  <Text style={styles.readOnlyText}>{user.purok}</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="checkmark-circle" size={moderateScale(20)} color="white" />
              )}
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photoWrapper: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  photoContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(60),
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: moderateScale(60),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  photoHint: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: moderateScale(20),
    width: moderateScale(32),
    height: moderateScale(32),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(3),
    elevation: 4,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  verifiedText: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.medium,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.success,
    marginLeft: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: spacing.lg,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
    paddingVertical: spacing.sm,
  },
  multilineInput: {
    minHeight: verticalScale(80),
    textAlignVertical: 'top',
  },
  dateText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
    paddingVertical: spacing.sm,
  },
  placeholderText: {
    color: theme.colors.textTertiary,
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
  readOnlySection: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  readOnlyLabel: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: spacing.sm,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  readOnlyText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  saveButton: {
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginLeft: spacing.xs,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  // Modal Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: Platform.OS === 'ios' ? verticalScale(34) : verticalScale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  modalButton: {
    width: scale(70),
  },
  modalCancelButton: {
    fontSize: fontSize.md,
    color: theme.colors.textSecondary,
    fontFamily: theme.fontFamily.regular,
    textAlign: 'left',
  },
  modalTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  modalDoneButton: {
    fontSize: fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    textAlign: 'right',
  },
  pickerItemStyle: {
    fontSize: moderateScale(16),
    height: moderateScale(120),
  },
  androidPickerContainer: {
    marginTop: spacing.sm,
  },
  androidPicker: {
    backgroundColor: theme.colors.background,
  },
  datePickerContainer: {
    height: 216, // Standard iOS picker height
    backgroundColor: 'white',
    width: '100%',
  },
});
