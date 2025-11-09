import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';
interface DashboardScreenProps {
  navigation: any;
}

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  badge?: number;
}

interface StatCard {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface RecentActivity {
  id: string;
  certificate_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    // Use Philippines timezone (Asia/Manila, UTC+8)
    // Add 8 hours to UTC time
    const now = new Date();
    const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const year = phTime.getUTCFullYear();
    const month = String(phTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(phTime.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Format: YYYY-MM-DD
  });
  const [notificationCount, setNotificationCount] = useState(0);
  const [pendingRegistrationsCount, setPendingRegistrationsCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [stats, setStats] = useState({
    activeRequests: 0,
    completed: 0,
    totalSpent: 0,
  });
  const [chairmanStats, setChairmanStats] = useState({
    pendingRegistrations: 0,
    totalResidents: 0,
    pendingRequests: 0,
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { user, loading } = useAuth();

  // Default avatar image
  const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.full_name || 'User') + '&size=200&background=4A90E2&color=fff';

  // Load profile image
  useEffect(() => {
    const extendedUser = user as any;
    if (extendedUser?.photo_url) {
      setProfileImage(extendedUser.photo_url);
    }
  }, [user]);

  // Fetch notification count
  const fetchNotificationCount = async () => {
    if (!user?.id) return;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setNotificationCount(count || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  // Fetch notification count when user is available
  useEffect(() => {
    if (user?.id) {
      fetchNotificationCount();

      // Set up real-time subscription for notifications
      const subscription = supabase
        .channel('notifications_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchNotificationCount();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  // Refresh notification count when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        fetchNotificationCount();
      }
    }, [user])
  );

  // Fetch pending registrations count for chairmen
  useEffect(() => {
    if (user?.role === 'purok_chairman') {
      fetchPendingRegistrationsCount();

      // Set up real-time subscription for pending registrations
      console.log('📡 Dashboard: Setting up real-time subscription for pending count...');
      const subscription = supabase
        .channel('dashboard_pending_count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pending_registrations',
            filter: `purok_chairman_id=eq.${user.id}`
          },
          (payload) => {
            console.log('🔔 Dashboard: Real-time update received:', payload);
            fetchPendingRegistrationsCount();
          }
        )
        .subscribe((status) => {
          console.log('📡 Dashboard subscription status:', status);
        });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchPendingRegistrationsCount = async () => {
    if (!user?.id) {
      console.log('Dashboard: No user ID available for fetching pending registrations');
      return;
    }

    try {
      console.log('Dashboard: Fetching pending registrations for chairman:', user.id);
      const { count, error } = await supabase
        .from('pending_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('purok_chairman_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Dashboard: Error fetching pending registrations:', error);
        throw error;
      }
      console.log('Dashboard: Pending registrations count:', count);
      setPendingRegistrationsCount(count || 0);
    } catch (error) {
      console.error('Dashboard: Exception fetching pending registrations count:', error);
    }
  };

  // Fetch recent activities for residents
  const fetchRecentActivities = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('certificate_requests')
        .select('id, certificate_type, status, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  // Fetch stats for residents
  const fetchStats = async () => {
    if (!user?.id) return;

    try {
      // Get active requests count
      const { count: activeCount, error: activeError } = await supabase
        .from('certificate_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing', 'approved']);

      if (activeError) throw activeError;

      // Get completed requests count
      const { count: completedCount, error: completedError } = await supabase
        .from('certificate_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (completedError) throw completedError;

      // Get total spent
      const { data: paidRequests, error: paidError } = await supabase
        .from('certificate_requests')
        .select('payment_amount')
        .eq('user_id', user.id)
        .eq('payment_status', 'paid');

      if (paidError) throw paidError;

      const totalSpent = (paidRequests || []).reduce((sum, req) => sum + (req.payment_amount || 0), 0);

      setStats({
        activeRequests: activeCount || 0,
        completed: completedCount || 0,
        totalSpent,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch stats for chairmen
  const fetchChairmanStats = async () => {
    if (!user?.id) return;

    try {
      // Get pending registrations count
      const { count: pendingCount, error: pendingError } = await supabase
        .from('pending_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('purok_chairman_id', user.id)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Get total residents count
      const { count: residentsCount, error: residentsError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('purok_chairman_id', user.id)
        .eq('role', 'resident');

      if (residentsError) throw residentsError;

      // Get pending certificate requests from residents
      const { data: residents, error: residentsListError } = await supabase
        .from('users')
        .select('id')
        .eq('purok_chairman_id', user.id)
        .eq('role', 'resident');

      if (residentsListError) throw residentsListError;

      const residentIds = (residents || []).map(r => r.id);

      let pendingRequestsCount = 0;
      if (residentIds.length > 0) {
        const { count: requestsCount, error: requestsError } = await supabase
          .from('certificate_requests')
          .select('*', { count: 'exact', head: true })
          .in('user_id', residentIds)
          .eq('status', 'pending');

        if (requestsError) throw requestsError;
        pendingRequestsCount = requestsCount || 0;
      }

      setChairmanStats({
        pendingRegistrations: pendingCount || 0,
        totalResidents: residentsCount || 0,
        pendingRequests: pendingRequestsCount,
      });
    } catch (error) {
      console.error('Error fetching chairman stats:', error);
    }
  };

  // Fetch data when user is available
  useEffect(() => {
    if (user && user.role !== 'purok_chairman') {
      fetchRecentActivities();
      fetchStats();

      // Set up real-time subscription for certificate requests
      const subscription = supabase
        .channel('certificate_requests_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'certificate_requests',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchRecentActivities();
            fetchStats();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  // Fetch chairman stats when user is chairman
  useEffect(() => {
    if (user && user.role === 'purok_chairman') {
      fetchChairmanStats();

      // Set up real-time subscriptions for chairmen
      const subscriptions = [
        supabase
          .channel('chairman_pending_registrations')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'pending_registrations',
              filter: `purok_chairman_id=eq.${user.id}`
            },
            () => {
              fetchChairmanStats();
            }
          )
          .subscribe(),
        supabase
          .channel('chairman_residents')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'users',
              filter: `purok_chairman_id=eq.${user.id}`
            },
            () => {
              fetchChairmanStats();
            }
          )
          .subscribe(),
        supabase
          .channel('chairman_certificate_requests')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'certificate_requests'
            },
            () => {
              fetchChairmanStats();
            }
          )
          .subscribe(),
      ];

      return () => {
        subscriptions.forEach(sub => sub.unsubscribe());
      };
    }
  }, [user]);

  const getQuickActions = (): QuickAction[] => {
    const baseActions = [
      {
        id: 'profile',
        title: 'Profile',
        icon: 'person-outline',
        color: theme.colors.secondary,
        onPress: () => navigation.navigate('Profile'),
      },
    ];

    if (user?.role === 'purok_chairman') {
      return [
        {
          id: 'pending_registrations',
          title: 'Pending Registrations',
          icon: 'person-add-outline',
          color: theme.colors.error,
          onPress: () => navigation.navigate('PendingRegistrations'),
          badge: pendingRegistrationsCount,
        },
        {
          id: 'manage_residents',
          title: 'Manage Residents',
          icon: 'people-outline',
          color: theme.colors.primary,
          onPress: () => navigation.navigate('ManageResidents'),
        },
        {
          id: 'certificate_requests',
          title: 'Certificate Requests',
          icon: 'document-text-outline',
          color: theme.colors.warning,
          onPress: () => navigation.navigate('CertificateRequests'),
        },
      ];
    }

    // Default resident actions
    return [
      {
        id: 'request',
        title: 'Request Certificate',
        icon: 'document-text-outline',
        color: theme.colors.primary,
        onPress: () => navigation.navigate('RequestCertificate'),
      },
      {
        id: 'track',
        title: 'Track Request',
        icon: 'search-outline',
        color: theme.colors.info,
        onPress: () => navigation.navigate('TrackRequest'),
      },
      {
        id: 'transactions',
        title: 'Transactions',
        icon: 'card-outline',
        color: theme.colors.success,
        onPress: () => navigation.navigate('Transaction'),
      },
    ];
  };

  const quickActions = getQuickActions();

  const getStatsCards = (): StatCard[] => {
    if (user?.role === 'purok_chairman') {
      return [
        {
          title: 'Pending Registrations',
          value: String(chairmanStats.pendingRegistrations),
          icon: 'person-add-outline',
          color: theme.colors.error,
        },
        {
          title: 'Total Residents',
          value: String(chairmanStats.totalResidents),
          icon: 'people-outline',
          color: theme.colors.primary,
        },
        {
          title: 'Pending Requests',
          value: String(chairmanStats.pendingRequests),
          icon: 'document-text-outline',
          color: theme.colors.warning,
        },
      ];
    }

    // Default resident stats
    return [
      {
        title: 'Active Requests',
        value: String(stats.activeRequests),
        icon: 'hourglass-outline',
        color: theme.colors.warning,
      },
      {
        title: 'Completed',
        value: String(stats.completed),
        icon: 'checkmark-circle-outline',
        color: theme.colors.success,
      },
      {
        title: 'Total Spent',
        value: `₱${stats.totalSpent}`,
        icon: 'wallet-outline',
        color: theme.colors.info,
      },
    ];
  };

  const statsCards = getStatsCards();

  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: theme.colors.primary,
      selectedTextColor: 'white',
    },
  };

  const handleNotificationPress = () => {
    navigation.navigate('Notifications');
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const openDrawer = () => {
    navigation.openDrawer();
  };

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.quickActionCard}
      onPress={action.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
        <Ionicons name={action.icon} size={moderateScale(28)} color={action.color} />
        {action.badge !== undefined && action.badge > 0 && (
          <View style={styles.quickActionBadge}>
            <Text style={styles.quickActionBadgeText}>
              {action.badge > 99 ? '99+' : String(action.badge)}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.quickActionTitle}>{action.title}</Text>
    </TouchableOpacity>
  );

  const renderStatCard = (stat: StatCard) => (
    <View key={stat.title} style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
        <Ionicons name={stat.icon} size={moderateScale(26)} color={stat.color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statTitle} numberOfLines={2}>{stat.title}</Text>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return theme.colors.success;
      case 'approved':
        return theme.colors.info;
      case 'processing':
        return theme.colors.warning;
      case 'pending':
        return '#FFA500'; // Orange color for pending
      case 'rejected':
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'checkmark-circle';
      case 'approved':
        return 'checkmark-done-circle';
      case 'processing':
        return 'sync-circle';
      case 'pending':
        return 'time';
      case 'rejected':
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const renderActivityItem = (activity: RecentActivity) => (
    <TouchableOpacity
      key={activity.id}
      style={styles.activityItem}
      onPress={() => navigation.navigate('TrackRequest')}
      activeOpacity={0.7}
    >
      <View style={[styles.activityIconContainer, { backgroundColor: getStatusColor(activity.status) + '20' }]}>
        <Ionicons
          name={getStatusIcon(activity.status)}
          size={moderateScale(24)}
          color={getStatusColor(activity.status)}
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{activity.certificate_type}</Text>
        <Text style={styles.activityDate}>{formatDate(activity.updated_at)}</Text>
      </View>
      <View style={[styles.activityStatusBadge, { backgroundColor: getStatusColor(activity.status) + '15' }]}>
        <Text style={[styles.activityStatusText, { color: getStatusColor(activity.status) }]}>
          {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
        </Text>
      </View>
    </TouchableOpacity>
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
          <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
            <Ionicons name="menu-outline" size={moderateScale(26)} color="white" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleNotificationPress}
          >
            <Ionicons name="notifications-outline" size={moderateScale(24)} color="white" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeBodySection}>
          <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.8}>
            <Image
              source={{ uri: profileImage || defaultAvatar }}
              style={styles.profileAvatar}
              onError={() => setProfileImage(null)}
            />
          </TouchableOpacity>
          <Text style={styles.welcomeBodyText}>Welcome back,</Text>
          <Text style={styles.userNameBody}>
            {loading ? 'Loading...' : (user?.full_name || 'User')}
          </Text>
          {user?.role === 'purok_chairman' && (
            <Text style={styles.roleBodyText}>Purok Chairman</Text>
          )}
          <Text style={styles.welcomeBodySubtext}>
            {user?.role === 'purok_chairman' ? 'Manage your purok community' : 'What would you like to do today?'}
          </Text>
          {user?.role === 'purok_chairman' && user?.purok && (
            <Text style={styles.purokBodyText}>Purok {user.purok}</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsContainer}>
            {statsCards.map(renderStatCard)}
          </View>
        </View>

        {/* Calendar Widget */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calendar</Text>
          <View style={styles.calendarContainer}>
            <Calendar
              current={selectedDate}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: theme.colors.text,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: theme.colors.primary,
                dayTextColor: theme.colors.text,
                textDisabledColor: theme.colors.textTertiary,
                dotColor: theme.colors.primary,
                selectedDotColor: '#FFFFFF',
                arrowColor: theme.colors.primary,
                disabledArrowColor: theme.colors.textTertiary,
                monthTextColor: theme.colors.text,
                indicatorColor: theme.colors.primary,
                textDayFontFamily: 'System',
                textMonthFontFamily: 'System',
                textDayHeaderFontFamily: 'System',
                textDayFontWeight: '400',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
                textDayFontSize: fontSize.base,
                textMonthFontSize: fontSize.base,
                textDayHeaderFontSize: fontSize.sm,
              }}
              style={styles.calendar}
            />
          </View>
        </View>

        {/* Recent Activity - Only for residents */}
        {user?.role !== 'purok_chairman' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TrackRequest')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activityContainer}>
              {recentActivities.length > 0 ? (
                recentActivities.map(renderActivityItem)
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="document-text-outline"
                    size={moderateScale(48)}
                    color={theme.colors.textTertiary}
                  />
                  <Text style={styles.emptyStateText}>No recent activity</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Your certificate requests will appear here
                  </Text>
                </View>
              )}
            </View>
          </View>
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
  menuButton: {
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
  headerRight: {
    width: moderateScale(40),
  },
  notificationButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: verticalScale(4),
    right: scale(4),
    backgroundColor: theme.colors.error,
    borderRadius: moderateScale(10),
    minWidth: moderateScale(20),
    height: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  welcomeSection: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  userName: {
    fontSize: fontSize.xl,
    color: 'white',
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    marginVertical: spacing.xs,
  },
  welcomeSubtext: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: theme.fontFamily.regular,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl + verticalScale(16),
  },
  section: {
    marginBottom: spacing.xl + verticalScale(8),
    paddingHorizontal: spacing.md,
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
    marginBottom: spacing.md,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(4),
    },
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(8),
    elevation: 4,
    minHeight: verticalScale(110),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  quickActionIcon: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -verticalScale(4),
    right: -scale(4),
    backgroundColor: theme.colors.error,
    borderRadius: moderateScale(12),
    minWidth: moderateScale(24),
    height: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(6),
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  quickActionBadgeText: {
    color: 'white',
    fontSize: fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  quickActionTitle: {
    fontSize: fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: verticalScale(16),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: verticalScale(130),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(4),
    },
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(8),
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  statIcon: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statContent: {
    alignItems: 'flex-start',
    flex: 1,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  statTitle: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    lineHeight: verticalScale(16),
    flexWrap: 'wrap',
  },
  calendarContainer: {
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
  calendar: {
    borderRadius: borderRadius.md,
  },
  activityContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  purokText: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginTop: spacing.xs,
  },
  welcomeBodySection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl + verticalScale(8),
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  welcomeBodyText: {
    fontSize: fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  userNameBody: {
    fontSize: fontSize.xl,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    marginTop: spacing.xs,
  },
  roleBodyText: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginBottom: spacing.xs,
  },
  welcomeBodySubtext: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.fontFamily.regular,
    textAlign: 'center',
  },
  purokBodyText: {
    fontSize: fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginTop: spacing.xs,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activityIconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  activityDate: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.fontFamily.regular,
  },
  activityStatusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  activityStatusText: {
    fontSize: fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
  },
  profileAvatar: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    borderWidth: scale(3),
    borderColor: theme.colors.primary,
    marginBottom: spacing.md,
  },
});