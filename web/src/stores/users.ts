import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getAllUsers,
  createUser,
  updateUserProfile,
  deleteUser,
  type User
} from '../lib/supabase'

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetch = ref<number>(0)
  const CACHE_TIME = 5000 // 5 seconds cache
  let fetchTimeout: NodeJS.Timeout | null = null

  const fetchUsers = async (forceRefresh = false) => {
    // Clear any existing timeout first
    if (fetchTimeout) {
      clearTimeout(fetchTimeout)
      fetchTimeout = null
    }

    // If loading for more than 10s, force clear (stuck state recovery)
    if (loading.value && lastFetch.value > 0 && (Date.now() - lastFetch.value) > 10000) {
      console.warn('🔧 Forcing clear of stuck loading state (>10s old)')
      loading.value = false
      error.value = null
    }

    // Prevent multiple simultaneous fetches - just skip!
    if (loading.value) {
      console.log('⏳ Already fetching users, skipping duplicate request')
      return
    }

    // Prevent duplicate fetches within 5 seconds (only if we have data)
    const now = Date.now()
    if (!forceRefresh && users.value.length > 0 && (now - lastFetch.value) < CACHE_TIME) {
      console.log('⚡ Using cached users data (' + users.value.length + ' users)')
      return
    }

    loading.value = true
    error.value = null
    lastFetch.value = Date.now() // Mark fetch start time

    // ✅ Safety timeout - 30 seconds for cold starts (Supabase free tier wakeup)
    fetchTimeout = setTimeout(() => {
      if (loading.value) {
        console.error('❌ [USERS] Timeout after 30s - database may be sleeping or connection issue')
        loading.value = false
        error.value = 'Database timeout (30s). Your Supabase project may be sleeping. Please refresh the page.'
        fetchTimeout = null
      }
    }, 30000) // 30s for cold starts

    try {
      console.log('📡 Fetching users...')
      const startTime = Date.now()

      const { data, error: fetchError } = await getAllUsers()

      const endTime = Date.now()
      console.log(`⏱️ Fetch completed in ${endTime - startTime}ms`)

      if (fetchError) {
        console.error('❌ Supabase error:', fetchError)
        console.error('Error details:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        })

        // Provide helpful error messages based on error type
        if (fetchError.message?.includes('RLS')) {
          error.value = 'Permission denied. Please make sure you are logged in as an admin.'
        } else if (fetchError.message?.includes('JWT')) {
          error.value = 'Session expired. Please log out and log back in.'
        } else if (fetchError.message?.includes('network')) {
          error.value = 'Network error. Please check your internet connection.'
        } else {
          error.value = fetchError.message || 'Failed to fetch users'
        }

        throw fetchError
      }

      console.log('✅ Fetched users:', data?.length || 0)
      users.value = data || []
      lastFetch.value = Date.now()
      error.value = null // Clear any previous errors on success
    } catch (err: any) {
      // Only set error if it wasn't already set above
      if (!error.value) {
        error.value = err.message || 'Failed to fetch users'
      }
      console.error('❌ Error fetching users:', err)
    } finally {
      if (fetchTimeout) {
        clearTimeout(fetchTimeout)
        fetchTimeout = null
      }
      loading.value = false
    }
  }

  const addUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>, password?: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError, password: generatedPassword } = await createUser(userData, password)
      if (createError) throw createError

      if (data) {
        users.value.unshift(data)
      }

      return {
        success: true,
        password: generatedPassword, // Return password so admin can provide it to user
        userId: (data as any)?.id // Return user ID for photo upload
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to create user'
      console.error('Error creating user:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (userId: string, updates: Partial<User>) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await updateUserProfile(userId, updates)
      if (updateError) throw updateError

      if (data) {
        const index = users.value.findIndex(u => u.id === userId)
        if (index !== -1) {
          users.value[index] = data
        }
      }

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Failed to update user'
      console.error('Error updating user:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const removeUser = async (userId: string) => {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await deleteUser(userId)
      if (deleteError) throw deleteError

      users.value = users.value.filter(u => u.id !== userId)
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Failed to delete user'
      console.error('Error deleting user:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
    updateUser,
    removeUser,
  }
})
