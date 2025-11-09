import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import {
  Notification,
  markNotificationAsRead,
  deleteNotification,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
} from '../services/notificationService';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';

interface NotificationDetailScreenProps {
  navigation: any;
  route: any;
}

export default function NotificationDetailScreen({ navigation, route }: NotificationDetailScreenProps) {
  const { notification: initialNotification } = route.params;
  const [notification, setNotification] = useState<Notification>(initialNotification);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Mark as read when viewing
    if (!notification.is_read) {
      markAsRead();
    }
  }, []);

  const markAsRead = async () => {
    const { success } = await markNotificationAsRead(notification.id);
    if (success) {
      setNotification({ ...notification, is_read: true });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { success } = await deleteNotification(notification.id);

            if (success) {
              Alert.alert('Deleted', 'Notification has been deleted', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } else {
              setDeleting(false);
              Alert.alert('Error', 'Failed to delete notification. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRelatedAction = () => {
    // Navigate based on notification type
    if (notification.related_certificate_id) {
      navigation.navigate('TrackRequest');
    }
  };

  const iconName = getNotificationIcon(notification.type);
  const color = getNotificationColor(notification.type);
  const timeAgo = formatNotificationTime(notification.created_at);
  const fullDate = new Date(notification.created_at).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Helper function to format status text
  const formatStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'approved': 'Approved',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'rejected': 'Rejected',
      'cancelled': 'Cancelled',
    };
    return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Parse metadata if available
  const metadata = notification.metadata || {};
  const hasMetadata = Object.keys(metadata).length > 0;

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
            <Text style={styles.title}>Notification Details</Text>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleting}
          >
            <Ionicons
              name="trash-outline"
              size={moderateScale(24)}
              color={deleting ? 'rgba(255,255,255,0.5)' : 'white'}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon and Type */}
        <View style={styles.iconSection}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={iconName as any} size={moderateScale(48)} color={color} />
          </View>
          <View style={[styles.typeBadge, { backgroundColor: color + '15' }]}>
            <Text style={[styles.typeText, { color }]}>
              {notification.type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
        </View>

        {/* Message */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Message</Text>
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{notification.message}</Text>
          </View>
        </View>

        {/* Timestamp */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Received</Text>
          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoValue}>{timeAgo}</Text>
              <Text style={styles.infoSubtext}>{fullDate}</Text>
            </View>
          </View>
        </View>

        {/* Metadata */}
        {hasMetadata && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Additional Information</Text>
            <View style={styles.metadataContainer}>
              {metadata.certificate_type && (
                <View style={styles.metadataItem}>
                  <Ionicons name="document-text-outline" size={moderateScale(18)} color={theme.colors.textSecondary} />
                  <View style={styles.metadataContent}>
                    <Text style={styles.metadataLabel}>Certificate Type</Text>
                    <Text style={styles.metadataValue}>{metadata.certificate_type}</Text>
                  </View>
                </View>
              )}

              {metadata.old_status && metadata.new_status && (
                <View style={styles.metadataItem}>
                  <Ionicons name="swap-horizontal-outline" size={moderateScale(18)} color={theme.colors.textSecondary} />
                  <View style={styles.metadataContent}>
                    <Text style={styles.metadataLabel}>Status Change</Text>
                    <Text style={styles.metadataValue}>
                      {formatStatus(metadata.old_status)} → {formatStatus(metadata.new_status)}
                    </Text>
                  </View>
                </View>
              )}

              {metadata.payment_amount && (
                <View style={styles.metadataItem}>
                  <Ionicons name="cash-outline" size={moderateScale(18)} color={theme.colors.textSecondary} />
                  <View style={styles.metadataContent}>
                    <Text style={styles.metadataLabel}>Payment Amount</Text>
                    <Text style={styles.metadataValue}>₱{metadata.payment_amount}</Text>
                  </View>
                </View>
              )}

              {metadata.payment_method && (
                <View style={styles.metadataItem}>
                  <Ionicons name="card-outline" size={moderateScale(18)} color={theme.colors.textSecondary} />
                  <View style={styles.metadataContent}>
                    <Text style={styles.metadataLabel}>Payment Method</Text>
                    <Text style={styles.metadataValue}>{metadata.payment_method}</Text>
                  </View>
                </View>
              )}

              {metadata.payment_reference && (
                <View style={styles.metadataItem}>
                  <Ionicons name="receipt-outline" size={moderateScale(18)} color={theme.colors.textSecondary} />
                  <View style={styles.metadataContent}>
                    <Text style={styles.metadataLabel}>Reference Number</Text>
                    <Text style={styles.metadataValue}>{metadata.payment_reference}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action Button */}
        {notification.related_certificate_id && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRelatedAction}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-forward-circle-outline" size={moderateScale(24)} color="white" />
              <Text style={styles.actionButtonText}>View Certificate Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Read Status */}
        <View style={styles.statusFooter}>
          <View style={styles.statusIndicator}>
            <Ionicons
              name={notification.is_read ? "checkmark-circle" : "ellipse-outline"}
              size={moderateScale(16)}
              color={notification.is_read ? theme.colors.success : theme.colors.textTertiary}
            />
            <Text style={styles.statusText}>
              {notification.is_read ? 'Read' : 'Unread'}
            </Text>
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
  deleteButton: {
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
  iconSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  iconContainer: {
    width: moderateScale(96),
    height: moderateScale(96),
    borderRadius: moderateScale(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  typeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  typeText: {
    fontSize: fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationTitle: {
    fontSize: fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    lineHeight: verticalScale(32),
  },
  messageContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  messageText: {
    fontSize: fontSize.md,
    color: theme.colors.text,
    lineHeight: verticalScale(24),
    fontFamily: theme.fontFamily.regular,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  infoContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  infoValue: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  infoSubtext: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.fontFamily.regular,
  },
  metadataContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  metadataContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  metadataLabel: {
    fontSize: fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: spacing.xs,
    fontFamily: theme.fontFamily.regular,
  },
  metadataValue: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.text,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
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
  statusFooter: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: spacing.xs,
    fontFamily: theme.fontFamily.medium,
  },
});
