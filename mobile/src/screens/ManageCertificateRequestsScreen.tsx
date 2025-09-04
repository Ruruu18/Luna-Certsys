// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase, CertificateRequest, User } from '../lib/supabase';

interface ManageCertificateRequestsScreenProps {
  navigation: any;
}

interface CertificateRequestWithUser extends CertificateRequest {
  user: User;
}

export default function ManageCertificateRequestsScreen({ navigation }: ManageCertificateRequestsScreenProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CertificateRequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CertificateRequestWithUser | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'rejected'>('all');

  useEffect(() => {
    if (user?.role === 'purok_chairman') {
      fetchCertificateRequests();
    }
  }, [user, filter]);

  const fetchCertificateRequests = async () => {
    try {
      setLoading(true);
      
      // First get all residents under this chairman
      const { data: residents, error: residentsError } = await supabase
        .from('users')
        .select('id')
        .eq('purok_chairman_id', user?.id)
        .eq('role', 'resident');

      if (residentsError) throw residentsError;

      if (!residents || residents.length === 0) {
        setRequests([]);
        return;
      }

      const residentIds = residents.map(r => r.id);

      // Build query
      let query = supabase
        .from('certificate_requests')
        .select(`
          *,
          user:users!certificate_requests_user_id_fkey(*)
        `)
        .in('user_id', residentIds)
        .order('created_at', { ascending: false });

      // Apply filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching certificate requests:', error);
      Alert.alert('Error', 'Failed to load certificate requests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequestStatus = async (newStatus: 'in_progress' | 'completed' | 'rejected') => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        processed_by: user?.id,
      };

      if (notes.trim()) {
        updateData.notes = notes.trim();
      }

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('certificate_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      Alert.alert(
        'Success',
        `Certificate request has been ${newStatus === 'in_progress' ? 'approved and is now in progress' : newStatus}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false);
              setSelectedRequest(null);
              setNotes('');
              setActionType(null);
              fetchCertificateRequests();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert('Error', 'Failed to update request status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openActionModal = (request: CertificateRequestWithUser, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'in_progress':
        return theme.colors.info;
      case 'completed':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'in_progress':
        return 'hourglass-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'rejected':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const renderRequest = ({ item }: { item: CertificateRequestWithUser }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.user?.full_name}</Text>
          <Text style={styles.userEmail}>{item.user?.email}</Text>
        </View>
        <View style={[styles.statusContainer, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Ionicons name={getStatusIcon(item.status) as any} size={16} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <Text style={styles.certificateType}>{item.certificate_type}</Text>
        <Text style={styles.purpose}>Purpose: {item.purpose}</Text>
        {item.amount && (
          <Text style={styles.amount}>Amount: ₱{item.amount}</Text>
        )}
        <Text style={styles.requestDate}>
          Requested: {new Date(item.created_at).toLocaleDateString()}
        </Text>
        {item.notes && (
          <Text style={styles.notes}>Notes: {item.notes}</Text>
        )}
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => openActionModal(item, 'approve')}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => openActionModal(item, 'reject')}
          >
            <Ionicons name="close" size={16} color="white" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'in_progress' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => openActionModal(item, 'approve')}
          >
            <Ionicons name="checkmark-circle" size={16} color="white" />
            <Text style={styles.actionButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFilterButton = (filterValue: typeof filter, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterValue && styles.activeFilterButton,
      ]}
      onPress={() => setFilter(filterValue)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterValue && styles.activeFilterButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Certificate Requests</Text>
          
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {renderFilterButton('all', 'All')}
        {renderFilterButton('pending', 'Pending')}
        {renderFilterButton('in_progress', 'In Progress')}
        {renderFilterButton('completed', 'Completed')}
        {renderFilterButton('rejected', 'Rejected')}
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyText}>No certificate requests found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? 'Your residents haven\'t submitted any certificate requests yet'
                : `No ${filter === 'in_progress' ? 'in progress' : filter} requests found`
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Action Modal */}
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
            <Text style={styles.modalTitle}>
              {actionType === 'approve' 
                ? (selectedRequest?.status === 'in_progress' ? 'Mark Complete' : 'Approve Request')
                : 'Reject Request'
              }
            </Text>
            <TouchableOpacity 
              onPress={() => {
                if (actionType === 'approve') {
                  handleUpdateRequestStatus(selectedRequest?.status === 'in_progress' ? 'completed' : 'in_progress');
                } else {
                  handleUpdateRequestStatus('rejected');
                }
              }}
              disabled={isSubmitting}
            >
              <Text style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}>
                {isSubmitting ? 'Processing...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedRequest && (
              <View style={styles.requestSummary}>
                <Text style={styles.summaryTitle}>Request Details</Text>
                <Text style={styles.summaryItem}>Resident: {selectedRequest.user?.full_name}</Text>
                <Text style={styles.summaryItem}>Certificate: {selectedRequest.certificate_type}</Text>
                <Text style={styles.summaryItem}>Purpose: {selectedRequest.purpose}</Text>
                {selectedRequest.amount && (
                  <Text style={styles.summaryItem}>Amount: ₱{selectedRequest.amount}</Text>
                )}
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {actionType === 'approve' ? 'Processing Notes (Optional)' : 'Rejection Reason (Optional)'}
              </Text>
              <TextInput
                style={styles.textArea}
                value={notes}
                onChangeText={setNotes}
                placeholder={
                  actionType === 'approve' 
                    ? 'Add any processing notes...'
                    : 'Reason for rejection...'
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
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
    color: 'white',
  },
  headerRight: {
    width: 40,
  },
  filterContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeFilterButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  activeFilterButtonText: {
    color: 'white',
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
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    padding: theme.spacing.lg,
  },
  requestCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  requestDetails: {
    marginBottom: theme.spacing.md,
  },
  certificateType: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  purpose: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  amount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  requestDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.xs,
  },
  notes: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.xs,
  },
  approveButton: {
    backgroundColor: theme.colors.success,
  },
  rejectButton: {
    backgroundColor: theme.colors.error,
  },
  completeButton: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonText: {
    color: 'white',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.fontSize.md,
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
    color: theme.colors.textSecondary,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  saveButton: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  requestSummary: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  summaryTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  summaryItem: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    height: 100,
    textAlignVertical: 'top',
  },
});
