<template>
  <div class="notification-bell">
    <button
      @click="toggleDropdown"
      class="bell-button"
      :class="{ 'has-unread': unreadCount > 0 }"
      aria-label="Notifications"
    >
      <svg class="bell-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <span v-if="unreadCount > 0" class="badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <transition name="dropdown">
      <div v-show="showDropdown" class="notification-dropdown">
        <!-- Header -->
        <div class="dropdown-header">
          <h3 class="dropdown-title">Notifications</h3>
          <button
            v-if="unreadCount > 0"
            @click="handleMarkAllRead"
            class="mark-all-btn"
            title="Mark all as read"
          >
            <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="dropdown-loading">
          <div class="spinner"></div>
          <p>Loading notifications...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="notifications.length === 0" class="dropdown-empty">
          <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p class="empty-text">No notifications yet</p>
          <p class="empty-subtext">You're all caught up!</p>
        </div>

        <!-- Notifications List -->
        <div v-else class="notification-list">
          <div
            v-for="notification in recentNotifications"
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': !notification.is_read }"
            @click="handleNotificationClick(notification)"
          >
            <div
              class="notification-icon"
              :style="{ backgroundColor: getNotificationColor(notification.type) + '20', color: getNotificationColor(notification.type) }"
            >
              <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  v-else-if="notification.type === 'certificate_status'"
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
                <p class="notification-title">{{ notification.title }}</p>
                <span v-if="!notification.is_read" class="unread-dot"></span>
              </div>
              <p class="notification-message">{{ notification.message }}</p>
              <p class="notification-time">{{ formatNotificationTime(notification.created_at) }}</p>
            </div>

            <button
              @click.stop="handleDelete(notification.id)"
              class="delete-btn"
              title="Delete notification"
            >
              <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="notifications.length > 0" class="dropdown-footer">
          <router-link to="/admin/notifications" class="view-all-link" @click="showDropdown = false">
            View all notifications
          </router-link>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotificationsStore } from '../stores/notifications'
import { useAuthStore } from '../stores/auth'
import type { Notification } from '../stores/notifications'

const notificationsStore = useNotificationsStore()
const authStore = useAuthStore()

const showDropdown = ref(false)

// Computed properties
const notifications = computed(() => notificationsStore.notifications)
const loading = computed(() => notificationsStore.loading)
const unreadCount = computed(() => notificationsStore.unreadCount)
const recentNotifications = computed(() => notificationsStore.recentNotifications)

// Get helper functions
const getNotificationColor = notificationsStore.getNotificationColor
const formatNotificationTime = notificationsStore.formatNotificationTime

// Toggle dropdown
function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

// Handle clicking outside
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  if (!target.closest('.notification-bell')) {
    showDropdown.value = false
  }
}

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

  // Close dropdown
  showDropdown.value = false

  // TODO: Navigate to related screen based on notification type
  // For now, we'll just close the dropdown
}

// Handle delete
async function handleDelete(notificationId: string) {
  const success = await notificationsStore.deleteNotification(notificationId)
  if (success) {
    console.log('✅ Notification deleted')
  }
}

// Initialize on mount
onMounted(async () => {
  document.addEventListener('click', handleClickOutside)

  if (authStore.user?.id) {
    // Fetch notifications
    await notificationsStore.fetchNotifications(authStore.user.id)

    // Subscribe to real-time updates
    notificationsStore.subscribeToNotifications(authStore.user.id)

    // Request browser notification permission
    await notificationsStore.requestNotificationPermission()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  notificationsStore.unsubscribe()
})
</script>

<style scoped>
.notification-bell {
  position: relative;
}

.bell-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background-color: var(--gray-50);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  border: 1.5px solid transparent;
}

.bell-button:hover {
  background-color: white;
  border-color: var(--primary-300);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.bell-button.has-unread {
  animation: bellRing 2s ease-in-out infinite;
}

@keyframes bellRing {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-10deg); }
  20%, 40% { transform: rotate(10deg); }
  50% { transform: rotate(0deg); }
}

.bell-icon {
  width: 1.375rem;
  height: 1.375rem;
  color: var(--gray-600);
  transition: color var(--transition-base);
}

.bell-button:hover .bell-icon {
  color: var(--primary-600);
}

.badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 0.25rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 380px;
  max-height: 500px;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-xl);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dropdown-enter-active, .dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--gray-200);
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

.dropdown-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
}

.mark-all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  color: var(--primary-600);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.mark-all-btn:hover {
  background: var(--primary-50);
}

.mark-all-btn .icon {
  width: 1.125rem;
  height: 1.125rem;
}

.dropdown-loading,
.dropdown-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.dropdown-loading p {
  color: var(--gray-600);
  font-size: 0.875rem;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: var(--gray-400);
  margin-bottom: 0.75rem;
}

.empty-text {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--gray-700);
  margin: 0 0 0.25rem 0;
}

.empty-subtext {
  font-size: 0.8125rem;
  color: var(--gray-500);
  margin: 0;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--gray-100);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  position: relative;
}

.notification-item:hover {
  background-color: var(--gray-50);
}

.notification-item.unread {
  background-color: #eff6ff;
  border-left: 3px solid var(--primary-600);
}

.notification-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-lg);
}

.notification-icon .icon {
  width: 1.25rem;
  height: 1.25rem;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.notification-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread-dot {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--primary-600);
  border-radius: 50%;
}

.notification-message {
  font-size: 0.8125rem;
  color: var(--gray-600);
  margin: 0 0 0.375rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-time {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin: 0;
}

.delete-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background: transparent;
  color: var(--gray-400);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  opacity: 0;
}

.notification-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background-color: var(--danger-50);
  color: var(--danger-600);
}

.delete-btn .icon {
  width: 1rem;
  height: 1rem;
}

.dropdown-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--gray-200);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.view-all-link {
  display: block;
  text-align: center;
  padding: 0.625rem;
  color: var(--primary-600);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.view-all-link:hover {
  background-color: var(--primary-50);
  color: var(--primary-700);
}
</style>
