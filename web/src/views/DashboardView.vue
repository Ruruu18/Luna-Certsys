<template>
  <div class="dashboard">
    <!-- Header with Greeting -->
    <div class="view-header">
      <div class="header-left">
        <h2 class="view-title">{{ greeting }}, Admin!</h2>
        <p class="view-description">{{ currentDate }} - Here's what's happening in your barangay today</p>
      </div>
      <div class="header-actions">
        <router-link to="/admin/certificates" class="quick-action-btn primary">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          New Certificate
        </router-link>
        <router-link to="/admin/users" class="quick-action-btn secondary">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add User
        </router-link>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-header">
            <h3 class="stat-title">Total Users</h3>
            <span class="stat-badge verified">{{ stats.verifiedUsers }} Verified</span>
          </div>
          <p class="stat-value">{{ stats.totalUsers }}</p>
          <p class="stat-description">{{ stats.residents }} Residents, {{ stats.purokChairmen }} Chairmen</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-green">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-header">
            <h3 class="stat-title">Total Certificates</h3>
            <span class="stat-badge completed">{{ stats.completedCertificates }} Completed</span>
          </div>
          <p class="stat-value">{{ stats.totalCertificates }}</p>
          <p class="stat-description">{{ stats.walkInCertificates }} Walk-in, {{ stats.mobileAppCertificates }} Mobile</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-yellow">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-header">
            <h3 class="stat-title">Pending Requests</h3>
            <span class="stat-badge progress">{{ stats.inProgressCertificates }} In Progress</span>
          </div>
          <p class="stat-value">{{ stats.pendingCertificates }}</p>
          <p class="stat-description">{{ stats.pendingCertificates > 0 ? 'Needs your attention' : 'All caught up!' }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-purple">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-header">
            <h3 class="stat-title">Certificate Types</h3>
            <span class="stat-badge info">{{ stats.certificateTypes }} Types</span>
          </div>
          <p class="stat-value">{{ stats.mostRequestedType }}</p>
          <p class="stat-description">Most requested certificate</p>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="dashboard-grid">
      <div class="dashboard-card">
        <div class="card-header">
          <h3 class="card-title">Recent Certificates</h3>
          <router-link to="/admin/certificates" class="card-link">View All Certificates</router-link>
        </div>
        <div class="card-content">
          <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p class="loading-text">Loading certificates...</p>
          </div>
          <div v-else-if="certificatesStore.error" class="error-state">
            <p>{{ certificatesStore.error }}</p>
          </div>
          <div v-else-if="recentCertificates.length === 0" class="empty-state">
            <p>No recent certificates</p>
          </div>
          <div v-else class="certificate-list">
            <div
              v-for="certificate in recentCertificates"
              :key="certificate.id"
              class="certificate-item"
            >
              <div class="certificate-info">
                <div class="certificate-header">
                  <h4 class="certificate-type">{{ certificate.certificate_type }}</h4>
                  <span
                    class="source-badge"
                    :class="certificate.source === 'mobile-app' ? 'source-mobile' : 'source-walkin'"
                  >
                    {{ certificate.source === 'mobile-app' ? '📱 Mobile' : '🏢 Walk-in' }}
                  </span>
                </div>
                <p class="certificate-user">{{ certificate.users?.full_name || 'Unknown User' }}</p>
              </div>
              <div class="certificate-status">
                <span
                  class="badge"
                  :class="{
                    'badge-warning': certificate.status === 'pending',
                    'badge-info': certificate.status === 'approved' || certificate.status === 'in_progress',
                    'badge-success': certificate.status === 'completed',
                    'badge-danger': certificate.status === 'rejected'
                  }"
                >
                  {{ certificate.status === 'in_progress' ? 'In Progress' : certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-card">
        <div class="card-header">
          <h3 class="card-title">Recent Users</h3>
          <router-link to="/admin/users" class="card-link">View All</router-link>
        </div>
        <div class="card-content">
          <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p class="loading-text">Loading users...</p>
          </div>
          <div v-else-if="usersStore.error" class="error-state">
            <p>{{ usersStore.error }}</p>
          </div>
          <div v-else-if="recentUsers.length === 0" class="empty-state">
            <p>No recent users</p>
          </div>
          <div v-else class="user-list">
            <div
              v-for="user in recentUsers"
              :key="user.id"
              class="user-item"
            >
              <div class="user-info">
                <h4 class="user-name">{{ user.full_name }}</h4>
                <p class="user-details">{{ user.email }}</p>
              </div>
              <div class="user-role">
                <span
                  class="badge"
                  :class="{
                    'badge-danger': user.role === 'admin',
                    'badge-warning': user.role === 'purok_chairman',
                    'badge-info': user.role === 'resident'
                  }"
                >
                  {{ user.role.replace('_', ' ') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useUsersStore } from '../stores/users'
import { useCertificatesStore } from '../stores/certificates'
import { useCertificateRequestsStore } from '../stores/certificateRequests'
import { supabase } from '../lib/supabase'

const usersStore = useUsersStore()
const certificatesStore = useCertificatesStore()
const requestsStore = useCertificateRequestsStore()

const loading = ref(true)

// Greeting based on time of day
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
})

