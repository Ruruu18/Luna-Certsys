import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'certificate_status' | 'payment' | 'system' | 'approval' | 'rejection' | 'reminder'
  related_certificate_id?: string
  is_read: boolean
  metadata?: {
    certificate_type?: string
    old_status?: string
    new_status?: string
    payment_amount?: number
    payment_method?: string
    payment_reference?: string
    [key: string]: any
  }
  created_at: string
  updated_at: string
}

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let realtimeChannel: RealtimeChannel | null = null

  // Computed properties
  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.is_read).length
  )

  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.is_read)
  )

  const recentNotifications = computed(() =>
    notifications.value.slice(0, 5)
  )

  /**
   * Fetch all notifications for a user
   */
  async function fetchNotifications(userId: string): Promise<void> {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) throw fetchError

      notifications.value = data || []
      console.log(`✅ Loaded ${notifications.value.length} notifications for user ${userId}`)
    } catch (err: any) {
      console.error('Error fetching notifications:', err)
      error.value = err.message || 'Failed to load notifications'
      notifications.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark a single notification as read
   */
  async function markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        // @ts-ignore - Supabase type inference issue
        .update({ is_read: true } as any)
        .eq('id', notificationId)

      if (updateError) throw updateError

      // Update local state
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.is_read = true
      }

      console.log(`✅ Marked notification ${notificationId} as read`)
      return true
    } catch (err: any) {
      console.error('Error marking notification as read:', err)
      error.value = err.message || 'Failed to mark notification as read'
      return false
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async function markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        // @ts-ignore - Supabase type inference issue
        .update({ is_read: true } as any)
        .eq('user_id', userId)
        .eq('is_read', false)

      if (updateError) throw updateError

      // Update local state
      notifications.value.forEach(notification => {
        notification.is_read = true
      })

      console.log(`✅ Marked all notifications as read for user ${userId}`)
      return true
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err)
      error.value = err.message || 'Failed to mark all as read'
      return false
    }
  }

  /**
   * Delete a notification
   */
  async function deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (deleteError) throw deleteError

      // Update local state
      notifications.value = notifications.value.filter(n => n.id !== notificationId)

      console.log(`✅ Deleted notification ${notificationId}`)
      return true
    } catch (err: any) {
      console.error('Error deleting notification:', err)
      error.value = err.message || 'Failed to delete notification'
      return false
    }
  }

  /**
   * Subscribe to real-time notification updates
   */
  function subscribeToNotifications(userId: string): void {
    // Unsubscribe from any existing channel first
    if (realtimeChannel) {
      realtimeChannel.unsubscribe()
    }

    console.log(`🔔 Subscribing to notifications for user ${userId}`)

    realtimeChannel = supabase
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
          console.log('🔔 New notification received:', payload)
          const newNotification = payload.new as Notification

          // Add to the beginning of the array
          notifications.value.unshift(newNotification)

          // Show browser notification if supported
          showBrowserNotification(newNotification)
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
          console.log('🔔 Notification updated:', payload)
          const updatedNotification = payload.new as Notification

          // Update in local state
          const index = notifications.value.findIndex(n => n.id === updatedNotification.id)
          if (index !== -1) {
            notifications.value[index] = updatedNotification
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 Notification deleted:', payload)
          const deletedId = payload.old.id

          // Remove from local state
          notifications.value = notifications.value.filter(n => n.id !== deletedId)
        }
      )
      .subscribe()
  }

  /**
   * Unsubscribe from real-time updates
   */
  function unsubscribe(): void {
    if (realtimeChannel) {
      console.log('🔕 Unsubscribing from notifications')
      realtimeChannel.unsubscribe()
      realtimeChannel = null
    }
  }

  /**
   * Show browser notification
   */
  function showBrowserNotification(notification: Notification): void {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      return
    }

    // Check if permission is granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
      })
    } else if (Notification.permission !== 'denied') {
      // Request permission
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: notification.id,
          })
        }
      })
    }
  }

  /**
   * Request browser notification permission
   */
  async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  /**
   * Create a manual notification (for admins to send system notifications)
   */
  async function createNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'],
    relatedCertificateId?: string,
    metadata?: any
  ): Promise<boolean> {
    try {
      const { data, error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          related_certificate_id: relatedCertificateId,
          metadata,
        } as any)
        .select()
        .single()

      if (insertError) throw insertError

      console.log('✅ Notification created:', data)
      return true
    } catch (err: any) {
      console.error('Error creating notification:', err)
      error.value = err.message || 'Failed to create notification'
      return false
    }
  }

  /**
   * Get notification icon name based on type
   */
  function getNotificationIcon(type: Notification['type']): string {
    switch (type) {
      case 'certificate_status':
        return 'document-text'
      case 'payment':
        return 'card'
      case 'approval':
        return 'checkmark-circle'
      case 'rejection':
        return 'close-circle'
      case 'reminder':
        return 'time'
      case 'system':
        return 'information-circle'
      default:
        return 'notifications'
    }
  }

  /**
   * Get notification color based on type
   */
  function getNotificationColor(type: Notification['type']): string {
    switch (type) {
      case 'approval':
        return '#10b981' // green
      case 'rejection':
        return '#ef4444' // red
      case 'payment':
        return '#3b82f6' // blue
      case 'reminder':
        return '#f59e0b' // orange
      case 'certificate_status':
        return '#8b5cf6' // purple
      case 'system':
        return '#6366f1' // indigo
      default:
        return '#64748b' // gray
    }
  }

  /**
   * Format notification time
   */
  function formatNotificationTime(createdAt: string): string {
    const now = new Date()
    const notificationDate = new Date(createdAt)
    const diffInMs = now.getTime() - notificationDate.getTime()
    const diffInMinutes = Math.floor(diffInMs / 60000)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    } else {
      return notificationDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: notificationDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      })
    }
  }

  /**
   * Clear all notifications (for testing or cleanup)
   */
  function clearAll(): void {
    notifications.value = []
  }

  return {
    // State
    notifications,
    loading,
    error,

    // Computed
    unreadCount,
    unreadNotifications,
    recentNotifications,

    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    subscribeToNotifications,
    unsubscribe,
    requestNotificationPermission,
    createNotification,
    getNotificationIcon,
    getNotificationColor,
    formatNotificationTime,
    clearAll,
  }
})
