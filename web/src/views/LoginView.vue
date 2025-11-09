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
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: float 20s ease-in-out infinite;
}

.login-container::after {
  content: '';
  position: absolute;
  bottom: -50%;
  left: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
  animation: float 15s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(50px, 50px);
  }
}

.login-card {
  background: white;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  width: 100%;
  max-width: 440px;
  padding: 2.5rem;
  position: relative;
  z-index: 1;
  animation: slideUp var(--transition-slow);
  backdrop-filter: blur(10px);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.login-logo {
  width: min(70vw, 280px);
  height: min(45vw, 160px);
  min-width: 200px;
  min-height: 100px;
  object-fit: contain;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1));
  animation: logoFloat 3s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.login-title {
  font-size: 2.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;
}

.login-subtitle {
  color: var(--gray-600);
  font-size: 0.9375rem;
  font-weight: 500;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.login-button {
  width: 100%;
  padding: 0.875rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all var(--transition-base);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-footer {
  margin-top: 2.5rem;
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid var(--gray-200);
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.5;
}

.text-gray-600 {
  color: var(--gray-600);
}

/* Enhanced Form Inputs for Login */
.login-form .form-input {
  padding: 0.875rem 1rem;
  font-size: 0.9375rem;
  background-color: var(--gray-50);
  border: 2px solid var(--gray-200);
  transition: all var(--transition-base);
}

.login-form .form-input:focus {
  background-color: white;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

/* Responsive */
@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
  }

  .login-title {
    font-size: 1.875rem;
  }

  .login-logo {
    width: min(80vw, 240px);
    height: min(50vw, 140px);
  }
}
</style>
