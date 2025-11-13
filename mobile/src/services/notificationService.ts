import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'certificate_status' | 'payment' | 'system' | 'approval' | 'rejection' | 'reminder' | 'new_registration' | 'new_certificate_request';
  related_certificate_id?: string;
  is_read: boolean;
  metadata?: {
    certificate_type?: string;
    old_status?: string;
    new_status?: string;
    payment_amount?: number;
    payment_method?: string;
    payment_reference?: string;
    resident_name?: string;
    resident_id?: string;
    purok?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

// Configure how notifications should be presented when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request permission for push notifications
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data;
      console.log('Push notification token:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Save push notification token to user's profile
 */
export async function savePushTokenToProfile(userId: string, token: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

/**
 * Fetch all notifications for a user
 */
export async function fetchNotifications(userId: string): Promise<{
  data: Notification[] | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { data: null, error };
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<{
  success: boolean;
  error: any;
}> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<{
  success: boolean;
  error: any;
}> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<{
  success: boolean;
  error: any;
}> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Subscribe to real-time notification updates
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
) {
  const channel = supabase
    .channel('notifications-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('New notification received:', payload);
        onNotification(payload.new as Notification);

        // Show local notification
        showLocalNotification(payload.new as Notification);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Notification updated:', payload);
        onNotification(payload.new as Notification);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Show a local notification (when app is in foreground)
 */
async function showLocalNotification(notification: Notification): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.message,
      data: {
        notificationId: notification.id,
        certificateId: notification.related_certificate_id,
        type: notification.type,
      },
    },
    trigger: null, // Show immediately
  });
}

/**
 * Create a manual notification (for testing or admin actions)
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification['type'],
  relatedCertificateId?: string,
  metadata?: any
): Promise<{
  success: boolean;
  data?: Notification;
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        related_certificate_id: relatedCertificateId,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
}

/**
 * Get notification icon name based on type
 */
export function getNotificationIcon(type: Notification['type']): string {
  switch (type) {
    case 'certificate_status':
      return 'document-text';
    case 'payment':
      return 'card';
    case 'approval':
      return 'checkmark-circle';
    case 'rejection':
      return 'close-circle';
    case 'reminder':
      return 'time';
    case 'system':
      return 'information-circle';
    case 'new_registration':
      return 'person-add';
    case 'new_certificate_request':
      return 'document';
    default:
      return 'notifications';
  }
}

/**
 * Get notification color based on type
 */
export function getNotificationColor(type: Notification['type']): string {
  switch (type) {
    case 'approval':
      return '#10b981'; // green
    case 'rejection':
      return '#ef4444'; // red
    case 'payment':
      return '#3b82f6'; // blue
    case 'reminder':
      return '#f59e0b'; // orange
    case 'certificate_status':
      return '#8b5cf6'; // purple
    case 'system':
      return '#6366f1'; // indigo
    case 'new_registration':
      return '#10b981'; // green
    case 'new_certificate_request':
      return '#f59e0b'; // orange
    default:
      return '#64748b'; // gray
  }
}

/**
 * Format notification time (e.g., "2 hours ago", "Just now")
 * Handles UTC timestamps from database correctly
 */
export function formatNotificationTime(createdAt: string): string {
  // Get current time in UTC
  const now = new Date();

  // Parse the database timestamp (Supabase stores in UTC with 'Z' suffix)
  // Ensure we're parsing it as UTC
  let notificationDate = new Date(createdAt);

  // If the timestamp doesn't have timezone info, it might be interpreted as local time
  // Force UTC interpretation by adding 'Z' if not present
  if (!createdAt.endsWith('Z') && !createdAt.includes('+') && !createdAt.includes('-', 10)) {
    notificationDate = new Date(createdAt + 'Z');
  }

  const diffInMs = now.getTime() - notificationDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    // Convert to Philippines timezone for display
    return notificationDate.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: notificationDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      timeZone: 'Asia/Manila',
    });
  }
}
