import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { supabase, User } from '../lib/supabase';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';

interface ViewResidentScreenProps {
  navigation: any;
  route: any;
}

interface CertificateRequest {
  id: string;
  certificate_type: string;
  status: string;
  created_at: string;
  payment_status: string;
}

export default function ViewResidentScreen({ navigation, route }: ViewResidentScreenProps) {
  const { resident: initialResident } = route.params;
  const [resident, setResident] = useState<User>(initialResident);
  const [certificateRequests, setCertificateRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadResidentData();
  }, []);

  const loadResidentData = async () => {
    try {
      setLoading(true);

      // Fetch latest resident data
      const { data: residentData, error: residentError } = await supabase
        .from('users')
        .select('*')
        .eq('id', resident.id)
        .single();

      if (residentError) throw residentError;
      if (residentData) setResident(residentData);

      // Fetch certificate requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('certificate_requests')
        .select('id, certificate_type, status, created_at, payment_status')
        .eq('user_id', resident.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (requestsError) throw requestsError;
      setCertificateRequests(requestsData || []);
    } catch (error) {
      console.error('Error loading resident data:', error);
      Alert.alert('Error', 'Failed to load resident data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadResidentData();
  };

  const handleCall = () => {
    if (resident.phone_number) {
      Linking.openURL(`tel:${resident.phone_number}`);
    }
  };

  const handleEmail = () => {
    if (resident.email) {
      Linking.openURL(`mailto:${resident.email}`);
    }
  };

  const handleViewCertificateRequests = () => {
    // Navigate to certificate requests filtered by this resident
    navigation.navigate('CertificateRequests', { residentId: resident.id });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'in_progress':
        return theme.colors.warning;
      case 'pending':
        return '#FFA500';
      case 'rejected':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const extendedResident = resident as any;
  const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(resident.full_name || 'User') + '&size=400&background=4A90E2&color=fff';
  const memberSince = formatDate(resident.created_at || new Date().toISOString());
  const totalRequests = certificateRequests.length;
  const completedRequests = certificateRequests.filter(r => r.status === 'completed').length;
  const pendingRequests = certificateRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length;

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
            <Text style={styles.title}>Resident Details</Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons
              name="refresh"
              size={moderateScale(24)}
              color={refreshing ? 'rgba(255,255,255,0.5)' : 'white'}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading resident data...</Text>
          </View>
        ) : (
          <>
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <Image
                source={{ uri: extendedResident.photo_url || defaultAvatar }}
                style={styles.profileImage}
                onError={() => {
                  console.log('Image load error');
                }}
              />
              {extendedResident.face_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={moderateScale(24)} color={theme.colors.success} />
                </View>
              )}
              <Text style={styles.profileName}>{resident.full_name}</Text>
              <Text style={styles.profileRole}>Resident</Text>
              <View style={styles.memberSinceContainer}>
                <Ionicons name="calendar-outline" size={moderateScale(16)} color={theme.colors.textSecondary} />
                <Text style={styles.memberSinceText}>Member since {memberSince}</Text>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsSection}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Ionicons name="document-text-outline" size={moderateScale(24)} color={theme.colors.primary} />
                </View>
                <Text style={styles.statValue}>{totalRequests}</Text>
                <Text style={styles.statLabel}>Total Requests</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: theme.colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle-outline" size={moderateScale(24)} color={theme.colors.success} />
                </View>
                <Text style={styles.statValue}>{completedRequests}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: theme.colors.warning + '20' }]}>
                  <Ionicons name="time-outline" size={moderateScale(24)} color={theme.colors.warning} />
                </View>
                <Text style={styles.statValue}>{pendingRequests}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="mail-outline" size={moderateScale(20)} color={theme.colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{resident.email}</Text>
                  </View>
                  <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
                    <Ionicons name="send-outline" size={moderateScale(20)} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="call-outline" size={moderateScale(20)} color={theme.colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{resident.phone_number || 'Not provided'}</Text>
                  </View>
                  {resident.phone_number && (
                    <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                      <Ionicons name="call" size={moderateScale(20)} color={theme.colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="location-outline" size={moderateScale(20)} color={theme.colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={styles.infoValue}>{resident.address || 'Not provided'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="home-outline" size={moderateScale(20)} color={theme.colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Purok</Text>
                    <Text style={styles.infoValue}>{resident.purok || 'Not assigned'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Verification Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verification Status</Text>
              <View style={styles.verificationCard}>
                <View style={styles.verificationRow}>
                  <Ionicons
                    name={extendedResident.face_verified ? "checkmark-circle" : "close-circle"}
                    size={moderateScale(24)}
                    color={extendedResident.face_verified ? theme.colors.success : theme.colors.error}
                  />
                  <View style={styles.verificationContent}>
                    <Text style={styles.verificationLabel}>Face Verification</Text>
                    <Text style={styles.verificationStatus}>
                      {extendedResident.face_verified ? 'Verified' : 'Not Verified'}
                    </Text>
                  </View>
                </View>
                {extendedResident.face_verified && extendedResident.face_verified_at && (
                  <Text style={styles.verificationDate}>
                    Verified on {formatDate(extendedResident.face_verified_at)}
                  </Text>
                )}
              </View>
            </View>

            {/* Recent Certificate Requests */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Certificate Requests</Text>
                {totalRequests > 0 && (
                  <TouchableOpacity onPress={handleViewCertificateRequests}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {certificateRequests.length === 0 ? (
                <View style={styles.emptyRequests}>
                  <Ionicons name="document-text-outline" size={moderateScale(48)} color={theme.colors.textTertiary} />
                  <Text style={styles.emptyRequestsText}>No certificate requests yet</Text>
                </View>
              ) : (
                <View style={styles.requestsContainer}>
                  {certificateRequests.map((request) => (
                    <View key={request.id} style={styles.requestCard}>
                      <View style={styles.requestHeader}>
                        <Text style={styles.requestType}>{request.certificate_type}</Text>
                        <View
                          style={[
                            styles.requestStatusBadge,
                            { backgroundColor: getStatusColor(request.status) + '15' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.requestStatusText,
                              { color: getStatusColor(request.status) },
                            ]}
                          >
                            {getStatusLabel(request.status)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.requestFooter}>
                        <View style={styles.requestDate}>
                          <Ionicons name="calendar-outline" size={moderateScale(14)} color={theme.colors.textSecondary} />
                          <Text style={styles.requestDateText}>
                            {formatDate(request.created_at)}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.paymentBadge,
                            {
                              backgroundColor:
                                request.payment_status === 'paid'
                                  ? theme.colors.success + '15'
                                  : theme.colors.warning + '15',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.paymentBadgeText,
                              {
                                color:
                                  request.payment_status === 'paid'
                                    ? theme.colors.success
                                    : theme.colors.warning,
                              },
                            ]}
                          >
                            {request.payment_status === 'paid' ? 'Paid' : 'Pending Payment'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Action Button */}
            {totalRequests > 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleViewCertificateRequests}
                activeOpacity={0.7}
              >
                <Ionicons name="document-text-outline" size={moderateScale(24)} color="white" />
                <Text style={styles.actionButtonText}>View All Certificate Requests</Text>
              </TouchableOpacity>
            )}
          </>
        )}
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 3,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: spacing.md,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  profileImage: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    borderWidth: 4,
    borderColor: theme.colors.primary,
    marginBottom: spacing.md,
  },
  verifiedBadge: {
    position: 'absolute',
    top: spacing.xl + moderateScale(90),
    right: dimensions.width / 2 - moderateScale(70),
    backgroundColor: 'white',
    borderRadius: moderateScale(12),
    padding: spacing.xs,
  },
  profileName: {
    fontSize: fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginTop: spacing.sm,
  },
  profileRole: {
    fontSize: fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: spacing.xs,
  },
  memberSinceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  memberSinceText: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: spacing.xs,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  statIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.text,
  },
  contactButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '15',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: spacing.md,
  },
  verificationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  verificationLabel: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: spacing.xs,
  },
  verificationStatus: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
  },
  verificationDate: {
    fontSize: fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: spacing.sm,
    marginLeft: moderateScale(36),
  },
  emptyRequests: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyRequestsText: {
    fontSize: fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: spacing.md,
  },
  requestsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  requestCard: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  requestType: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    flex: 1,
  },
  requestStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  requestStatusText: {
    fontSize: fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestDateText: {
    fontSize: fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: spacing.xs,
  },
  paymentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  paymentBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(4),
    },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(8),
    elevation: 5,
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: 'white',
    marginLeft: spacing.sm,
  },
});
