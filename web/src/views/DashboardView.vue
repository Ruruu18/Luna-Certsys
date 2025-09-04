<template>
  <div class="dashboard">
    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-title">Total Users</h3>
          <p class="stat-value">{{ stats.totalUsers }}</p>
          <p class="stat-description">Registered users</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-green">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-title">Total Certificates</h3>
          <p class="stat-value">{{ stats.totalCertificates }}</p>
          <p class="stat-description">All certificates</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-yellow">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-title">Pending Requests</h3>
          <p class="stat-value">{{ stats.pendingCertificates }}</p>
          <p class="stat-description">Awaiting approval</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-purple">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-title">Purok Chairmen</h3>
          <p class="stat-value">{{ stats.purokChairmen }}</p>
          <p class="stat-description">Community leaders</p>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="dashboard-grid">
      <div class="dashboard-card">
        <div class="card-header">
          <h3 class="card-title">Recent Certificates</h3>
          <router-link to="/admin/certificates" class="card-link">View All</router-link>
        </div>
        <div class="card-content">
          <div v-if="loading" class="loading">
            <div class="spinner"></div>
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
                <h4 class="certificate-type">{{ certificate.certificate_type }}</h4>
                <p class="certificate-user">{{ certificate.users?.full_name || 'Unknown User' }}</p>
              </div>
              <div class="certificate-status">
                <span
                  class="badge"
                  :class="{
                    'badge-warning': certificate.status === 'pending',
                    'badge-info': certificate.status === 'approved',
                    'badge-success': certificate.status === 'completed',
                    'badge-danger': certificate.status === 'rejected'
                  }"
                >
                  {{ certificate.status }}
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
import { ref, onMounted, computed } from 'vue'
import { useUsersStore } from '../stores/users'
import { useCertificatesStore } from '../stores/certificates'

const usersStore = useUsersStore()
const certificatesStore = useCertificatesStore()

const loading = ref(true)

const stats = computed(() => ({
  totalUsers: usersStore.users.length,
  totalCertificates: certificatesStore.certificates.length,
  pendingCertificates: certificatesStore.certificates.filter(c => c.status === 'pending').length,
  purokChairmen: usersStore.users.filter(u => u.role === 'purok_chairman').length
}))

const recentCertificates = computed(() =>
  certificatesStore.certificates.slice(0, 5)
)

const recentUsers = computed(() =>
  usersStore.users.slice(0, 5)
)

onMounted(async () => {
  try {
    await Promise.all([
      usersStore.fetchUsers(),
      certificatesStore.fetchCertificates()
    ])
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  margin-bottom: 3rem;
}

.stat-card {
  background-color: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.stat-icon-blue {
  background-color: #dbeafe;
  color: #1e40af;
}

.stat-icon-green {
  background-color: #d1fae5;
  color: #065f46;
}

.stat-icon-yellow {
  background-color: #fef3c7;
  color: #92400e;
}

.stat-icon-purple {
  background-color: #e9d5ff;
  color: #7c2d12;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.stat-description {
  font-size: 0.75rem;
  color: #9ca3af;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.dashboard-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0;
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.card-link {
  font-size: 0.875rem;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.card-link:hover {
  color: #2563eb;
}

.card-content {
  padding: 0 1.5rem 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.certificate-list,
.user-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.certificate-item,
.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease-in-out;
}

.certificate-item:hover,
.user-item:hover {
  background-color: #f9fafb;
}

.certificate-info,
.user-info {
  flex: 1;
}

.certificate-type,
.user-name {
  font-weight: 500;
  color: #111827;
  margin-bottom: 0.25rem;
}

.certificate-user,
.user-details {
  font-size: 0.875rem;
  color: #6b7280;
}

.certificate-status,
.user-role {
  flex-shrink: 0;
}
</style>
