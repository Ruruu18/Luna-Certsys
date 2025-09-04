<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <img src="@/assets/logo.png" alt="Luna Certsys" class="sidebar-logo" />
        <h2 class="sidebar-title">Luna Certsys</h2>
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
          :class="{ 'nav-item-active': $route.name === 'admin-certificates' }"
        >
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Certificates
        </router-link>

        <router-link
          to="/admin/certificate-requests"
          class="nav-item"
          :class="{ 'nav-item-active': $route.name === 'admin-certificate-requests' }"
        >
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          Certificate Requests
        </router-link>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Header -->
      <header class="main-header">
        <div class="header-left">
          <h1 class="page-title">{{ getPageTitle() }}</h1>
        </div>

        <div class="header-right">
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

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const showUserMenu = ref(false)

const getPageTitle = () => {
  const titles: Record<string, string> = {
    'admin-dashboard': 'Dashboard',
    'admin-users': 'User Management',
    'admin-certificates': 'Certificate Management',
    'admin-certificate-requests': 'Certificate Requests'
  }
  return titles[route.name as string] || 'Admin Panel'
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

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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
}

.sidebar {
  width: 280px;
  background-color: #1f2937;
  color: white;
  flex-shrink: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #374151;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.sidebar-logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.sidebar-nav {
  padding: 1rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: #d1d5db;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
}

.nav-item:hover {
  background-color: #374151;
  color: white;
}

.nav-item-active {
  background-color: #3b82f6;
  color: white;
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.75rem;
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
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-menu {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.user-button:hover {
  background-color: #f3f4f6;
}

.user-name {
  font-size: 0.875rem;
}

.user-chevron {
  width: 1rem;
  height: 1rem;
  transition: transform 0.2s ease-in-out;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.25rem;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 50;
  min-width: 160px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  color: #374151;
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.dropdown-item:hover {
  background-color: #f9fafb;
}

.dropdown-icon {
  width: 1rem;
  height: 1rem;
}

.page-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background-color: #f8fafc;
  height: calc(100vh - 80px);
}
</style>
