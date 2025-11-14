import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/admin'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: '',
          name: 'admin-home',
          redirect: '/admin/dashboard'
        },
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('../views/DashboardView.vue')
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('../views/UsersView.vue')
        },
        {
          path: 'certificates',
          name: 'admin-certificates',
          component: () => import('../views/CertificatesView.vue')
        },
        {
          path: 'certificate-requests',
          name: 'admin-certificate-requests',
          component: () => import('../views/CertificateRequestsView.vue')
        },
        {
          path: 'payments',
          name: 'admin-payments',
          component: () => import('../views/PaymentsView.vue')
        },
        {
          path: 'reports',
          name: 'admin-reports',
          component: () => import('../views/ReportsView.vue')
        },
        {
          path: 'notifications',
          name: 'admin-notifications',
          component: () => import('../views/NotificationsView.vue')
        }
      ]
    }
  ],
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait for auth initialization if still loading
  if (authStore.loading) {
    // Wait for the auth store to finish loading
    let attempts = 0
    const maxAttempts = 50 // 5 seconds max wait

    while (authStore.loading && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
    return
  }

  // Check if route requires admin access
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'login' })
    return
  }

  // Check if route requires guest (not authenticated)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'admin-dashboard' })
    return
  }

  next()
})

export default router
