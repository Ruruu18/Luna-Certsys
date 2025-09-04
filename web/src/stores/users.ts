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

  const fetchUsers = async () => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await getAllUsers()
      if (fetchError) throw fetchError
      users.value = data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch users'
      console.error('Error fetching users:', err)
    } finally {
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
        password: generatedPassword // Return password so admin can provide it to user
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
