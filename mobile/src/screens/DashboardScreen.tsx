// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardScreenProps {
  navigation: any;
}

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  });
  const [notificationCount, setNotificationCount] = useState(3);
  const { user, loading } = useAuth();

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
        {
          id: 'notifications',
          title: 'Notifications',
          icon: 'notifications-outline',
          color: theme.colors.info,
          onPress: () => navigation.navigate('Notifications'),
        },
        ...baseActions,
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

  const stats: StatCard[] = [
    {
      title: 'Active Requests',
      value: '2',
      icon: 'hourglass-outline',
      color: theme.colors.warning,
    },
    {
      title: 'Completed',
      value: '5',
      icon: 'checkmark-circle-outline',
      color: theme.colors.success,
    },
    {
      title: 'Total Spent',
      value: '₱450',
      icon: 'wallet-outline',
      color: theme.colors.info,
    },
  ];

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
      <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
        <Ionicons name={action.icon as any} size={24} color={action.color} />
      </View>
      <Text style={styles.quickActionTitle}>{action.title}</Text>
    </TouchableOpacity>
  );

  const renderStatCard = (stat: StatCard) => (
    <View key={stat.title} style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
        <Ionicons name={stat.icon as any} size={24} color={stat.color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statTitle} numberOfLines={2}>{stat.title}</Text>
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
          <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
            <Ionicons name="menu-outline" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerCenter} />

          <View style={styles.headerRightButtons}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfilePress}
            >
              <Ionicons name="person-outline" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={handleNotificationPress}
            >
              <Ionicons name="notifications-outline" size={24} color="white" />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeBodySection}>
          <Text style={styles.welcomeBodyText}>Welcome back,</Text>
          <Text style={styles.userNameBody}>
            {loading ? 'Loading...' : (user?.full_name || 'User')}
          </Text>
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
            {stats.map(renderStatCard)}
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
                textDayFontSize: 15,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13,
              }}
              style={styles.calendar}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TrackRequest')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityContainer}>
            <View style={styles.emptyState}>
              <Ionicons 
                name="document-text-outline" 
                size={48} 
                color={theme.colors.textTertiary} 
              />
              <Text style={styles.emptyStateText}>No recent activity</Text>
              <Text style={styles.emptyStateSubtext}>
                Your certificate requests will appear here
              </Text>
            </View>
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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  menuButton: {
    padding: theme.spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.xs,
  },
  notificationButton: {
    padding: theme.spacing.sm,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
  },
  welcomeSection: {
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: theme.fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  userName: {
    fontSize: theme.fontSize.xl,
    color: 'white',
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    marginVertical: theme.spacing.xs,
  },
  welcomeSubtext: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: theme.fontFamily.regular,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl + 16,
  },
  section: {
    marginBottom: theme.spacing.xl + 8,
    paddingHorizontal: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  viewAllText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.xs,
    alignItems: 'center',
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionTitle: {
    fontSize: 11,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 13,
    numberOfLines: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs / 2,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  statContent: {
    alignItems: 'flex-start',
    flex: 1,
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    lineHeight: 16,
    flexWrap: 'wrap',
  },
  calendarContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendar: {
    borderRadius: theme.borderRadius.md,
  },
  activityContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyStateText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  purokText: {
    fontSize: theme.fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginTop: theme.spacing.xs,
  },
  welcomeBodySection: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl + 8,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeBodyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  userNameBody: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    marginVertical: theme.spacing.xs,
  },
  welcomeBodySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.fontFamily.regular,
    textAlign: 'center',
  },
  purokBodyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginTop: theme.spacing.xs,
  },
});