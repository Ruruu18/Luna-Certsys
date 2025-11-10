import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';
import { sendPasswordEmail } from '../services/emailService';

interface PendingRegistrationsScreenProps {
  navigation: import('../types/navigation').AppNavigationProp;
}

interface PendingRegistration {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  date_of_birth: string;
  place_of_birth: string;
  gender: string;
  civil_status: string;
  age: number;
  purok: string;
  house_number: string;
  street: string;
  address: string;
  phone_number: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
}

export default function PendingRegistrationsScreen({ navigation }: PendingRegistrationsScreenProps) {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'purok_chairman') {
      fetchPendingRegistrations();

      // Set up real-time subscription for pending registrations
      console.log('📡 Setting up real-time subscription for pending registrations...');
      const subscription = supabase
        .channel('pending_registrations_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'pending_registrations',
            filter: `purok_chairman_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('🔔 Real-time update received:', payload);

            if (payload.eventType === 'INSERT') {
              // New registration added
              const newRegistration = payload.new as PendingRegistration;
              if (newRegistration.status === 'pending') {
                console.log('✅ New pending registration added:', newRegistration);
                setRegistrations((prev) => [newRegistration, ...prev]);
              }
            } else if (payload.eventType === 'UPDATE') {
              // Registration updated (e.g., approved or rejected)
              const updatedRegistration = payload.new as PendingRegistration;
              console.log('🔄 Registration updated:', updatedRegistration);

              if (updatedRegistration.status !== 'pending') {
                // Remove from list if no longer pending
                setRegistrations((prev) =>
                  prev.filter((reg) => reg.id !== updatedRegistration.id)
                );
              } else {
                // Update in list if still pending
                setRegistrations((prev) =>
                  prev.map((reg) =>
                    reg.id === updatedRegistration.id ? updatedRegistration : reg
                  )
                );
              }
            } else if (payload.eventType === 'DELETE') {
              // Registration deleted
              const deletedId = payload.old.id;
              console.log('🗑️ Registration deleted:', deletedId);
              setRegistrations((prev) => prev.filter((reg) => reg.id !== deletedId));
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
        });

      // Cleanup subscription on unmount
      return () => {
        console.log('🔌 Unsubscribing from pending registrations...');
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchPendingRegistrations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pending_registrations')
        .select('*')
        .eq('purok_chairman_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
      Alert.alert('Error', 'Failed to load pending registrations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPendingRegistrations();
  };

  const viewDetails = (registration: PendingRegistration) => {
    setSelectedRegistration(registration);
    setModalVisible(true);
  };

  const handleApprove = async (registration: PendingRegistration) => {
    Alert.alert(
      'Approve Registration',
      `Are you sure you want to approve ${registration.first_name} ${registration.last_name}'s registration request?\n\nThis will create their account and they will be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => processApproval(registration),
        },
      ]
    );
  };

  const processApproval = async (registration: PendingRegistration) => {
    setProcessingId(registration.id);
    setModalVisible(false);

    try {
      // Validate chairman is logged in
      if (!user?.id || user.role !== 'purok_chairman') {
        throw new Error('You must be logged in as a Purok Chairman to approve registrations');
      }

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      console.log('✅ Starting approval for:', registration.email);
      console.log('Chairman ID:', user.id);
      console.log('Temporary password:', tempPassword);

      // Use database function to create user (no auth state changes!)
      console.log('📞 Calling approve_resident_registration function...');
      const { data: functionResult, error: functionError } = await supabase.rpc(
        'approve_resident_registration',
        {
          p_registration_id: registration.id,
          p_temp_password: tempPassword,
          p_chairman_id: user.id,
        }
      );

      console.log('Function result:', functionResult);

      if (functionError) {
        console.error('❌ Function error:', functionError);
        throw new Error(functionError.message || 'Failed to approve registration');
      }

      if (!functionResult?.success) {
        throw new Error(functionResult?.error || 'Approval failed');
      }

      console.log('✅ User created successfully via database function!');
      console.log('New user ID:', functionResult.user_id);

      // Send password via email
      console.log('📧 Sending password email...');
      const emailResult = await sendPasswordEmail({
        recipientEmail: registration.email,
        recipientName: `${registration.first_name} ${registration.last_name}`,
        password: tempPassword,
        purokChairmanName: user?.full_name || 'Your Purok Chairman',
      });

      console.log('📧 Email result:', emailResult);

      // Show success alert
      if (emailResult.success) {
        Alert.alert(
          'Registration Approved ✓',
          `${registration.first_name} ${registration.last_name}'s registration has been approved!\n\n✉️ An email has been sent to ${registration.email} with their login credentials.\n\nTemporary Password: ${tempPassword}\n\n(Password also saved in case email delivery fails)`,
          [{ text: 'OK', onPress: () => fetchPendingRegistrations() }]
        );
      } else {
        // Email failed, show password to chairman as fallback
        Alert.alert(
          'Registration Approved (Email Failed)',
          `${registration.first_name} ${registration.last_name}'s registration has been approved!\n\n⚠️ Email delivery failed: ${emailResult.error}\n\nTemporary Password: ${tempPassword}\n\nPlease manually share this password with the resident.`,
          [{ text: 'OK', onPress: () => fetchPendingRegistrations() }]
        );
      }
    } catch (error: any) {
      console.error('❌❌❌ ERROR APPROVING REGISTRATION ❌❌❌');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error details:', JSON.stringify(error, null, 2));

      Alert.alert(
        'Approval Failed',
        error.message || 'Failed to approve registration. Check console for details.'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (registration: PendingRegistration) => {
    setSelectedRegistration(registration);
    setRejectionReason('');
    setModalVisible(false);
    setRejectionModalVisible(true);
  };

  const processRejection = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    if (!selectedRegistration) return;

    setProcessingId(selectedRegistration.id);
    setRejectionModalVisible(false);

    try {
      const { error } = await supabase
        .from('pending_registrations')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', selectedRegistration.id);

      if (error) throw error;

      Alert.alert(
        'Registration Rejected',
        `${selectedRegistration.first_name} ${selectedRegistration.last_name}'s registration has been rejected.`,
        [{ text: 'OK', onPress: () => fetchPendingRegistrations() }]
      );
    } catch (error: any) {
      console.error('Error rejecting registration:', error);
      Alert.alert('Error', error.message || 'Failed to reject registration');
    } finally {
      setProcessingId(null);
      setSelectedRegistration(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderRegistrationCard = ({ item }: { item: PendingRegistration }) => {
    const isProcessing = processingId === item.id;
    const fullName = `${item.first_name} ${item.middle_name || ''} ${item.last_name} ${item.suffix || ''}`.replace(/\s+/g, ' ').trim();

    return (
      <TouchableOpacity
        style={[styles.card, isProcessing && styles.cardProcessing]}
        onPress={() => viewDetails(item)}
        activeOpacity={0.7}
        disabled={isProcessing}
      >
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={moderateScale(32)} color={theme.colors.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{fullName}</Text>
            <Text style={styles.cardDetail}>
              <Ionicons name="mail-outline" size={moderateScale(14)} color={theme.colors.textSecondary} />
              {' '}{item.email}
            </Text>
            <Text style={styles.cardDetail}>
              <Ionicons name="call-outline" size={moderateScale(14)} color={theme.colors.textSecondary} />
              {' '}{item.phone_number}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={moderateScale(16)} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>
              {item.age} years old • {item.gender}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={moderateScale(16)} color={theme.colors.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.house_number} {item.street}, {item.purok}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={moderateScale(16)} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>
              Requested {formatDateTime(item.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleReject(item);
            }}
            disabled={isProcessing}
          >
            <Ionicons name="close-circle" size={moderateScale(20)} color={theme.colors.error} />
            <Text style={[styles.actionButtonText, styles.rejectButtonText]}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleApprove(item);
            }}
            disabled={isProcessing}
          >
            <Ionicons name="checkmark-circle" size={moderateScale(20)} color="white" />
            <Text style={[styles.actionButtonText, styles.approveButtonText]}>Approve</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedRegistration) return null;

    const fullName = `${selectedRegistration.first_name} ${selectedRegistration.middle_name || ''} ${selectedRegistration.last_name} ${selectedRegistration.suffix || ''}`.replace(/\s+/g, ' ').trim();

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBarWrapper backgroundColor={theme.colors.primary} style="light" />

          {/* Modal Header */}
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.modalHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.modalHeaderContent}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={moderateScale(24)} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Registration Details</Text>
              <View style={styles.modalHeaderRight} />
            </View>
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Personal Information */}
            <View style={styles.modalSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="person-outline" size={moderateScale(20)} color={theme.colors.primary} />
                <Text style={styles.modalSectionTitle}>Personal Information</Text>
              </View>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Full Name:</Text>
                  <Text style={styles.infoValue}>{fullName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date of Birth:</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedRegistration.date_of_birth)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Age:</Text>
                  <Text style={styles.infoValue}>{selectedRegistration.age} years old</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Place of Birth:</Text>
                  <Text style={styles.infoValue}>{selectedRegistration.place_of_birth}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Gender:</Text>
                  <Text style={styles.infoValue}>{selectedRegistration.gender}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Civil Status:</Text>
                  <Text style={styles.infoValue}>{selectedRegistration.civil_status}</Text>
                </View>
              </View>
            </View>

            {/* Address Information */}
            <View style={styles.modalSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="location-outline" size={moderateScale(20)} color={theme.colors.primary} />
                <Text style={styles.modalSectionTitle}>Address Information</Text>
              </View>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Purok:</Text>
                  <Text style={styles.infoValue}>{selectedRegistration.purok}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>House Number:</Text>
                  <Text style={styles.infoValue}>{selectedRegistration.house_number}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Street:</Text>
                  <Text style={styles.infoValue}>{selectedRegistration.street}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Complete Address:</Text>
                  <Text style={styles.infoValue}>{selectedRegistration.address}</Text>
                </View>
              </View>
            </View>

            {/* Contact Information */}
            <View style={styles.modalSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="call-outline" size={moderateScale(20)} color={theme.colors.primary} />
                <Text style={styles.modalSectionTitle}>Contact Information</Text>
              </View>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone Number:</Text>
                  <Text style={styles.infoValue}>{selectedRegistration.phone_number}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{selectedRegistration.email}</Text>
                </View>
              </View>
            </View>

            {/* Request Information */}
            <View style={styles.modalSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="time-outline" size={moderateScale(20)} color={theme.colors.primary} />
                <Text style={styles.modalSectionTitle}>Request Information</Text>
              </View>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Requested:</Text>
                  <Text style={styles.infoValue}>{formatDateTime(selectedRegistration.created_at)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Pending Review</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalActionButton, styles.modalRejectButton]}
              onPress={() => handleReject(selectedRegistration)}
            >
              <Ionicons name="close-circle" size={moderateScale(20)} color="white" />
              <Text style={styles.modalActionButtonText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalActionButton, styles.modalApproveButton]}
              onPress={() => handleApprove(selectedRegistration)}
            >
              <Ionicons name="checkmark-circle" size={moderateScale(20)} color="white" />
              <Text style={styles.modalActionButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderRejectionModal = () => (
    <Modal
      visible={rejectionModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setRejectionModalVisible(false)}
    >
      <View style={styles.rejectionModalOverlay}>
        <View style={styles.rejectionModalContent}>
          <View style={styles.rejectionModalHeader}>
            <Ionicons name="alert-circle" size={moderateScale(48)} color={theme.colors.error} />
            <Text style={styles.rejectionModalTitle}>Reject Registration</Text>
            <Text style={styles.rejectionModalSubtitle}>
              Please provide a reason for rejecting this registration request
            </Text>
          </View>

          <TextInput
            style={styles.rejectionInput}
            value={rejectionReason}
            onChangeText={setRejectionReason}
            placeholder="Enter rejection reason..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            autoFocus
          />

          <View style={styles.rejectionModalActions}>
            <TouchableOpacity
              style={[styles.rejectionModalButton, styles.rejectionModalCancelButton]}
              onPress={() => {
                setRejectionModalVisible(false);
                setRejectionReason('');
              }}
            >
              <Text style={styles.rejectionModalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rejectionModalButton, styles.rejectionModalConfirmButton]}
              onPress={processRejection}
            >
              <Text style={styles.rejectionModalConfirmText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (user?.role !== 'purok_chairman') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBarWrapper backgroundColor={theme.colors.primary} style="light" />
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>Access denied</Text>
          <Text style={styles.errorSubtext}>This feature is only available for Purok Chairmen</Text>
        </View>
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

          <Text style={styles.headerTitle}>Pending Registrations</Text>

          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={moderateScale(24)} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading pending registrations...</Text>
          </View>
        ) : registrations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyText}>No pending registrations</Text>
            <Text style={styles.emptySubtext}>
              New registration requests from residents in your purok will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={registrations}
            renderItem={renderRegistrationCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </View>

      {renderDetailsModal()}
      {renderRejectionModal()}
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
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  refreshButton: {
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
    marginTop: spacing.md,
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: verticalScale(20),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  errorSubtext: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  cardProcessing: {
    opacity: 0.6,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    zIndex: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  cardDetail: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: spacing.md,
  },
  cardDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  rejectButton: {
    backgroundColor: theme.colors.error + '15',
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
  },
  approveButton: {
    backgroundColor: theme.colors.success,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
  },
  rejectButtonText: {
    color: theme.colors.error,
  },
  approveButtonText: {
    color: 'white',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  modalCloseButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  modalHeaderRight: {
    width: moderateScale(40),
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalSection: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginLeft: spacing.sm,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
    flex: 2,
    textAlign: 'right',
  },
  statusBadge: {
    backgroundColor: theme.colors.warning + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.warning,
  },
  modalActions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  modalRejectButton: {
    backgroundColor: theme.colors.error,
  },
  modalApproveButton: {
    backgroundColor: theme.colors.success,
  },
  modalActionButtonText: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: 'white',
  },
  // Rejection Modal Styles
  rejectionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  rejectionModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  rejectionModalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  rejectionModalTitle: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  rejectionModalSubtitle: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  rejectionInput: {
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    height: verticalScale(120),
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  rejectionModalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rejectionModalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectionModalCancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rejectionModalConfirmButton: {
    backgroundColor: theme.colors.error,
  },
  rejectionModalCancelText: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  rejectionModalConfirmText: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: 'white',
  },
});
