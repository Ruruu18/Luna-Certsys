<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <img src="@/assets/logo.png" alt="Luna Certsys" class="login-logo" />
        <h1 class="login-title">Luna Certsys</h1>
        <p class="login-subtitle">Sign in to access the admin panel</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>

        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            placeholder="admin@example.com"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-input"
            placeholder="Enter your password"
            required
            :disabled="loading"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary login-button"
          :disabled="loading"
        >
          <div v-if="loading" class="spinner"></div>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="login-footer">
        <p class="text-sm text-gray-600">
          Admin access only. Contact your system administrator if you need access.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields'
    return
  }

  loading.value = true
  error.value = ''

  try {
    console.log('Attempting login for:', email.value)
    const { data, error: loginError } = await authStore.signIn(email.value, password.value)

    if (loginError) {
      console.error('Login error:', loginError)
      error.value = loginError.message || 'Invalid credentials'
    } else if (data?.user) {
      console.log('Login successful, waiting for profile to load...')

      // Wait for user profile to load (simplified approach)
      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log('Auth store state after login:', {
        user: authStore.user,
        isAuthenticated: authStore.isAuthenticated,
        isAdmin: authStore.isAdmin
      })

      // Check if user profile loaded and is admin
      if (authStore.user && authStore.user.role === 'admin') {
        console.log('Admin login successful, redirecting...')
        router.push({ name: 'admin-dashboard' })
      } else if (authStore.user && authStore.user.role !== 'admin') {
        error.value = 'Admin access required. Your role: ' + authStore.user.role
        await authStore.signOut()
      } else {
        error.value = 'Failed to load user profile. Please try again.'
        await authStore.signOut()
      }
    } else {
      error.value = 'Login failed - no user data received'
    }
  } catch (err: any) {
    console.error('Login exception:', err)
    error.value = 'An unexpected error occurred: ' + (err.message || err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 400px;
  padding: 2rem;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.login-logo {
  width: min(70vw, 300px);
  height: min(45vw, 180px);
  min-width: 240px;
  min-height: 120px;
  object-fit: contain;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
}

.text-sm {
  font-size: 0.875rem;
}

.text-gray-600 {
  color: #6b7280;
}
</style>
