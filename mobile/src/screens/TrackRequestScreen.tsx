// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { getCertificates, CertificateRequest } from '../lib/supabase';

interface TrackRequestScreenProps {
  navigation: any;
}

interface Request {
  id: string;
  referenceNumber: string;
  certificateType: string;
  status: 'Pending' | 'Processing' | 'Ready' | 'Completed' | 'Rejected';
  dateSubmitted: string;
  estimatedCompletion: string;
  purpose: string;
  quantity: number;
  fee: number;
  progress: number;
}

export default function TrackRequestScreen({ navigation }: TrackRequestScreenProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRequests();
  }, [user]);

  const fetchUserRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await getCertificates(user.id);
      
      if (error) {
        console.error('Error fetching certificates:', error);
      } else {
        setRequests(data || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockRequests: Request[] = [
    {
      id: '1',
      referenceNumber: 'REF-2024-001',
      certificateType: 'Barangay Clearance',
      status: 'Ready',
      dateSubmitted: '2024-01-15',
      estimatedCompletion: '2024-01-22',
      purpose: 'Employment',
      quantity: 1,
      fee: 50,
      progress: 100,
    },
    {
      id: '2',
      referenceNumber: 'REF-2024-002',
      certificateType: 'Certificate of Residency',
      status: 'Processing',
      dateSubmitted: '2024-01-18',
      estimatedCompletion: '2024-01-25',
      purpose: 'School Requirements',
      quantity: 2,
      fee: 100,
      progress: 60,
    },
    {
      id: '3',
      referenceNumber: 'REF-2024-003',
      certificateType: 'Certificate of Indigency',
      status: 'Pending',
      dateSubmitted: '2024-01-20',
      estimatedCompletion: '2024-01-27',
      purpose: 'Medical Assistance',
      quantity: 1,
      fee: 50,
      progress: 25,
    },
  ];

  const statusOptions = ['All', 'Pending', 'Processing', 'Ready', 'Completed', 'Rejected'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return theme.colors.warning;
      case 'Processing':
        return theme.colors.info;
      case 'Ready':
        return theme.colors.success;
      case 'Completed':
        return theme.colors.success;
      case 'Rejected':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'time-outline';
      case 'Processing':
        return 'refresh-outline';
      case 'Ready':
        return 'checkmark-circle-outline';
      case 'Completed':
        return 'checkmark-done-outline';
      case 'Rejected':
        return 'close-circle-outline';
      default:
        return 'help-outline';
    }
  };

  const getProgressForStatus = (status: string): number => {
    switch (status) {
      case 'pending':
        return 25;
      case 'in_progress':
        return 50;
      case 'completed':
        return 100;
      case 'rejected':
        return 0;
      default:
        return 0;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.certificate_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || request.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const renderProgressBar = (progress: number, status: string) => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarBackground}>
        <View 
          style={[
            styles.progressBarFill, 
            { 
              width: `${progress}%`,
              backgroundColor: getStatusColor(status)
            }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>{progress}%</Text>
    </View>
  );

  const renderRequest = ({ item }: { item: CertificateRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={styles.referenceNumber}>REF-{item.id.slice(0, 8)}</Text>
          <Text style={styles.certificateType}>{item.certificate_type}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Ionicons 
            name={getStatusIcon(item.status) as any} 
            size={16} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {renderProgressBar(getProgressForStatus(item.status), item.status)}

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>Submitted</Text>
            <Text style={styles.detailValue}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>Status</Text>
            <Text style={styles.detailValue}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="document-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>Purpose</Text>
            <Text style={styles.detailValue}>{item.purpose}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>Amount</Text>
            <Text style={styles.detailValue}>₱{item.amount || 50}</Text>
          </View>
        </View>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        {item.status === 'Ready' && (
          <TouchableOpacity style={[styles.actionButton, styles.primaryActionButton]}>
            <Ionicons name="download-outline" size={16} color="white" />
            <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
              Download
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
          
          <Text style={styles.title}>Track Requests</Text>
          
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Search and Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by reference number or type"
              placeholderTextColor={theme.colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  selectedStatus === status && styles.activeFilterButton
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedStatus === status && styles.activeFilterButtonText
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {/* Request List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading your requests...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredRequests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color={theme.colors.textTertiary} />
                <Text style={styles.emptyStateText}>No requests found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try adjusting your search or filter criteria
                </Text>
              </View>
            }
          />
        )}
      </View>
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
  searchSection: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
  },
  filterContainer: {
    paddingBottom: theme.spacing.xs,
  },
  filterButton: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.sm,
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
    fontFamily: theme.fontFamily.medium,
  },
  activeFilterButtonText: {
    color: 'white',
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
  },
  resultsHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resultsCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
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
  requestInfo: {
    flex: 1,
  },
  referenceNumber: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  certificateType: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    marginLeft: theme.spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    marginRight: theme.spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    minWidth: 30,
  },
  requestDetails: {
    marginBottom: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  detailItem: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.lg + 4,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    marginLeft: theme.spacing.lg + 4,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  primaryActionButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    marginLeft: theme.spacing.xs,
  },
  primaryActionButtonText: {
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
});