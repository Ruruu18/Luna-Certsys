import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Image,
  Platform,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase, User } from '../lib/supabase';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';
import { sendPasswordEmail } from '../services/emailService';

interface ManageResidentsScreenProps {
  navigation: any;
}

export default function ManageResidentsScreen({ navigation }: ManageResidentsScreenProps) {
  const { user } = useAuth();
  const [residents, setResidents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuffixDropdown, setShowSuffixDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showCivilStatusDropdown, setShowCivilStatusDropdown] = useState(false);

  const getDefaultBirthDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 25);
    return date;
  };

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    date_of_birth: getDefaultBirthDate(),
    place_of_birth: '',
    gender: '',
    civil_status: '',
    age: '',
    nationality: 'Filipino',
    house_number: '',
    street: '',
    address: '',
    email: '',
    phone_number: '',
  });

  const suffixOptions = ['', 'Jr', 'Sr', 'II', 'III', 'IV', 'V'];
  const genderOptions = ['', 'Male', 'Female'];
  const civilStatusOptions = ['', 'Single', 'Married', 'Divorced', 'Widowed'];

  useEffect(() => {
    if (user?.role === 'purok_chairman') {
      fetchResidents();
    }
  }, [user]);

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
        date_of_birth: selectedDate,
        age: calculateAge(selectedDate)
      }));

      if (Platform.OS === 'android') {
        setTimeout(() => {
          setShowDatePicker(false);
        }, 100);
      }
    } else {
      setShowDatePicker(false);
    }
  };

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('purok_chairman_id', user?.id)
        .eq('role', 'resident')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResidents(data || []);
    } catch (error) {
      console.error('Error fetching residents:', error);
      Alert.alert('Error', 'Failed to load residents');
    } finally {
      setLoading(false);
    }
  };

  const handleAddResident = async () => {
    // Validate required fields
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone_number ||
        !formData.place_of_birth || !formData.gender || !formData.civil_status ||
        !formData.house_number || !formData.street || !formData.address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const phoneRegex = /^[0-9]{11}$/;
    if (!phoneRegex.test(formData.phone_number.replace(/\D/g, ''))) {
      Alert.alert('Error', 'Please enter a valid 11-digit phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate a temporary password (user will need to reset it)
      const tempPassword = Math.random().toString(36).substring(2, 15);

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile with complete details
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            first_name: formData.first_name,
            middle_name: formData.middle_name || null,
            last_name: formData.last_name,
            suffix: formData.suffix || null,
            date_of_birth: formData.date_of_birth.toISOString().split('T')[0],
            place_of_birth: formData.place_of_birth,
            gender: formData.gender,
            civil_status: formData.civil_status,
            age: parseInt(calculateAge(formData.date_of_birth)),
            nationality: formData.nationality,
            house_number: formData.house_number,
            street: formData.street,
            address: formData.address,
            phone_number: formData.phone_number,
            role: 'resident',
            purok: user?.purok,
            purok_chairman_id: user?.id,
          });

        if (profileError) throw profileError;

        // Send welcome email with password
        const fullName = `${formData.first_name} ${formData.middle_name ? formData.middle_name + ' ' : ''}${formData.last_name}${formData.suffix ? ' ' + formData.suffix : ''}`.trim();

        console.log('📧 Sending welcome email to:', formData.email);
        const emailResult = await sendPasswordEmail({
          recipientEmail: formData.email,
          recipientName: fullName,
          password: tempPassword,
          purokChairmanName: user?.full_name || 'Your Purok Chairman',
        });

        let alertMessage = '';
        if (emailResult.success) {
          alertMessage = `Resident added successfully!\n\n✅ Welcome email sent to ${formData.email}\n\nTemporary Password: ${tempPassword}\n\nThe resident will receive login instructions via email.`;
        } else {
          alertMessage = `Resident added successfully!\n\n⚠️ Email failed to send: ${emailResult.error}\n\nTemporary Password: ${tempPassword}\n\nPlease share this password with the resident manually.`;
        }

        Alert.alert(
          'Success',
          alertMessage,
          [
            {
              text: 'OK',
              onPress: () => {
                setModalVisible(false);
                setFormData({
                  first_name: '',
                  middle_name: '',
                  last_name: '',
                  suffix: '',
                  date_of_birth: getDefaultBirthDate(),
                  place_of_birth: '',
                  gender: '',
                  civil_status: '',
                  age: '',
                  nationality: 'Filipino',
                  house_number: '',
                  street: '',
                  address: '',
                  email: '',
                  phone_number: '',
                });
                fetchResidents();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error adding resident:', error);
      Alert.alert('Error', error.message || 'Failed to add resident');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderResident = ({ item }: { item: User }) => {
    const extendedItem = item as any;
    const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.full_name || 'User') + '&size=200&background=4A90E2&color=fff';

    return (
      <TouchableOpacity
        style={styles.residentCard}
        onPress={() => navigation.navigate('ViewResident', { resident: item })}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: extendedItem.photo_url || defaultAvatar }}
          style={styles.residentAvatar}
          onError={(e) => {
            console.log('Image load error:', e);
          }}
        />
        <View style={styles.residentInfo}>
          <Text style={styles.residentName}>{item.full_name}</Text>
          <Text style={styles.residentDetails}>{item.email}</Text>
          <Text style={styles.residentDetails}>{item.phone_number}</Text>
          <Text style={styles.residentDetails} numberOfLines={1}>{item.address}</Text>
        </View>
        <View style={styles.residentActions}>
          <Text style={styles.residentStatus}>Active</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (user?.role !== 'purok_chairman') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Access denied. Purok Chairman access required.</Text>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.headerTitle}>Manage Residents</Text>
          </View>

          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
            <Ionicons name="add" size={moderateScale(24)} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading residents...</Text>
          </View>
        ) : residents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyText}>No residents found</Text>
            <Text style={styles.emptySubtext}>Add residents to your purok community</Text>
            <TouchableOpacity 
              style={styles.emptyButton} 
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.emptyButtonText}>Add First Resident</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={residents}
            renderItem={renderResident}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Add Resident Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Resident</Text>
            <TouchableOpacity onPress={handleAddResident} disabled={isSubmitting}>
              <Text style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}>
                {isSubmitting ? 'Adding...' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Section 1: Personal Information */}
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.first_name}
                onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                placeholder="Enter first name"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Middle Name</Text>
              <TextInput
                style={styles.input}
                value={formData.middle_name}
                onChangeText={(text) => setFormData({ ...formData, middle_name: text })}
                placeholder="Enter middle name (optional)"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.last_name}
                onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                placeholder="Enter last name"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Suffix</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowSuffixDropdown(!showSuffixDropdown)}
              >
                <Text style={[styles.dropdownButtonText, !formData.suffix && styles.dropdownPlaceholder]}>
                  {formData.suffix || 'Select suffix (optional)'}
                </Text>
                <Ionicons name={showSuffixDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              {showSuffixDropdown && (
                <View style={styles.dropdownList}>
                  {suffixOptions.map((option) => (
                    <TouchableOpacity
                      key={option || 'none'}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFormData({ ...formData, suffix: option });
                        setShowSuffixDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{option || 'None'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Section 2: Birth Details */}
            <Text style={styles.sectionTitle}>Birth Details</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date of Birth *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
                <Text style={styles.dateText}>
                  {formData.date_of_birth.toLocaleDateString()}
                </Text>
                <Ionicons name="chevron-down" size={moderateScale(20)} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

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
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.datePickerCancelButton}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.datePickerDoneButton}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={formData.date_of_birth}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                      textColor="black"
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>
            )}

            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={formData.date_of_birth}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={calculateAge(formData.date_of_birth)}
                editable={false}
                placeholder="Auto-calculated"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Place of Birth *</Text>
              <TextInput
                style={styles.input}
                value={formData.place_of_birth}
                onChangeText={(text) => setFormData({ ...formData, place_of_birth: text })}
                placeholder="Where were you born?"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nationality *</Text>
              <TextInput
                style={styles.input}
                value={formData.nationality}
                onChangeText={(text) => setFormData({ ...formData, nationality: text })}
                placeholder="Enter nationality"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Gender *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowGenderDropdown(!showGenderDropdown)}
              >
                <Text style={[styles.dropdownButtonText, !formData.gender && styles.dropdownPlaceholder]}>
                  {formData.gender || 'Select gender'}
                </Text>
                <Ionicons name={showGenderDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              {showGenderDropdown && (
                <View style={styles.dropdownList}>
                  {genderOptions.filter(o => o !== '').map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFormData({ ...formData, gender: option });
                        setShowGenderDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Civil Status *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowCivilStatusDropdown(!showCivilStatusDropdown)}
              >
                <Text style={[styles.dropdownButtonText, !formData.civil_status && styles.dropdownPlaceholder]}>
                  {formData.civil_status || 'Select civil status'}
                </Text>
                <Ionicons name={showCivilStatusDropdown ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              {showCivilStatusDropdown && (
                <View style={styles.dropdownList}>
                  {civilStatusOptions.filter(o => o !== '').map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFormData({ ...formData, civil_status: option });
                        setShowCivilStatusDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Section 3: Address Information */}
            <Text style={styles.sectionTitle}>Address Information</Text>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>House Number *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.house_number}
                  onChangeText={(text) => setFormData({ ...formData, house_number: text })}
                  placeholder="House #"
                />
              </View>

              <View style={styles.halfWidth}>
                <Text style={styles.inputLabel}>Street *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.street}
                  onChangeText={(text) => setFormData({ ...formData, street: text })}
                  placeholder="Street name"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Complete Address *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Enter complete address"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Section 4: Contact Information */}
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={formData.phone_number}
                onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
                placeholder="09XXXXXXXXX"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  addButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
  },
  listContainer: {
    padding: theme.spacing.lg,
  },
  residentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  residentAvatar: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary + '30',
  },
  residentInfo: {
    flex: 1,
  },
  residentName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  residentDetails: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
  },
  residentActions: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  residentStatus: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  errorText: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cancelButton: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
  },
  saveButton: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.regular,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  dropdownButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
    marginTop: spacing.xs,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 200,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemText: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
  },
  dateButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: moderateScale(50),
  },
  dateText: {
    fontSize: fontSize.md,
    color: theme.colors.text,
    flex: 1,
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
  datePickerCancelButton: {
    fontSize: fontSize.md,
    color: theme.colors.textSecondary,
    fontFamily: theme.fontFamily.regular,
  },
  datePickerTitle: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
  },
  datePickerDoneButton: {
    fontSize: fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
  },
  disabledInput: {
    backgroundColor: '#F8F9FA',
    color: theme.colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
});
