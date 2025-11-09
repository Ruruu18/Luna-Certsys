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
  Alert,
  RefreshControl,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { getCertificateRequests, CertificateRequest, supabase } from '../lib/supabase';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';
import { generateCertificatePDF } from '../services/certificateGenerator';
import { downloadCertificate } from '../services/storageService';

interface TrackRequestScreenProps {
  navigation: import('../types/navigation').AppNavigationProp;
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
  const [refreshing, setRefreshing] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRequests();

    // Set up Supabase Realtime subscription for real-time updates
    if (!user) return;

    const channel = supabase
      .channel('certificate_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'certificate_requests',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time update received:', payload);

          // Refresh the requests list when any change occurs
          fetchUserRequests(true);
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchUserRequests = async (isRefreshing = false) => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Add timeout to prevent infinite loading (15 seconds)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );

      const fetchPromise = getCertificateRequests(user.id);

      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('Error fetching certificate requests:', error);
        if (!isRefreshing) {
          Alert.alert('Error', 'Failed to load requests. Please try again.');
        }
      } else {
        console.log('Fetched certificate requests:', data);
        setRequests(data || []);
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      if (error.message === 'Request timeout') {
        if (!isRefreshing) {
          Alert.alert('Timeout', 'Loading is taking too long. Please check your connection and try again.');
        }
      } else {
        if (!isRefreshing) {
          Alert.alert('Error', 'Failed to load requests. Please try again.');
        }
      }
      setRequests([]); // Clear requests on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchUserRequests(true);
  };

  const handleGenerateCertificate = async (request: CertificateRequest) => {
    if (!user) return;

    setGeneratingId(request.id);
    try {
      const result = await generateCertificatePDF({
        requestId: request.id,
        userId: user.id,
        certificateType: request.certificate_type,
        purpose: request.purpose,
      });

      if (result.success) {
        // Refresh the entire list from server to get the updated pdf_url
        await fetchUserRequests(true);
        Alert.alert('Success', 'Certificate generated successfully! You can now download it.');
      } else {
        Alert.alert('Error', result.error || 'Failed to generate certificate');
      }
    } catch (error) {
      console.error('Generate error:', error);
      Alert.alert('Error', 'Failed to generate certificate');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDownloadCertificate = async (request: CertificateRequest) => {
    if (!request.pdf_url) return;

    setDownloadingId(request.id);
    try {
      const fileName = `Certificate_${request.certificate_number || 'Document'}.pdf`;
      const result = await downloadCertificate(request.pdf_url, fileName);

      if (result.success) {
        Alert.alert('Success', 'Certificate downloaded successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to download certificate');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download certificate');
    } finally {
      setDownloadingId(null);
    }
  };

  // Mock data removed - now using real Supabase data from fetchUserRequests()

  const statusOptions = ['All', 'pending', 'in_progress', 'completed', 'rejected'];

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
        return 'refresh-outline';
      case 'completed':
        return 'checkmark-done-outline';
      case 'rejected':
        return 'close-circle-outline';
      default:
        return 'help-outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getProgressForStatus = (status: string): number => {
    switch (status) {
      case 'pending':
        return 25;
      case 'in_progress':
        return 65;
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
            size={moderateScale(16)}
            color={getStatusColor(item.status)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {renderProgressBar(getProgressForStatus(item.status), item.status)}

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={moderateScale(16)} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>Submitted</Text>
            <Text style={styles.detailValue}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={moderateScale(16)} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>Status</Text>
            <Text style={styles.detailValue}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="document-outline" size={moderateScale(16)} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>Purpose</Text>
            <Text style={styles.detailValue}>{item.purpose}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={moderateScale(16)} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>Amount</Text>
            <Text style={styles.detailValue}>₱{item.amount || 50}</Text>
          </View>
        </View>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('RequestDetails', { request: item })}
        >
          <Ionicons name="eye-outline" size={moderateScale(16)} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        {item.status === 'completed' && (
          item.pdf_url ? (
            // Download button - PDF exists
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryActionButton]}
              onPress={() => handleDownloadCertificate(item)}
              disabled={downloadingId === item.id}
            >
              {downloadingId === item.id ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="download-outline" size={moderateScale(16)} color="white" />
              )}
              <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
                {downloadingId === item.id ? 'Downloading...' : 'Download'}
              </Text>
            </TouchableOpacity>
          ) : (
            // Generate button - PDF doesn't exist yet
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryActionButton]}
              onPress={() => handleGenerateCertificate(item)}
              disabled={generatingId === item.id}
            >
              {generatingId === item.id ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="document-text-outline" size={moderateScale(16)} color="white" />
              )}
              <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
                {generatingId === item.id ? 'Generating...' : 'Generate Certificate'}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>
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
            <Text style={styles.title}>Track Requests</Text>
          </View>

          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Search and Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
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
                  {status === 'All' ? 'All' : getStatusLabel(status)}
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={moderateScale(64)} color={theme.colors.textTertiary} />
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
  searchSection: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
  },
  filterContainer: {
    paddingBottom: spacing.xs,
  },
  filterButton: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeFilterButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: fontSize.sm,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resultsCount: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  listContainer: {
    padding: spacing.lg,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  requestInfo: {
    flex: 1,
  },
  referenceNumber: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  certificateType: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    marginLeft: spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressBarBackground: {
    flex: 1,
    height: verticalScale(6),
    backgroundColor: theme.colors.border,
    borderRadius: moderateScale(3),
    marginRight: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: moderateScale(3),
  },
  progressText: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    minWidth: scale(30),
  },
  requestDetails: {
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailText: {
    fontSize: fontSize.xs,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    textAlign: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginLeft: spacing.sm,
  },
  primaryActionButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    marginLeft: spacing.xs,
  },
  primaryActionButtonText: {
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: verticalScale(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: spacing.md,
  },
});