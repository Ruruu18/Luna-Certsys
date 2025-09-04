// @ts-nocheck
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
  Animated,
  PanResponder,
  ImageBackground,
} from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

interface RegistrationScreenProps {
  navigation: any;
}

export default function RegistrationScreen({ navigation }: RegistrationScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: new Date(),
    placeOfBirth: '',
    suffix: '',
    gender: '',
    civilStatus: '',
    age: '',
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
  const purokOptions = [
    '', 'Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5',
    'Purok 6', 'Purok 7', 'Purok 8', 'Purok 9', 'Purok 10'
  ];

  const totalSteps = 4;

  const stepTitles = [
    'Personal Information',
    'Birth Details',
    'Address Information',
    'Contact & Finalize'
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
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        dateOfBirth: selectedDate,
        age: calculateAge(selectedDate)
      }));
      setErrors(prev => ({ ...prev, dateOfBirth: '' }));
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
      toValue: -step * screenWidth,
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

  const handleRegister = () => {
    Alert.alert(
      'Registration Successful',
      'Your account has been created successfully!',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login')
        }
      ]
    );
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

    if (!showDropdown) {
      // Always set dropdown to open upward for better UX
      setDropdownPosition(prev => ({
        ...prev,
        [field]: 'up'
      }));
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
      <View style={styles.inputContainer}>
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
            {formData[field] || placeholder}
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
              <View style={[styles.dateButton, errors.dateOfBirth && styles.inputError]}>
                <Text style={styles.dateText}>
                  {formData.dateOfBirth.toLocaleDateString()}
                </Text>
                <TouchableOpacity
                  style={styles.calendarIconButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.dateOfBirth}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
              {errors.dateOfBirth && (
                <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
              )}
            </View>

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
            <Text style={styles.stepTitle}>Contact & Finalize</Text>
            <Text style={styles.stepSubtitle}>Almost done! Just need your contact details</Text>

            {renderInput('Contact Number', 'contactNo', '09XXXXXXXXX', {
              keyboardType: 'phone-pad'
            })}

            {renderInput('Email Address', 'email', 'your@email.com', {
              keyboardType: 'email-address'
            })}

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
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
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
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Registration</Text>
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
                width: screenWidth * totalSteps,
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
            style={[styles.nextButton, currentStep === 0 && styles.nextButtonFull]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === totalSteps - 1 ? 'Complete Registration' : 'Next'}
            </Text>
            {currentStep < totalSteps - 1 && (
              <Ionicons name="chevron-forward" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
        </View>
      </ImageBackground>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: theme.spacing.md,
  },
  headerRight: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  stepIndicator: {
    color: 'white',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
  },
  progressDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotText: {
    color: 'white',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
  },
  progressLine: {
    height: 2,
    width: 40,
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
    width: screenWidth,
    paddingHorizontal: theme.spacing.lg,
  },
  stepScrollView: {
    flex: 1,
  },
  stepScrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  stepContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  stepTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  stepSubtitle: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
    position: 'relative',
    zIndex: 1,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.error,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.regular,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    color: theme.colors.text,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  disabledInput: {
    backgroundColor: '#F8F9FA',
    color: theme.colors.textSecondary,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  picker: {
    height: 50,
  },
  customDropdownButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  dropdownButtonText: {
    fontSize: theme.fontSize.md,
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
    borderRadius: theme.borderRadius.md,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    maxHeight: 200,
    zIndex: 1000,
    overflow: 'hidden',
  },
  dropdownListDown: {
    top: '100%',
    marginTop: theme.spacing.xs,
  },
  dropdownListUp: {
    bottom: '100%',
    marginBottom: theme.spacing.xs,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownScrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 0.5,
    borderTopColor: '#E8E8E8',
  },
  dropdownScrollHintText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.xs,
    fontStyle: 'italic',
  },
  dropdownItem: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
    minHeight: 48,
  },
  dropdownItemSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  dropdownItemText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  dateButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    flex: 1,
  },
  calendarIconButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary + '15',
    marginLeft: theme.spacing.sm,
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
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  summaryTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  summaryText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  prevButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginLeft: theme.spacing.xs,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  nextButtonFull: {
    flex: 1,
    justifyContent: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    marginRight: theme.spacing.xs,
  },
});