// Current date formatted
const currentDate = computed(() => {
  const date = new Date()
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const stats = computed(() => {
  // Combine walk-in certificates and mobile app requests
  const totalWalkIn = certificatesStore.certificates.length
  const totalMobileApp = requestsStore.requests.length
  const pendingWalkIn = certificatesStore.certificates.filter(c => c.status === 'pending').length
  const pendingMobileApp = requestsStore.requests.filter(r => r.status === 'pending').length
  const inProgressWalkIn = certificatesStore.certificates.filter(c => c.status === 'approved' || c.status === 'in_progress').length
  const inProgressMobileApp = requestsStore.requests.filter(r => r.status === 'in_progress').length
  const completedWalkIn = certificatesStore.certificates.filter(c => c.status === 'completed').length
  const completedMobileApp = requestsStore.requests.filter(r => r.status === 'completed').length

  // Get most requested certificate type
  const allCertificates = [
    ...certificatesStore.certificates,
    ...requestsStore.requests
  ]
  const typeCounts = allCertificates.reduce((acc, cert) => {
    acc[cert.certificate_type] = (acc[cert.certificate_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const mostRequested = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]
  const uniqueTypes = Object.keys(typeCounts).length

  return {
    // User stats
    totalUsers: usersStore.users.length,
    residents: usersStore.users.filter(u => u.role === 'resident').length,
    purokChairmen: usersStore.users.filter(u => u.role === 'purok_chairman').length,
    verifiedUsers: usersStore.users.filter(u => u.face_verified).length,

    // Certificate stats
    totalCertificates: totalWalkIn + totalMobileApp,
    walkInCertificates: totalWalkIn,
    mobileAppCertificates: totalMobileApp,
    pendingCertificates: pendingWalkIn + pendingMobileApp,
    inProgressCertificates: inProgressWalkIn + inProgressMobileApp,
    completedCertificates: completedWalkIn + completedMobileApp,

    // Certificate type stats
    certificateTypes: uniqueTypes,
    mostRequestedType: mostRequested ? mostRequested[0] : 'N/A'
  }
})

const recentCertificates = computed(() => {
  // Combine walk-in certificates and mobile app requests
  const allCertificates = [
    ...certificatesStore.certificates.map(cert => ({
      ...cert,
      source: 'walk-in' as const
    })),
    ...requestsStore.requests.map(req => ({
      id: req.id,
      certificate_type: req.certificate_type,
      status: req.status,
      requested_at: req.created_at,
      users: req.users,
      source: 'mobile-app' as const
    }))
  ]

  // Sort by date (most recent first) and take top 3
  return allCertificates
    .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime())
    .slice(0, 3)
})

const recentUsers = computed(() =>
  usersStore.users.slice(0, 3)
)

let dashboardSubscriptions: any[] = []

onMounted(() => {
  // ✅ Data is already loaded by AdminLayout, just stop loading spinner
  console.log('📊 Dashboard using cached data from layout')
  console.log('Walk-in certificates:', certificatesStore.certificates.length)
  console.log('Mobile app requests:', requestsStore.requests.length)
  console.log('Users:', usersStore.users.length)
  loading.value = false

  // Set up real-time subscriptions for dashboard stats
  console.log('📡 Setting up real-time subscriptions for dashboard...')

  // Subscribe to users table changes
  const usersSubscription = supabase
    .channel('dashboard_users')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users'
      },
      (payload) => {
        console.log('🔔 Dashboard users update:', payload.eventType)
        usersStore.fetchUsers()
      }
    )
    .subscribe()

  // Subscribe to certificate_requests table changes
  const requestsSubscription = supabase
    .channel('dashboard_requests')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'certificate_requests'
      },
      (payload) => {
        console.log('🔔 Dashboard requests update:', payload.eventType)
        requestsStore.fetchRequests()
      }
    )
    .subscribe()

  // Subscribe to certificates table changes
  const certificatesSubscription = supabase
    .channel('dashboard_certificates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'certificates'
      },
      (payload) => {
        console.log('🔔 Dashboard certificates update:', payload.eventType)
        certificatesStore.fetchCertificates()
      }
    )
    .subscribe()

  dashboardSubscriptions = [usersSubscription, requestsSubscription, certificatesSubscription]
})

