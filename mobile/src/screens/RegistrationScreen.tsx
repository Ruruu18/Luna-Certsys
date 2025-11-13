import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Animated,
  PanResponder,
  ImageBackground,
  ActivityIndicator,
  Modal,
} from 'react-native';

import StatusBarWrapper from '../components/StatusBarWrapper';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';
import { supabase } from '../lib/supabase';
import SimpleFaceCapture from '../components/SimpleFaceCapture';
import { uploadFacePhoto } from '../services/faceVerification';
import { createNotification } from '../services/notificationService';

interface RegistrationScreenProps {
  navigation: import('../types/navigation').AppNavigationProp;
}

export default function RegistrationScreen({ navigation }: RegistrationScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Set default birthdate to 25 years ago for better UX
  const getDefaultBirthDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 25);
    return date;
  };

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: getDefaultBirthDate(),
    placeOfBirth: '',
    suffix: '',
    gender: '',
    civilStatus: '',
    age: '',
    nationality: 'Filipino', // Default to Filipino
    purok: '',
    houseNumber: '',
    street: '',
    contactNo: '',
    address: '',
    email: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showSuffixDropdown, setShowSuffixDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showCivilStatusDropdown, setShowCivilStatusDropdown] = useState(false);
  const [showPurokDropdown, setShowPurokDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ [key: string]: 'up' | 'down' }>({});
  const [purokChairmen, setPurokChairmen] = useState<any[]>([]);
  const [loadingChairmen, setLoadingChairmen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facePhotoUri, setFacePhotoUri] = useState('');
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [verifyingFace, setVerifyingFace] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // Refs for all dropdown buttons to avoid conditional hook calls
  const suffixButtonRef = useRef<any>(null);
  const genderButtonRef = useRef<any>(null);
  const civilStatusButtonRef = useRef<any>(null);
  const purokButtonRef = useRef<any>(null);

  const suffixOptions = ['', 'Jr', 'Sr', 'II', 'III', 'IV', 'V'];
  const genderOptions = ['', 'Male', 'Female'];
  const civilStatusOptions = ['', 'Single', 'Married', 'Divorced', 'Widowed'];

  const totalSteps = 5; // Updated: Added face verification step

  // Fetch purok chairmen on component mount
  useEffect(() => {
    fetchPurokChairmen();
  }, []);

  const fetchPurokChairmen = async () => {
    try {
      setLoadingChairmen(true);

      const { data, error } = await supabase
        .rpc('get_public_purok_chairmen');

      if (error) throw error;

      setPurokChairmen(data || []);
    } catch (error: any) {
      console.error('Error fetching purok chairmen:', error);
      Alert.alert(
        'Error Loading Puroks',
        'Failed to load purok information. Please try again or contact admin.'
      );
    } finally {
      setLoadingChairmen(false);
    }
  };

  // Generate purok options for Purok 1-33
  const purokOptions = ['', ...Array.from({ length: 33 }, (_, i) => `Purok ${i + 1}`)];

  // Helper function to normalize purok for comparison (handles both "Purok 1" and "1" formats)
  const normalizePurok = (purok: string) => {
    if (!purok) return '';
    // Extract just the number from formats like "Purok 1" or "1"
    const match = purok.match(/\d+/);
    return match ? match[0] : purok;
  };

  // Get chairman name for selected purok
  const getChairmanForPurok = (purok: string) => {
    const normalizedPurok = normalizePurok(purok);
    const chairman = purokChairmen.find(c => normalizePurok(c.purok) === normalizedPurok);
    return chairman ? chairman.full_name : null;
  };

  const stepTitles = [
    'Personal Information',
    'Birth Details',
    'Address Information',
    'Contact Information',
    'Face Verification'
  ];

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age.toString();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        dateOfBirth: selectedDate,
        age: calculateAge(selectedDate)
      }));
      setErrors(prev => ({ ...prev, dateOfBirth: '' }));

      // Only auto-close on Android (iOS has Done button in modal)
      if (Platform.OS === 'android') {
        setTimeout(() => {
          setShowDatePicker(false);
        }, 100);
      }
    } else {
      // User cancelled (Android only)
      setShowDatePicker(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const animateToStep = (step: number) => {
    // Close all dropdowns when changing steps
    setShowSuffixDropdown(false);
    setShowGenderDropdown(false);
    setShowCivilStatusDropdown(false);
    setShowPurokDropdown(false);

    Animated.timing(slideAnim, {
      toValue: -step * dimensions.width,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setCurrentStep(step);
  };

  const closeAllDropdowns = () => {
    setShowSuffixDropdown(false);
    setShowGenderDropdown(false);
    setShowCivilStatusDropdown(false);
    setShowPurokDropdown(false);
  };

  const validateCurrentStep = () => {
    const newErrors: { [key: string]: string } = {};

    switch (currentStep) {
      case 0: // Personal Information
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        break;

      case 1: // Birth Details
        if (!formData.placeOfBirth.trim()) newErrors.placeOfBirth = 'Place of birth is required';
        if (!formData.nationality.trim()) newErrors.nationality = 'Nationality is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.civilStatus) newErrors.civilStatus = 'Civil status is required';
        break;

      case 2: // Address Information
        if (!formData.purok) newErrors.purok = 'Purok is required';
        if (!formData.houseNumber.trim()) newErrors.houseNumber = 'House number is required';
        if (!formData.street.trim()) newErrors.street = 'Street is required';
        if (!formData.address.trim()) newErrors.address = 'Complete address is required';
        break;

      case 3: // Contact & Finalize
        if (!formData.contactNo.trim()) {
          newErrors.contactNo = 'Contact number is required';
        } else {
          const phoneRegex = /^[0-9]{11}$/;
          if (!phoneRegex.test(formData.contactNo.replace(/\D/g, ''))) {
            newErrors.contactNo = 'Please enter a valid 11-digit phone number';
          }
        }

        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
          }
        }
        break;

      case 4: // Face Verification
        if (!facePhotoUri) {
          newErrors.face = 'Please complete face verification';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps - 1) {
        animateToStep(currentStep + 1);
      } else {
        handleRegister();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      animateToStep(currentStep - 1);
    }
  };

  const handleRegister = async () => {
    setIsSubmitting(true);

    try {
      // Validate face verification
      if (!facePhotoUri) {
        Alert.alert('Face Verification Required', 'Please complete face verification before submitting.');
        setIsSubmitting(false);
        return;
      }

      // Find the chairman for the selected purok (normalize to handle both "Purok 1" and "1" formats)
      const normalizedSelectedPurok = normalizePurok(formData.purok);
      const chairman = purokChairmen.find(c => normalizePurok(c.purok) === normalizedSelectedPurok);

      if (!chairman) {
        Alert.alert('Error', 'No Purok Chairman found for the selected purok. Please contact the admin.');
        setIsSubmitting(false);
        return;
      }

      // Upload face photo first (without creating user record)
      let facePhotoUrl = '';
      console.log('📸 Starting face photo upload...');
      console.log('Face photo URI:', facePhotoUri);

      try {
        const tempUserId = `pending_${Date.now()}`;
        console.log('Temp user ID for upload:', tempUserId);

        // Only upload photo, don't try to update users table yet
        const uploadResult = await uploadFacePhoto(facePhotoUri, tempUserId);
        console.log('Upload result:', uploadResult);

        if (uploadResult.error || !uploadResult.url) {
          throw new Error(uploadResult.error || 'Failed to upload face photo');
        }

        facePhotoUrl = uploadResult.url;
        console.log('✅ Face photo uploaded successfully!');
        console.log('Photo URL:', facePhotoUrl);
      } catch (uploadError: any) {
        console.error('Face photo upload error:', uploadError);
        Alert.alert(
          'Upload Failed',
          'Failed to upload face photo. Please try again.',
          [{ text: 'OK' }]
        );
        setIsSubmitting(false);
        return;
      }

      // Create pending registration request
      const { error } = await supabase
        .from('pending_registrations')
        .insert({
          first_name: formData.firstName,
          middle_name: formData.middleName || null,
          last_name: formData.lastName,
          suffix: formData.suffix || null,
          date_of_birth: formData.dateOfBirth.toISOString().split('T')[0],
          place_of_birth: formData.placeOfBirth,
          gender: formData.gender,
          civil_status: formData.civilStatus,
          age: parseInt(calculateAge(formData.dateOfBirth)),
          nationality: formData.nationality,
          purok: formData.purok,
          house_number: formData.houseNumber,
          street: formData.street,
          address: formData.address,
          phone_number: formData.contactNo,
          email: formData.email.toLowerCase(),
          purok_chairman_id: chairman.id,
          photo_url: facePhotoUrl,
          status: 'pending'
        });

      if (error) {
        console.error('Registration error:', error);

        // Handle duplicate email
        if (error.code === '23505' && error.message.includes('email')) {
          Alert.alert(
            'Email Already Used',
            'This email address is already registered or has a pending registration request. Please use a different email or contact your Purok Chairman.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', error.message || 'Failed to submit registration request');
        }
        setIsSubmitting(false);
        return;
      }

      // Create notification for the purok chairman
      try {
        await createNotification(
          chairman.id, // Send to chairman
          'New Registration Request',
          `${formData.firstName} ${formData.lastName} from ${formData.purok} has submitted a registration request.`,
          'new_registration',
          undefined,
          {
            resident_name: `${formData.firstName} ${formData.lastName}`,
            purok: formData.purok,
            email: formData.email,
          }
        );
        console.log('✅ Notification sent to chairman');
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
        // Don't block registration if notification fails
      }

      Alert.alert(
        'Registration Submitted! ✓',
        `Your registration request has been sent to ${chairman.full_name} (${formData.purok} Chairman) for approval.\n\nYou will receive a notification once your account is approved.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      console.error('Exception during registration:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View key={index} style={styles.progressStep}>
          <View
            style={[
              styles.progressDot,
              index <= currentStep ? styles.progressDotActive : styles.progressDotInactive,
            ]}
          >
            {index < currentStep ? (
              <Ionicons name="checkmark" size={12} color="white" />
            ) : (
              <Text style={styles.progressDotText}>{index + 1}</Text>
            )}
          </View>
          {index < totalSteps - 1 && (
            <View
              style={[
                styles.progressLine,
                index < currentStep ? styles.progressLineActive : styles.progressLineInactive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderInput = (
    label: string,
    field: keyof typeof formData,
    placeholder: string,
    options?: {
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      multiline?: boolean;
      numberOfLines?: number;
    }
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label} <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={[styles.input, errors[field as string] && styles.inputError]}
        value={formData[field] as string}
        onChangeText={(text: string) => handleInputChange(field as string, text)}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        {...options}
      />
      {errors[field as string] && (
        <Text style={styles.errorText}>{errors[field as string]}</Text>
      )}
    </View>
  );

  const handleDropdownToggle = (
    field: string,
    showDropdown: boolean,
    setShowDropdown: (show: boolean) => void,
    buttonRef: any
  ) => {
    closeAllDropdowns();

    if (!showDropdown && buttonRef.current) {
      // Measure button position to determine dropdown direction
      buttonRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        const screenHeight = dimensions.height;
        const dropdownHeight = 200; // Approximate max dropdown height
        const spaceBelow = screenHeight - (pageY + height);
        const spaceAbove = pageY;

        // Open upward if there's more space above or not enough space below
        const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

        setDropdownPosition(prev => ({
          ...prev,
          [field]: shouldOpenUpward ? 'up' : 'down'
        }));
      });
    }

    setShowDropdown(!showDropdown);
  };

  const renderCustomDropdown = (
    label: string,
    field: keyof typeof formData,
    options: string[],
    placeholder: string,
    isRequired: boolean = true,
    showDropdown: boolean,
    setShowDropdown: (show: boolean) => void,
    buttonRef: React.RefObject<any>
  ) => {
    const isUpward = dropdownPosition[field as string] === 'up';

    return (
      <View style={[styles.inputContainer, showDropdown && styles.inputContainerActive]}>
        <Text style={styles.label}>
          {label} {isRequired && <Text style={styles.required}>*</Text>}
        </Text>
        <TouchableOpacity
          ref={buttonRef}
          style={[styles.customDropdownButton, errors[field as string] && styles.inputError]}
          onPress={() => handleDropdownToggle(field as string, showDropdown, setShowDropdown, buttonRef)}
        >
          <Text style={[
            styles.dropdownButtonText,
            !formData[field] && styles.dropdownPlaceholder
          ]}>
            {formData[field] instanceof Date ? formData[field].toLocaleDateString() : (formData[field] || placeholder)}
          </Text>
          <Ionicons
            name={showDropdown ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        {showDropdown && (
          <View style={[
            styles.dropdownList,
            isUpward ? styles.dropdownListUp : styles.dropdownListDown
          ]}>
            <ScrollView
              style={styles.dropdownScrollView}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              bounces={false}
              indicatorStyle="black"
              onTouchStart={(e: any) => e.stopPropagation()}
              onScrollBeginDrag={(e: any) => e.stopPropagation()}
            >
              {!isRequired && (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    !formData[field] && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    handleInputChange(field as string, '');
                    setShowDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    !formData[field] && styles.dropdownItemTextSelected
                  ]}>
                    None (Optional)
                  </Text>
                  {!formData[field] && (
                    <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              {options.filter(option => option !== '').map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownItem,
                    formData[field] === option && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    handleInputChange(field as string, option);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    formData[field] === option && styles.dropdownItemTextSelected
                  ]}>
                    {option}
                  </Text>
                  {formData[field] === option && (
                    <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            {options.filter(option => option !== '').length > 3 && (
              <View style={styles.dropdownScrollHint}>
                <Text style={styles.dropdownScrollHintText}>Scroll for more options</Text>
                <Ionicons name="chevron-down" size={12} color={theme.colors.textSecondary} />
              </View>
            )}
          </View>
        )}

        {errors[field as string] && (
          <Text style={styles.errorText}>{errors[field as string]}</Text>
        )}
      </View>
    );
  };

  const renderPicker = (
    label: string,
    field: keyof typeof formData,
    options: string[],
    placeholder: string,
    isRequired: boolean = true
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label} {isRequired && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={[styles.pickerContainer, errors[field as string] && styles.inputError]}>
        <Picker
          selectedValue={formData[field] as string}
          onValueChange={(value: string) => handleInputChange(field as string, value)}
          style={styles.picker}
        >
          <Picker.Item label={placeholder} value="" color="#999" />
          {options.filter(option => option !== '').map((option) => (
            <Picker.Item key={option} label={option} value={option} />
          ))}
        </Picker>
      </View>
      {errors[field as string] && (
        <Text style={styles.errorText}>{errors[field as string]}</Text>
      )}
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Personal Information</Text>
            <Text style={styles.stepSubtitle}>Let's start with your basic details</Text>

            {renderInput('First Name', 'firstName', 'Enter your first name')}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Middle Name</Text>
              <TextInput
                style={[styles.input, errors.middleName && styles.inputError]}
                value={formData.middleName}
                onChangeText={(text: string) => handleInputChange('middleName', text)}
                placeholder="Enter your middle name (optional)"
                placeholderTextColor={theme.colors.textSecondary}
              />
              {errors.middleName && (
                <Text style={styles.errorText}>{errors.middleName}</Text>
              )}
            </View>
            {renderInput('Last Name', 'lastName', 'Enter your last name')}
            {renderCustomDropdown(
              'Suffix',
              'suffix',
              suffixOptions,
              'None selected',
              false,
              showSuffixDropdown,
              setShowSuffixDropdown,
              suffixButtonRef
            )}
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Birth Details</Text>
            <Text style={styles.stepSubtitle}>Tell us about your birth information</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[styles.dateButton, errors.dateOfBirth && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
                <Text style={styles.dateText}>
                  {formData.dateOfBirth.toLocaleDateString()}
                </Text>
                <Ionicons name="chevron-down" size={moderateScale(20)} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              {errors.dateOfBirth && (
                <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
              )}
            </View>

            {/* iOS Date Picker Modal */}
            {Platform.OS === 'ios' && showDatePicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <TouchableOpacity
                  style={styles.datePickerModalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowDatePicker(false)}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                    style={styles.datePickerModalContent}
                  >
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={styles.datePickerButtonContainer}
                      >
                        <Text style={styles.datePickerCancelButton}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={styles.datePickerButtonContainer}
                      >
                        <Text style={styles.datePickerDoneButton}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.datePickerContainer}>
                      <DateTimePicker
                        value={formData.dateOfBirth || getDefaultBirthDate()}
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

            {/* Android Date Picker */}
            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={formData.dateOfBirth || getDefaultBirthDate()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 120); return d; })()}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={calculateAge(formData.dateOfBirth)}
                editable={false}
                placeholder="Auto-calculated"
              />
            </View>

            {renderInput('Place of Birth', 'placeOfBirth', 'Where were you born?')}
            {renderInput('Nationality', 'nationality', 'Enter your nationality')}
            {renderCustomDropdown(
              'Gender',
              'gender',
              genderOptions,
              'Select your gender',
              true,
              showGenderDropdown,
              setShowGenderDropdown,
              genderButtonRef
            )}
            {renderCustomDropdown(
              'Civil Status',
              'civilStatus',
              civilStatusOptions,
              'Select your civil status',
              true,
              showCivilStatusDropdown,
              setShowCivilStatusDropdown,
              civilStatusButtonRef
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Address Information</Text>
            <Text style={styles.stepSubtitle}>Where do you currently live?</Text>

            {loadingChairmen ? (
              <View style={styles.loadingChairmenContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingChairmenText}>Loading purok information...</Text>
              </View>
            ) : purokChairmen.length === 0 ? (
              <View style={styles.noChairmenContainer}>
                <Ionicons name="alert-circle-outline" size={moderateScale(32)} color={theme.colors.warning} />
                <Text style={styles.noChairmenText}>No Purok Chairman available</Text>
                <Text style={styles.noChairmenSubtext}>Please contact the admin to set up a purok chairman</Text>
              </View>
            ) : (
              <>
                {renderCustomDropdown(
                  'Purok',
                  'purok',
                  purokOptions,
                  'Select your purok',
                  true,
                  showPurokDropdown,
                  setShowPurokDropdown,
                  purokButtonRef
                )}

                {formData.purok && getChairmanForPurok(formData.purok) && (
                  <View style={styles.chairmanInfoCard}>
                    <Ionicons name="person-circle" size={moderateScale(32)} color={theme.colors.primary} />
                    <View style={styles.chairmanInfoText}>
                      <Text style={styles.chairmanLabel}>Your Purok Chairman:</Text>
                      <Text style={styles.chairmanName}>{getChairmanForPurok(formData.purok)}</Text>
                      <Text style={styles.chairmanNote}>
                        Your registration will be sent to this chairman for approval
                      </Text>
                    </View>
                  </View>
                )}

                {formData.purok && !getChairmanForPurok(formData.purok) && (
                  <View style={[styles.chairmanInfoCard, { backgroundColor: theme.colors.warning + '10', borderColor: theme.colors.warning + '30' }]}>
                    <Ionicons name="information-circle" size={moderateScale(32)} color={theme.colors.warning} />
                    <View style={styles.chairmanInfoText}>
                      <Text style={[styles.chairmanLabel, { color: theme.colors.warning }]}>No Chairman Assigned</Text>
                      <Text style={styles.chairmanNote}>
                        Your purok doesn't have a chairman yet. Your registration will be reviewed by the barangay administrator.
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {renderInput('House Number', 'houseNumber', 'House #')}
              </View>
              <View style={styles.halfWidth}>
                {renderInput('Street', 'street', 'Street name')}
              </View>
            </View>

            {renderInput('Complete Address', 'address', 'Enter your complete address', {
              multiline: true,
              numberOfLines: 3
            })}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Contact Information</Text>
            <Text style={styles.stepSubtitle}>How can we reach you?</Text>

            {renderInput('Contact Number', 'contactNo', '09XXXXXXXXX', {
              keyboardType: 'phone-pad'
            })}

            {renderInput('Email Address', 'email', 'your@email.com', {
              keyboardType: 'email-address'
            })}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Face Verification</Text>
            <Text style={styles.stepSubtitle}>Take a selfie to verify your identity</Text>

            {facePhotoUri ? (
              <View style={styles.faceVerificationSuccess}>
                <View style={styles.successIconContainer}>
                  <Ionicons name="checkmark-circle" size={moderateScale(64)} color={theme.colors.success} />
                </View>
                <Text style={styles.successTitle}>Face Verified!</Text>
                <Text style={styles.successMessage}>
                  Your identity has been verified successfully.
                </Text>

                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryTitle}>Review your information:</Text>
                  <Text style={styles.summaryText}>
                    {formData.firstName} {formData.middleName} {formData.lastName} {formData.suffix}
                  </Text>
                  <Text style={styles.summaryText}>
                    Born: {formData.dateOfBirth.toLocaleDateString()} in {formData.placeOfBirth}
                  </Text>
                  <Text style={styles.summaryText}>
                    {formData.gender}, {formData.civilStatus}
                  </Text>
                  <Text style={styles.summaryText}>
                    {formData.houseNumber} {formData.street}, {formData.purok}
                  </Text>
                  <Text style={styles.summaryText}>
                    {formData.contactNo} • {formData.email}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={() => {
                    setFacePhotoUri('');
                    setShowFaceCapture(true);
                  }}
                  disabled={verifyingFace}
                >
                  <Ionicons name="camera-outline" size={moderateScale(20)} color={theme.colors.primary} />
                  <Text style={styles.retakeButtonText}>Retake Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.faceVerificationPrompt}>
                <View style={styles.faceIconContainer}>
                  <Ionicons name="person-circle-outline" size={moderateScale(100)} color={theme.colors.primary} />
                </View>

                <Text style={styles.facePromptTitle}>Verify Your Identity</Text>
                <Text style={styles.facePromptMessage}>
                  We need to verify your identity with a quick selfie. This helps ensure security and is used for official certificates.
                </Text>

                <View style={styles.faceRequirements}>
                  <Text style={styles.requirementsTitle}>Requirements:</Text>
                  <View style={styles.requirement}>
                    <Ionicons name="checkmark-circle-outline" size={moderateScale(20)} color={theme.colors.success} />
                    <Text style={styles.requirementText}>Face the camera directly</Text>
                  </View>
                  <View style={styles.requirement}>
                    <Ionicons name="checkmark-circle-outline" size={moderateScale(20)} color={theme.colors.success} />
                    <Text style={styles.requirementText}>Ensure good lighting</Text>
                  </View>
                  <View style={styles.requirement}>
                    <Ionicons name="checkmark-circle-outline" size={moderateScale(20)} color={theme.colors.success} />
                    <Text style={styles.requirementText}>Remove sunglasses or mask</Text>
                  </View>
                  <View style={styles.requirement}>
                    <Ionicons name="checkmark-circle-outline" size={moderateScale(20)} color={theme.colors.success} />
                    <Text style={styles.requirementText}>Look at the camera</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.startCaptureButton}
                  onPress={() => setShowFaceCapture(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={moderateScale(24)} color="white" />
                  <Text style={styles.startCaptureButtonText}>Start Face Verification</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBarWrapper style="light" />
      <ImageBackground
        source={require('../../assets/images/backdrop.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={moderateScale(24)} color="white" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>Registration</Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.stepIndicator}>
              {currentStep + 1} of {totalSteps}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Content */}
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.stepsContainer,
              {
                transform: [{ translateX: slideAnim }],
                width: dimensions.width * totalSteps,
              },
            ]}
          >
            {Array.from({ length: totalSteps }).map((_, index) => (
              <View key={index} style={styles.stepWrapper}>
                <ScrollView
                  style={styles.stepScrollView}
                  contentContainerStyle={styles.stepScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {index === currentStep && renderStep()}
                </ScrollView>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.prevButton} onPress={handlePrevious}>
              <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
              <Text style={styles.prevButtonText}>Previous</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              currentStep === 0 && styles.nextButtonFull,
              isSubmitting && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="white" style={{ marginRight: spacing.sm }} />
                <Text style={styles.nextButtonText}>Submitting...</Text>
              </>
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep === totalSteps - 1 ? 'Submit Request' : 'Next'}
                </Text>
                {currentStep < totalSteps - 1 && (
                  <Ionicons name="chevron-forward" size={20} color="white" />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
        </View>
      </ImageBackground>

      {/* Face Capture Modal */}
      {showFaceCapture && (
        <Modal
          visible={showFaceCapture}
          animationType="slide"
          onRequestClose={() => setShowFaceCapture(false)}
        >
          <SimpleFaceCapture
            onCapture={(photoUri) => {
              setShowFaceCapture(false);
              setFacePhotoUri(photoUri);
              Alert.alert(
                'Success!',
                'Face captured successfully! Your photo has been cropped and optimized. You can now proceed with registration.',
                [{ text: 'OK' }]
              );
            }}
            onCancel={() => setShowFaceCapture(false)}
          />
        </Modal>
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
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? verticalScale(60) : verticalScale(20),
    paddingBottom: verticalScale(15),
  },
  backButton: {
    padding: spacing.xs,
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
    marginHorizontal: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
    textAlign: 'center',
  },
  headerRight: {
    minWidth: moderateScale(40),
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  stepIndicator: {
    color: 'white',
    fontSize: fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: verticalScale(12),
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
  },
  progressDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotText: {
    color: 'white',
    fontSize: fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
  },
  progressLine: {
    height: 2,
    width: scale(40),
  },
  progressLineActive: {
    backgroundColor: theme.colors.primary,
  },
  progressLineInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  stepsContainer: {
    flexDirection: 'row',
    height: '100%',
  },
  stepWrapper: {
    width: dimensions.width,
    paddingHorizontal: spacing.md,
  },
  stepScrollView: {
    flex: 1,
  },
  stepScrollContent: {
    paddingBottom: verticalScale(20),
    flexGrow: 1,
  },
  stepContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    marginVertical: spacing.sm,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(4),
    },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(4.65),
  },
  stepTitle: {
    fontSize: moderateScale(22),
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: verticalScale(6),
  },
  stepSubtitle: {
    fontSize: moderateScale(14),
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  inputContainer: {
    marginBottom: verticalScale(14),
    position: 'relative',
    zIndex: 1,
  },
  inputContainerActive: {
    zIndex: 9999,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  required: {
    color: theme.colors.error,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: verticalScale(10),
    fontSize: moderateScale(15),
    fontFamily: theme.fontFamily.regular,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    color: theme.colors.text,
    minHeight: moderateScale(48),
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  disabledInput: {
    backgroundColor: '#F8F9FA',
    color: theme.colors.textSecondary,
  },
  errorText: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  picker: {
    height: moderateScale(50),
  },
  customDropdownButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: moderateScale(50),
  },
  dropdownButtonText: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: theme.colors.textSecondary,
  },
  dropdownList: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: borderRadius.md,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(6),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E8E8E8',
    maxHeight: verticalScale(200),
    zIndex: 1000,
    overflow: 'hidden',
  },
  dropdownListDown: {
    top: '100%',
    marginTop: spacing.xs,
  },
  dropdownListUp: {
    bottom: '100%',
    marginBottom: spacing.xs,
  },
  dropdownScrollView: {
    maxHeight: verticalScale(200),
  },
  dropdownScrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 0.5,
    borderTopColor: '#E8E8E8',
  },
  dropdownScrollHintText: {
    fontSize: fontSize.xs,
    color: theme.colors.textSecondary,
    marginRight: spacing.xs,
    fontStyle: 'italic',
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
    minHeight: moderateScale(44),
  },
  dropdownItemSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  dropdownItemText: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  dateButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: moderateScale(50),
    gap: spacing.sm,
  },
  dateText: {
    fontSize: fontSize.md,
    color: theme.colors.text,
    flex: 1,
    marginLeft: spacing.sm,
  },
  calendarIconButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: theme.colors.primary + '15',
    marginLeft: spacing.sm,
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: Platform.OS === 'ios' ? verticalScale(34) : verticalScale(20),
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  datePickerButtonContainer: {
    width: scale(70),
  },
  datePickerCancelButton: {
    fontSize: fontSize.md,
    color: theme.colors.textSecondary,
    fontFamily: theme.fontFamily.regular,
    textAlign: 'left',
  },
  datePickerTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  datePickerDoneButton: {
    fontSize: fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    textAlign: 'right',
  },
  iosDatePickerSpinner: {
    width: '100%',
    height: verticalScale(216),
  },
  datePickerContainer: {
    height: 216, // Standard iOS picker height
    backgroundColor: 'white',
    width: '100%',
  },
  iosDatePicker: {
    backgroundColor: 'white',
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    overflow: 'hidden',
    maxWidth: '100%',
    alignSelf: 'center',
    transform: [{ scale: dimensions.width < 375 ? 0.75 : 0.85 }],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  summaryContainer: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  summaryTitle: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.primary,
    marginBottom: spacing.md,
  },
  summaryText: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: verticalScale(12),
    paddingBottom: Platform.OS === 'ios' ? verticalScale(20) : verticalScale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(3.84),
    minHeight: moderateScale(48),
  },
  prevButtonText: {
    color: theme.colors.primary,
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginLeft: spacing.xs,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(3.84),
    minHeight: moderateScale(48),
  },
  nextButtonFull: {
    flex: 1,
    justifyContent: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    marginRight: spacing.xs,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  chairmanInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: verticalScale(14),
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  chairmanInfoText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  chairmanLabel: {
    fontSize: fontSize.xs,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  chairmanName: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.primary,
    marginBottom: spacing.xs / 2,
  },
  chairmanNote: {
    fontSize: fontSize.xs,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  loadingChairmenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: verticalScale(14),
  },
  loadingChairmenText: {
    marginLeft: spacing.md,
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  noChairmenContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: theme.colors.warning + '10',
    borderRadius: borderRadius.md,
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
  },
  noChairmenText: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.warning,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  noChairmenSubtext: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  // Face Verification Styles
  faceVerificationSuccess: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  successIconContainer: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.success,
    marginBottom: spacing.sm,
  },
  successMessage: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  retakeButtonText: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.primary,
  },
  faceVerificationPrompt: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  faceIconContainer: {
    marginBottom: spacing.lg,
  },
  facePromptTitle: {
    fontSize: fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  facePromptMessage: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    lineHeight: moderateScale(22),
  },
  faceRequirements: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.xl,
  },
  requirementsTitle: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  requirementText: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
    flex: 1,
  },
  startCaptureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(3.84),
    gap: spacing.sm,
    width: '100%',
  },
  startCaptureButtonText: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
  },
});
