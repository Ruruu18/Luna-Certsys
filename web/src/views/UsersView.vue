<template>
  <div class="users-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-left">
        <h2 class="view-title">User Management</h2>
        <p class="view-description">Manage system users and their roles</p>
      </div>
      <div class="header-right">
        <button @click="showAddModal = true" class="btn btn-primary">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add User
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="table-container">
      <div v-if="usersStore.loading" class="loading">
        <div class="spinner"></div>
        <p>Loading users...</p>
      </div>

      <div v-else-if="usersStore.error" class="alert alert-error">
        {{ usersStore.error }}
      </div>

      <div v-else-if="usersStore.users.length === 0" class="empty-state">
        <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
        <h3>No users found</h3>
        <p>Get started by adding your first user</p>
        <button @click="showAddModal = true" class="btn btn-primary">Add User</button>
      </div>

      <table v-else class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Purok</th>
            <th>Phone</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in usersStore.users" :key="user.id">
            <td>
              <div class="user-cell">
                <div class="user-avatar">
                  {{ user.full_name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="user-name">{{ user.full_name }}</div>
                </div>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
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
            </td>
            <td>{{ user.purok || '-' }}</td>
            <td>{{ user.phone_number || '-' }}</td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  @click="editUser(user)"
                  class="btn btn-outline btn-sm"
                  title="Edit user"
                >
                  <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="confirmDeleteUser(user)"
                  class="btn btn-danger btn-sm"
                  title="Delete user"
                  :disabled="user.role === 'admin'"
                >
                  <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit User Modal -->
    <div v-if="showAddModal || showEditModal" class="modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ showEditModal ? 'Edit User' : 'Add New User' }}</h3>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div v-if="formError" class="alert alert-error">
              {{ formError }}
            </div>

            <div class="form-group">
              <label for="full_name" class="form-label">Full Name</label>
              <input
                id="full_name"
                v-model="formData.full_name"
                type="text"
                class="form-input"
                required
                :disabled="formLoading"
              />
            </div>

            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                class="form-input"
                required
                :disabled="formLoading || showEditModal"
              />
            </div>

            <div class="form-group">
              <label for="role" class="form-label">Role</label>
              <select
                id="role"
                v-model="formData.role"
                class="form-select"
                required
                :disabled="formLoading"
              >
                <option value="resident">Resident</option>
                <option value="purok_chairman">Purok Chairman</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div class="form-group">
              <label for="purok" class="form-label">Purok</label>
              <input
                id="purok"
                v-model="formData.purok"
                type="text"
                class="form-input"
                placeholder="e.g., 1, 2, 3..."
                :disabled="formLoading"
              />
            </div>

            <div class="form-group">
              <label for="phone_number" class="form-label">Phone Number</label>
              <input
                id="phone_number"
                v-model="formData.phone_number"
                type="tel"
                class="form-input"
                :disabled="formLoading"
              />
            </div>

            <div class="form-group">
              <label for="address" class="form-label">Address</label>
              <textarea
                id="address"
                v-model="formData.address"
                class="form-input"
                rows="3"
                :disabled="formLoading"
              ></textarea>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button
            @click="closeModal"
            type="button"
            class="btn btn-outline"
            :disabled="formLoading"
          >
            Cancel
          </button>
          <button
            @click="handleSubmit"
            type="submit"
            class="btn btn-primary"
            :disabled="formLoading"
          >
            <div v-if="formLoading" class="spinner"></div>
            {{ showEditModal ? 'Update' : 'Create' }} User
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal" @click="showDeleteModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Confirm Deletion</h3>
        </div>

        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ userToDelete?.full_name }}</strong>?</p>
          <p class="text-sm text-gray-600">This action cannot be undone.</p>
        </div>

        <div class="modal-footer">
          <button
            @click="showDeleteModal = false"
            type="button"
            class="btn btn-outline"
            :disabled="formLoading"
          >
            Cancel
          </button>
          <button
            @click="handleDeleteUser"
            type="button"
            class="btn btn-danger"
            :disabled="formLoading"
          >
            <div v-if="formLoading" class="spinner"></div>
            Delete User
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUsersStore } from '../stores/users'
import type { User } from '../lib/supabase'

const usersStore = useUsersStore()

const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const formLoading = ref(false)
const formError = ref('')
const userToDelete = ref<User | null>(null)
const editingUser = ref<User | null>(null)

const formData = ref({
  full_name: '',
  email: '',
  role: 'resident' as 'admin' | 'purok_chairman' | 'resident',
  purok: '',
  phone_number: '',
  address: ''
})

const resetForm = () => {
  formData.value = {
    full_name: '',
    email: '',
    role: 'resident',
    purok: '',
    phone_number: '',
    address: ''
  }
  formError.value = ''
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  editingUser.value = null
  resetForm()
}

const editUser = (user: User) => {
  editingUser.value = user
  formData.value = {
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    purok: user.purok || '',
    phone_number: user.phone_number || '',
    address: user.address || ''
  }
  showEditModal.value = true
}

const confirmDeleteUser = (user: User) => {
  userToDelete.value = user
  showDeleteModal.value = true
}

const handleSubmit = async () => {
  formLoading.value = true
  formError.value = ''

  try {
    if (showEditModal.value && editingUser.value) {
      const { success, error } = await usersStore.updateUser(editingUser.value.id, formData.value)
      if (!success) {
        formError.value = error || 'Failed to update user'
        return
      }
    } else {
      const { success, error, password } = await usersStore.addUser(formData.value)
      if (!success) {
        formError.value = error || 'Failed to create user'
        return
      }

      // Show success message with generated password
      if (password) {
        alert(`User created successfully!\n\nLogin Credentials:\nEmail: ${formData.value.email}\nPassword: ${password}\n\nPlease provide these credentials to the user.`)
      }
    }

    closeModal()
  } catch (error) {
    formError.value = 'An unexpected error occurred'
    console.error('Error submitting form:', error)
  } finally {
    formLoading.value = false
  }
}

const handleDeleteUser = async () => {
  if (!userToDelete.value) return

  formLoading.value = true

  try {
    const { success } = await usersStore.removeUser(userToDelete.value.id)
    if (success) {
      showDeleteModal.value = false
      userToDelete.value = null
    }
  } catch (error) {
    console.error('Error deleting user:', error)
  } finally {
    formLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  usersStore.fetchUsers()
})
</script>

<style scoped>
.users-view {
  space-y: 1.5rem;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.header-left {
  flex: 1;
}

.view-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.view-description {
  color: #6b7280;
}

.header-right {
  display: flex;
  gap: 0.75rem;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.table-container {
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: #d1d5db;
  margin: 0 auto 1rem;
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.user-name {
  font-weight: 500;
  color: #111827;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.text-sm {
  font-size: 0.875rem;
}

.text-gray-600 {
  color: #6b7280;
}
</style>