onUnmounted(() => {
  console.log('🔌 Unsubscribing from dashboard changes')
  dashboardSubscriptions.forEach(sub => sub.unsubscribe())
  dashboardSubscriptions = []
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.header-left {
  flex: 1;
  min-width: 0;
}

.view-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.375rem;
  letter-spacing: -0.02em;
}

.view-description {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.quick-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  white-space: nowrap;
}

.quick-action-btn .btn-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.quick-action-btn.primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.quick-action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.quick-action-btn.secondary {
  background: white;
  color: #3b82f6;
  border-color: #3b82f6;
}

.quick-action-btn.secondary:hover {
  background: #eff6ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  border-color: currentColor;
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card:nth-child(1) {
  color: #3b82f6;
}

.stat-card:nth-child(2) {
  color: #10b981;
}

.stat-card:nth-child(3) {
  color: #f59e0b;
}

.stat-card:nth-child(4) {
  color: #8b5cf6;
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  transition: all 0.3s ease;
  background: currentColor;
}

.stat-card:hover .stat-icon {
  transform: scale(1.05);
  box-shadow: 0 6px 12px currentColor;
}

.stat-icon svg {
  width: 1.5rem;
  height: 1.5rem;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.stat-title {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-badge {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.1875rem 0.5rem;
  border-radius: 9999px;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.stat-badge.verified {
  background-color: #d1fae5;
  color: #065f46;
}

.stat-badge.completed {
  background-color: #d1fae5;
  color: #065f46;
}

.stat-badge.progress {
  background-color: #dbeafe;
  color: #1e40af;
}

.stat-badge.info {
  background-color: #f3e8ff;
  color: #6b21a8;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
  line-height: 1;
  letter-spacing: -0.02em;
}

.stat-description {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  line-height: 1.3;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 1.25rem;
}

.dashboard-card {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
}

.dashboard-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background-color: #fafafa;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
}

.card-link {
  font-size: 0.8125rem;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  background-color: rgba(59, 130, 246, 0.08);
}

.card-link:hover {
  background-color: rgba(59, 130, 246, 0.15);
  color: #2563eb;
  transform: translateX(2px);
}

.card-content {
  padding: 1rem 1.25rem;
}

.empty-state {
  text-align: center;
  padding: 3.5rem 1.5rem;
  color: var(--gray-400);
  font-size: 0.9375rem;
}

.certificate-list,
.user-list {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.certificate-item,
.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 0.5rem;
  transition: all 0.25s ease;
  background-color: #fafafa;
}

.certificate-item:hover,
.user-item:hover {
  background-color: white;
  border-color: #3b82f6;
  transform: translateX(4px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
}

.certificate-info,
.user-info {
  flex: 1;
  min-width: 0;
}

.certificate-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
  flex-wrap: wrap;
}

.certificate-type,
.user-name {
  font-weight: 600;
  color: #111827;
  font-size: 0.875rem;
  letter-spacing: -0.01em;
}

.source-badge {
  font-size: 0.625rem;
  padding: 0.125rem 0.4rem;
  border-radius: 0.25rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.source-mobile {
  background-color: #dbeafe;
  color: #1e40af;
}

.source-walkin {
  background-color: #f3e8ff;
  color: #6b21a8;
}

.certificate-user,
.user-details {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.certificate-status,
.user-role {
  flex-shrink: 0;
}

/* Loading State */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid rgba(59, 130, 246, 0.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  color: var(--gray-500);
  font-size: 0.875rem;
  font-weight: 500;
}

.error-state {
  text-align: center;
  padding: 3.5rem 1.5rem;
  color: var(--danger-600);
  font-size: 0.9375rem;
  background-color: var(--danger-50);
  border-radius: 0.5rem;
  margin: 0.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 1280px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .quick-action-btn {
    flex: 1;
    justify-content: center;
  }

  .view-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    width: 2.5rem;
    height: 2.5rem;
  }

  .stat-icon svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .stat-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
