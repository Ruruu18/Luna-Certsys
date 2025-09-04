// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface NotificationScreenProps {
  navigation: any;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
  actionType?: 'certificate_ready' | 'payment_required' | 'request_approved' | 'request_rejected';
  referenceNumber?: string;
}

export default function NotificationScreen({ navigation }: NotificationScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Certificate Ready for Pickup',
      message: 'Your Barangay Clearance (REF-2024-001) is ready for pickup at the barangay office.',
      type: 'success',
      timestamp: '2024-01-22 10:30 AM',
      isRead: false,
      actionType: 'certificate_ready',
      referenceNumber: 'REF-2024-001',
    },
    {
      id: '2',
      title: 'Payment Required',
      message: 'Please complete payment for your Certificate of Residency request (REF-2024-002).',
      type: 'warning',
      timestamp: '2024-01-21 2:15 PM',
      isRead: false,
      actionType: 'payment_required',
      referenceNumber: 'REF-2024-002',
    },
    {
      id: '3',
      title: 'Request Approved',
      message: 'Your Certificate of Indigency request has been approved and is now being processed.',
      type: 'info',
      timestamp: '2024-01-20 9:45 AM',
      isRead: true,
      actionType: 'request_approved',
      referenceNumber: 'REF-2024-003',
    },
    {
      id: '4',
      title: 'System Maintenance',
      message: 'The system will undergo maintenance on January 25, 2024 from 12:00 AM to 6:00 AM.',
      type: 'info',
      timestamp: '2024-01-19 5:00 PM',
      isRead: true,
    },
  ]);

  const [selectedFilter, setSelectedFilter] = useState('All');
  const filterOptions = ['All', 'Unread', 'Read'];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'close-circle';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      case 'info':
      default:
        return theme.colors.info;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotifications(prev => prev.filter(n => n.id !== id));
          }
        }
      ]
    );
  };

  const handleNotificationAction = (notification: Notification) => {
    markAsRead(notification.id);
    
    switch (notification.actionType) {
      case 'certificate_ready':
      case 'request_approved':
      case 'request_rejected':
        navigation.navigate('TrackRequest');
        break;
      case 'payment_required':
        navigation.navigate('Transaction');
        break;
      default:
        break;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (selectedFilter) {
      case 'Unread':
        return !notification.isRead;
      case 'Read':
        return notification.isRead;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationAction(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '15' }]}>
            <Ionicons
              name={getNotificationIcon(item.type) as any}
              size={20}
              color={getNotificationColor(item.type)}
            />
          </View>
          <View style={styles.notificationInfo}>
            <View style={styles.titleRow}>
              <Text style={[
                styles.notificationTitle,
                !item.isRead && styles.unreadTitle
              ]}>
                {item.title}
              </Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationTimestamp}>
              {item.timestamp}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              deleteNotification(item.id);
            }}
          >
            <Ionicons name="close-outline" size={16} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.notificationMessage}>
          {item.message}
        </Text>
        
        {item.referenceNumber && (
          <View style={styles.referenceContainer}>
            <Text style={styles.referenceText}>
              Ref: {item.referenceNumber}
            </Text>
          </View>
        )}
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Ionicons name="checkmark-done" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filterOptions.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.activeFilterButton
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === filter && styles.activeFilterButtonText
            ]}>
              {filter}
              {filter === 'Unread' && unreadCount > 0 && ` (${unreadCount})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons 
                name="notifications-outline" 
                size={64} 
                color={theme.colors.textTertiary} 
              />
              <Text style={styles.emptyStateText}>
                {selectedFilter === 'All' 
                  ? 'No notifications yet'
                  : `No ${selectedFilter.toLowerCase()} notifications`
                }
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedFilter === 'All'
                  ? 'You\'ll receive notifications about your certificate requests here'
                  : `Switch to "All" to see all notifications`
                }
              </Text>
            </View>
          }
        />
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
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
  },
  headerBadge: {
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: theme.spacing.xs,
  },
  headerBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
  },
  markAllButton: {
    padding: theme.spacing.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.xs,
  },
  activeFilterButton: {
    backgroundColor: theme.colors.primary + '15',
  },
  filterButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  activeFilterButtonText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: theme.spacing.lg,
  },
  notificationCard: {
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
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  notificationInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  notificationTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.text,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  notificationTimestamp: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  notificationMessage: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  referenceContainer: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  referenceText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
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
});