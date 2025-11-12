<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-container">
          <img src="@/assets/logo.png" alt="Luna Certsys" class="sidebar-logo" />
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link
          to="/admin/dashboard"
          class="nav-item"
          :class="{ 'nav-item-active': $route.name === 'admin-dashboard' }"
        >
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
          </svg>
          Dashboard
        </router-link>

        <router-link
          to="/admin/users"
          class="nav-item"
          :class="{ 'nav-item-active': $route.name === 'admin-users' }"
        >
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          User Management
        </router-link>

        <router-link
          to="/admin/certificates"
          class="nav-item"
          :class="{ 'nav-item-active': $route.name === 'admin-certificates' || $route.name === 'admin-certificate-requests' }"
        >
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div class="nav-item-content">
            <span class="nav-item-title">Certificates</span>
            <span class="nav-item-subtitle">All certificate requests</span>
          </div>
        </router-link>

        <router-link
          to="/admin/payments"
          class="nav-item"
          :class="{ 'nav-item-active': $route.name === 'admin-payments' }"
        >
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Payment Management
        </router-link>

        <router-link
          to="/admin/reports"
          class="nav-item"
          :class="{ 'nav-item-active': $route.name === 'admin-reports' }"
        >
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Reports & Analytics
        </router-link>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Header -->
      <header class="main-header">
        <div class="header-left">
          <div class="datetime-display">
            <div class="current-time">{{ currentTime }}</div>
            <div class="current-date">{{ currentDate }}</div>
          </div>
        </div>

        <div class="header-right">
          <!-- Notification Bell -->
          <NotificationBell />

          <div class="user-menu">
            <button @click="showUserMenu = !showUserMenu" class="user-button">
              <span class="user-name">{{ authStore.user?.full_name || 'Admin' }}</span>
              <svg class="user-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div v-show="showUserMenu" class="user-dropdown">
              <button @click="handleLogout" class="dropdown-item">
                <svg class="dropdown-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="page-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUsersStore } from '../stores/users'
import { useCertificatesStore } from '../stores/certificates'
import { useCertificateRequestsStore } from '../stores/certificateRequests'
import NotificationBell from '../components/NotificationBell.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const usersStore = useUsersStore()
const certificatesStore = useCertificatesStore()
const requestsStore = useCertificateRequestsStore()

const showUserMenu = ref(false)
const currentTime = ref('')
const currentDate = ref('')
let timeInterval: ReturnType<typeof setInterval> | null = null

const updateDateTime = () => {
  const now = new Date()

  // Format time in Philippine timezone (12-hour format with AM/PM)
  currentTime.value = now.toLocaleTimeString('en-PH', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })

  // Format date in Philippine timezone
  currentDate.value = now.toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const handleLogout = async () => {
  await authStore.signOut()
  router.push({ name: 'login' })
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu')) {
    showUserMenu.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)

  // ✅ Start updating time and date
  updateDateTime()
  timeInterval = setInterval(updateDateTime, 1000) // Update every second

  // ✅ FETCH ALL DATA SEQUENTIALLY (one at a time to avoid overwhelming sleeping Supabase)
  console.log('🚀 Loading all data for admin panel (sequential to handle cold starts)...')
  const start = performance.now()

  try {
    // Fetch users first (simplest query, wakes up database)
    console.log('1️⃣ Fetching users...')
    await usersStore.fetchUsers()
    console.log('✅ Users loaded')

    // Then certificates (with foreign key join)
    console.log('2️⃣ Fetching certificates...')
    await certificatesStore.fetchCertificates()
    console.log('✅ Certificates loaded')

    // Finally requests (with foreign key join)
    console.log('3️⃣ Fetching certificate requests...')
    await requestsStore.fetchRequests()
    console.log('✅ Certificate requests loaded')

    const end = performance.now()
    console.log(`✅ All data loaded in ${((end - start) / 1000).toFixed(2)}s`)
  } catch (error) {
    console.error('❌ Error loading admin data:', error)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: var(--gray-100);
}

.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  color: #1e293b;
  flex-shrink: 0;
  height: 100vh;
  overflow-y: auto;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
  border-right: 1px solid #e8edf2;
}

.sidebar-header {
  padding: 1.75rem 1.5rem 1.5rem;
  border-bottom: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 0;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  position: relative;
  box-shadow: 0 4px 20px rgba(30, 64, 175, 0.2);
}

.logo-container {
  width: 220px;
  height: 140px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.sidebar-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  filter: brightness(1.15) drop-shadow(0 4px 16px rgba(0, 0, 0, 0.25));
  transform: scale(2.5);
}

.sidebar-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.03em;
  text-align: center;
  text-transform: none;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
  font-family: 'Poppins', sans-serif;
  line-height: 1.2;
}

.sidebar-nav {
  padding: 1.5rem 1rem 1.5rem;
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.03) 0%, transparent 100%);
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.9375rem 1.125rem;
  margin: 0.25rem 0;
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9375rem;
  border-radius: 0.875rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 1px solid transparent;
}

.nav-item-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.nav-item-title {
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.2;
}

.nav-item-subtitle {
  font-size: 0.6875rem;
  opacity: 0.75;
  font-weight: 400;
  line-height: 1;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 0;
  width: 4px;
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 0 4px 4px 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
}

.nav-item:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #334155;
  transform: translateX(3px);
  border-color: #e2e8f0;
}

.nav-item:hover::before {
  height: 65%;
  opacity: 0.8;
}

.nav-item-active {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12), 0 1px 3px rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.2);
}

.nav-item-active::before {
  height: 75%;
  opacity: 1;
  width: 4px;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
}

.nav-icon {
  width: 1.375rem;
  height: 1.375rem;
  margin-right: 0.9375rem;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  stroke-width: 2;
}

.nav-item:hover .nav-icon {
  transform: scale(1.12) translateX(2px);
  stroke-width: 2.25;
}

.nav-item-active .nav-icon {
  transform: scale(1.08);
  stroke-width: 2.5;
  filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.2));
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.main-header {
  background-color: white;
  border-bottom: 1px solid var(--gray-200);
  padding: 1.25rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-sm);
  position: relative;
  z-index: 5;
}

.header-left {
  flex: 1;
}

.datetime-display {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.current-time {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e40af;
  letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums;
}

.current-date {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  letter-spacing: 0.01em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-menu {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1.125rem;
  background-color: var(--gray-50);
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius-lg);
  color: var(--gray-700);
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.user-button:hover {
  background-color: white;
  border-color: var(--primary-300);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.user-name {
  font-size: 0.875rem;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-chevron {
  width: 1.125rem;
  height: 1.125rem;
  transition: transform var(--transition-base);
  color: var(--gray-500);
}

.user-button:hover .user-chevron {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background-color: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: 50;
  min-width: 200px;
  overflow: hidden;
  animation: dropdownSlide var(--transition-base);
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1.125rem;
  text-align: left;
  color: var(--gray-700);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.dropdown-item:hover {
  background-color: var(--danger-50);
  color: var(--danger-700);
}

.dropdown-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.page-content {
  flex: 1;
  padding: 2.5rem;
  overflow-y: auto;
  background-color: #f5f5f5;
  height: calc(100vh - 80px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }

  .page-content {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -280px;
    transition: left var(--transition-base);
    z-index: 100;
  }

  .sidebar.mobile-open {
    left: 0;
  }

  .main-header {
    padding: 1rem 1.5rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-content {
    padding: 1rem;
  }
}
</style>
