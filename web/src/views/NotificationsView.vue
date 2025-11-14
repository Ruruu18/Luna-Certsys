<template>
  <div class="notifications-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-left">
        <h2 class="view-title">Notifications</h2>
        <p class="view-description">View and manage all your notifications</p>
      </div>
      <div class="header-right">
        <button
          v-if="unreadCount > 0"
          @click="handleMarkAllRead"
          class="btn btn-outline"
          :disabled="loading"
        >
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Mark All as Read
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading notifications...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="notifications.length === 0" class="empty-state">
      <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <h3>No notifications</h3>
      <p>You're all caught up! No notifications to display.</p>
    </div>

    <!-- Notifications List -->
    <div v-else class="notifications-container">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-card"
        :class="{ 'unread': !notification.is_read }"
        @click="handleNotificationClick(notification)"
      >
        <div
          class="notification-icon-wrapper"
          :style="{
            backgroundColor: getNotificationColor(notification.type) + '20',
            color: getNotificationColor(notification.type)
          }"
        >
          <svg class="notification-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              v-if="notification.type === 'approval'"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path
              v-else-if="notification.type === 'rejection'"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path
              v-else-if="notification.type === 'payment'"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
            <path
              v-else-if="notification.type === 'certificate_status' || notification.type === 'new_certificate_request'"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div class="notification-content">
          <div class="notification-header">
            <h4 class="notification-title">{{ notification.title }}</h4>
            <span v-if="!notification.is_read" class="unread-badge">New</span>
          </div>
          <p class="notification-message">{{ notification.message }}</p>

          <!-- Metadata display -->
          <div v-if="notification.metadata" class="notification-metadata">
            <span v-if="notification.metadata.resident_name" class="metadata-tag">
              <svg class="metadata-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {{ notification.metadata.resident_name }}
            </span>
            <span v-if="notification.metadata.certificate_type" class="metadata-tag">
              <svg class="metadata-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {{ notification.metadata.certificate_type }}
            </span>
            <span v-if="notification.metadata.purok" class="metadata-tag">
              <svg class="metadata-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {{ notification.metadata.purok }}
            </span>
            <span v-if="notification.metadata.amount" class="metadata-tag">
              <svg class="metadata-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ₱{{ notification.metadata.amount }}
            </span>
          </div>

          <div class="notification-footer">
            <span class="notification-time">{{ formatNotificationTime(notification.created_at) }}</span>
            <button
              @click.stop="handleDelete(notification.id)"
              class="delete-btn"
              title="Delete notification"
            >
              <svg class="delete-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useNotificationsStore } from '../stores/notifications'
import { useAuthStore } from '../stores/auth'
import type { Notification } from '../stores/notifications'

const notificationsStore = useNotificationsStore()
const authStore = useAuthStore()

// Computed
const notifications = computed(() => notificationsStore.notifications)
const loading = computed(() => notificationsStore.loading)
const unreadCount = computed(() => notificationsStore.unreadCount)

// Functions from store
const getNotificationColor = notificationsStore.getNotificationColor
const formatNotificationTime = notificationsStore.formatNotificationTime

// Mark all as read
async function handleMarkAllRead() {
  if (!authStore.user?.id) return

  const success = await notificationsStore.markAllAsRead(authStore.user.id)
  if (success) {
    console.log('✅ All notifications marked as read')
  }
}

// Handle notification click
async function handleNotificationClick(notification: Notification) {
  // Mark as read if unread
  if (!notification.is_read) {
    await notificationsStore.markAsRead(notification.id)
  }

  // TODO: Navigate to related screen based on notification type
}

// Handle delete
async function handleDelete(notificationId: string) {
  if (confirm('Are you sure you want to delete this notification?')) {
    const success = await notificationsStore.deleteNotification(notificationId)
    if (success) {
      console.log('✅ Notification deleted')
    }
  }
}

// Initialize
onMounted(async () => {
  if (authStore.user?.id) {
    await notificationsStore.fetchNotifications(authStore.user.id)
  }
})
</script>

<style scoped>
.notifications-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.header-left {
  flex: 1;
}

.view-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.view-description {
  color: #6b7280;
}

.header-right {
  display: flex;
  gap: 0.75rem;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-container p {
  color: #6b7280;
  font-size: 0.875rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.empty-icon {
  width: 5rem;
  height: 5rem;
  color: #d1d5db;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
  max-width: 32rem;
}

.notifications-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-card {
  display: flex;
  gap: 1.25rem;
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.notification-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.notification-card.unread {
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  border-left-color: #3b82f6;
}

.notification-icon-wrapper {
  flex-shrink: 0;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-icon {
  width: 1.75rem;
  height: 1.75rem;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.notification-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
}

.unread-badge {
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
  flex-shrink: 0;
}

.notification-message {
  color: #4b5563;
  font-size: 0.9375rem;
  line-height: 1.5;
  margin: 0 0 0.75rem 0;
}

.notification-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.metadata-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: #4b5563;
  font-weight: 500;
}

.metadata-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.notification-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.notification-time {
  font-size: 0.8125rem;
  color: #9ca3af;
}

.delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

.delete-icon {
  width: 1rem;
  height: 1rem;
}
</style>
