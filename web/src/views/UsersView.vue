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

    <!-- Search and Filter -->
    <div class="search-filter-section">
      <div class="search-box">
        <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search users by name, email, phone..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button
        v-for="filter in roleFilters"
        :key="filter.value"
        @click="activeFilter = filter.value"
        class="filter-tab"
        :class="{ 'filter-tab-active': activeFilter === filter.value }"
      >
        {{ filter.label }}
        <span v-if="filter.count !== undefined" class="filter-count">{{ filter.count }}</span>
      </button>
    </div>

    <!-- Users Table -->
    <div class="table-container">
      <div v-if="usersStore.error" class="alert alert-error">
        {{ usersStore.error }}
      </div>

      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
        <h3>No users found</h3>
        <p>{{ searchQuery ? 'No users match your search' : 'Get started by adding your first user' }}</p>
        <button v-if="!searchQuery" @click="showAddModal = true" class="btn btn-primary">Add User</button>
      </div>

      <table v-else class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Verification</th>
            <th>Purok</th>
            <th>Phone</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
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
            <td>
              <span
                v-if="user.face_verified"
                class="verification-badge verified"
                title="Face verified"
              >
                <svg class="badge-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Verified
              </span>
              <span
                v-else
                class="verification-badge unverified"
                title="Not verified"
              >
                <svg class="badge-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Not Verified
              </span>
            </td>
            <td>{{ user.purok || '-' }}</td>
            <td>{{ user.phone_number || '-' }}</td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  @click="viewUserDetails(user)"
                  class="btn btn-info btn-sm btn-with-text"
                  title="View details"
                >
                  <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span class="btn-text">View</span>
                </button>
                <button
                  @click="editUser(user)"
                  class="btn btn-outline btn-sm btn-with-text"
                  title="Edit user"
                >
                  <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span class="btn-text">Edit</span>
                </button>
                <button
                  @click="confirmDeleteUser(user)"
                  class="btn btn-danger btn-sm btn-with-text"
                  title="Delete user"
                >
                  <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span class="btn-text">Delete</span>
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
              </select>
            </div>

            <!-- Photo Upload for Purok Chairman -->
            <div v-if="formData.role === 'purok_chairman'" class="form-group">
              <label class="form-label">
                Chairman Photo
                <span v-if="!showEditModal" class="text-danger">*</span>
                <span v-else class="text-muted">(Optional - update only if needed)</span>
              </label>
              <div class="photo-upload-container">
                <div v-if="photoPreview || (showEditModal && editingUser?.photo_url && !photoRemoved)" class="photo-preview">
                  <img :src="photoPreview || editingUser?.photo_url" alt="Chairman photo" />
                  <button
                    type="button"
                    @click="removePhoto"
                    class="photo-remove-btn"
                    :disabled="formLoading"
                    :title="showEditModal ? 'Change photo' : 'Remove photo'"
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div v-else class="photo-upload-box">
                  <input
                    type="file"
                    ref="photoInput"
                    @change="handlePhotoSelect"
                    accept="image/*"
                    class="photo-input"
                    :disabled="formLoading"
                  />
                  <div class="upload-placeholder">
                    <svg class="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p class="upload-text">{{ showEditModal ? 'Change photo' : 'Upload photo' }}</p>
                    <p class="upload-hint">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              </div>
              <small class="form-help" :class="showEditModal ? 'text-muted' : 'text-warning'">
                {{ showEditModal ? 'Upload new photo to update the chairman\'s profile picture' : 'Required for Purok Chairman to prevent fake profiles' }}
              </small>
            </div>

            <div class="form-group">
              <label for="purok" class="form-label">Purok</label>
              <input
                id="purok"
                v-model="formData.purok"
                type="text"
                class="form-input"
                placeholder="e.g., Purok 1, Purok 2, etc."
                :disabled="formLoading"
              />
            </div>

            <!-- Purok Chairman selector (only for residents) -->
            <div v-if="formData.role === 'resident'" class="form-group">
              <label for="purok_chairman" class="form-label">
                Purok Chairman
                <span class="text-muted">(Optional)</span>
              </label>
              <select
                id="purok_chairman"
                v-model="formData.purok_chairman_id"
                class="form-select"
                :disabled="formLoading"
              >
                <option value="">-- Select Chairman --</option>
                <option
                  v-for="chairman in purokChairmen"
                  :key="chairman.id"
                  :value="chairman.id"
                >
                  {{ chairman.full_name }} ({{ chairman.purok || 'No Purok' }})
                </option>
              </select>
              <small class="form-help">Assign this resident to their purok chairman</small>
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

            <!-- Personal Information Section -->
            <div class="section-divider">
              <h4 class="section-title">Personal Information</h4>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="date_of_birth" class="form-label">Date of Birth</label>
                <input
                  id="date_of_birth"
                  v-model="formData.date_of_birth"
                  type="date"
                  class="form-input"
                  :disabled="formLoading"
                  @change="autoCalculateAge"
                />
              </div>

              <div class="form-group">
                <label for="place_of_birth" class="form-label">Place of Birth</label>
                <input
                  id="place_of_birth"
                  v-model="formData.place_of_birth"
                  type="text"
                  class="form-input"
                  placeholder="e.g., Surigao del Norte"
                  :disabled="formLoading"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="gender" class="form-label">Gender</label>
                <select
                  id="gender"
                  v-model="formData.gender"
                  class="form-select"
                  :disabled="formLoading"
                >
                  <option value="">-- Select Gender --</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div class="form-group">
                <label for="civil_status" class="form-label">Civil Status</label>
                <select
                  id="civil_status"
                  v-model="formData.civil_status"
                  class="form-select"
                  :disabled="formLoading"
                >
                  <option value="">-- Select Status --</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="age" class="form-label">Age <span class="text-muted">(Auto-calculated)</span></label>
                <input
                  id="age"
                  v-model="formData.age"
                  type="number"
                  class="form-input"
                  placeholder="Auto-calculated from birthday"
                  readonly
                  disabled
                  style="background-color: #f3f4f6; cursor: not-allowed;"
                />
              </div>

              <div class="form-group">
                <label for="nationality" class="form-label">Nationality</label>
                <input
                  id="nationality"
                  v-model="formData.nationality"
                  type="text"
                  class="form-input"
                  placeholder="e.g., Filipino"
                  :disabled="formLoading"
                />
              </div>
            </div>

            <div v-if="!showEditModal" class="form-group">
              <label for="password" class="form-label">Password</label>
              <input
                id="password"
                v-model="formData.password"
                type="password"
                class="form-input"
                placeholder="Leave empty for auto-generated password"
                :disabled="formLoading"
              />
              <small class="form-help">If left empty, a secure password will be generated automatically</small>
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

    <!-- User Details Modal -->
    <div v-if="showDetailsModal" class="modal" @click="showDetailsModal = false">
      <div class="modal-content modal-large" @click.stop>
        <div class="modal-header modal-header-with-close">
          <h3 class="modal-title">User Details</h3>
          <button @click="showDetailsModal = false" class="modal-close-button">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="modal-body" v-if="selectedUser">
          <div class="details-container">
            <!-- User Photo and Verification Status -->
            <div class="details-header">
              <div class="user-photo-section">
                <div v-if="selectedUser.photo_url" class="user-photo-large">
                  <img :src="selectedUser.photo_url" :alt="selectedUser.full_name" />
                </div>
                <div v-else class="user-photo-large user-photo-placeholder">
                  <span>{{ selectedUser.full_name.charAt(0).toUpperCase() }}</span>
                </div>
                <div class="verification-badges">
                  <span v-if="selectedUser.face_verified" class="badge badge-success">
                    <svg class="badge-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Face Verified
                  </span>
                  <span v-else class="badge badge-warning">Not Verified</span>
                </div>
              </div>
              <div class="user-summary">
                <h2>{{ selectedUser.full_name }}</h2>
                <p class="user-email">{{ selectedUser.email }}</p>
                <span
                  class="badge badge-large"
                  :class="{
                    'badge-danger': selectedUser.role === 'admin',
                    'badge-warning': selectedUser.role === 'purok_chairman',
                    'badge-info': selectedUser.role === 'resident'
                  }"
                >
                  {{ selectedUser.role.replace('_', ' ') }}
                </span>
              </div>
            </div>

            <!-- Personal Information -->
            <div class="details-section">
              <h4 class="section-title">Personal Information</h4>
              <div class="details-grid">
                <div class="detail-item">
                  <label>Date of Birth</label>
                  <p>{{ selectedUser.date_of_birth ? formatDate(selectedUser.date_of_birth) : '-' }}</p>
                </div>
                <div class="detail-item">
                  <label>Place of Birth</label>
                  <p>{{ selectedUser.place_of_birth || '-' }}</p>
                </div>
                <div class="detail-item">
                  <label>Gender</label>
                  <p>{{ selectedUser.gender || '-' }}</p>
                </div>
                <div class="detail-item">
                  <label>Civil Status</label>
                  <p>{{ selectedUser.civil_status || '-' }}</p>
                </div>
                <div class="detail-item">
                  <label>Age</label>
                  <p>{{ getDisplayAge(selectedUser) }}</p>
                </div>
                <div class="detail-item">
                  <label>Nationality</label>
                  <p>{{ selectedUser.nationality || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Contact Information -->
            <div class="details-section">
              <h4 class="section-title">Contact Information</h4>
              <div class="details-grid">
                <div class="detail-item detail-item-full">
                  <label>Address</label>
                  <p>{{ selectedUser.address || '-' }}</p>
                </div>
                <div class="detail-item">
                  <label>Phone Number</label>
                  <p>{{ selectedUser.phone_number || '-' }}</p>
                </div>
                <div class="detail-item">
                  <label>Purok</label>
                  <p>{{ selectedUser.purok || '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Account Information -->
            <div class="details-section">
              <h4 class="section-title">Account Information</h4>
              <div class="details-grid">
                <div class="detail-item">
                  <label>Account Created</label>
                  <p>{{ formatDateTime(selectedUser.created_at) }}</p>
                </div>
                <div class="detail-item">
                  <label>Last Updated</label>
                  <p>{{ formatDateTime(selectedUser.updated_at) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            @click="showDetailsModal = false"
            type="button"
            class="btn btn-outline"
          >
            Close
          </button>
          <button
            @click="selectedUser && editUser(selectedUser)"
            type="button"
            class="btn btn-primary"
            :disabled="!selectedUser"
          >
            <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit User
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useUsersStore } from '../stores/users'
import { supabase, type User } from '../lib/supabase'

const usersStore = useUsersStore()

// Filter out admin users from the display
const nonAdminUsers = computed(() => {
  return usersStore.users.filter(user => user.role !== 'admin')
})

const searchQuery = ref('')
const activeFilter = ref('all')

// Role filters with counts
const roleFilters = computed(() => [
  {
    label: 'All Users',
    value: 'all',
    count: nonAdminUsers.value.length
  },
  {
    label: 'Residents',
    value: 'resident',
    count: nonAdminUsers.value.filter(u => u.role === 'resident').length
  },
  {
    label: 'Purok Chairmen',
    value: 'purok_chairman',
    count: nonAdminUsers.value.filter(u => u.role === 'purok_chairman').length
  }
])

// Filtered and searched users
const filteredUsers = computed(() => {
  let users = nonAdminUsers.value

  // Apply role filter
  if (activeFilter.value !== 'all') {
    users = users.filter(u => u.role === activeFilter.value)
  }

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    users = users.filter(u =>
      u.full_name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.phone_number?.toLowerCase().includes(query) ||
      u.purok?.toLowerCase().includes(query)
    )
  }

  return users
})

const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showDetailsModal = ref(false)
const formLoading = ref(false)
const formError = ref('')
const userToDelete = ref<User | null>(null)
const editingUser = ref<User | null>(null)
const selectedUser = ref<User | null>(null)
const photoInput = ref<HTMLInputElement | null>(null)
const photoFile = ref<File | null>(null)
const photoPreview = ref<string>('')
const photoRemoved = ref(false) // Track if user explicitly removed photo in edit mode

const formData = ref({
  first_name: '',
  last_name: '',
  middle_name: '',
  suffix: '',
  full_name: '',
  email: '',
  role: 'resident' as 'admin' | 'purok_chairman' | 'resident',
  purok: '',
  purok_chairman_id: '', // Link to chairman
  phone_number: '',
  address: '',
  // Personal information
  date_of_birth: '',
  place_of_birth: '',
  gender: '' as 'Male' | 'Female' | 'Other' | '',
  civil_status: '' as 'Single' | 'Married' | 'Widowed' | 'Divorced' | 'Separated' | '',
  age: '',
  nationality: 'Filipino',
  password: '',
  face_verified: false,
  photo_url: '',
  face_verified_at: ''
})

// List of purok chairmen for selection
const purokChairmen = ref<User[]>([])

const resetForm = () => {
  formData.value = {
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    full_name: '',
    email: '',
    role: 'resident' as 'admin' | 'purok_chairman' | 'resident',
    purok: '',
    purok_chairman_id: '',
    phone_number: '',
    address: '',
    // Personal information
    date_of_birth: '',
    place_of_birth: '',
    gender: '' as 'Male' | 'Female' | 'Other' | '',
    civil_status: '' as 'Single' | 'Married' | 'Widowed' | 'Divorced' | 'Separated' | '',
    age: '',
    nationality: 'Filipino',
    password: '',
    face_verified: false,
    photo_url: '',
    face_verified_at: ''
  }
  formError.value = ''
  photoFile.value = null
  photoPreview.value = ''
  photoRemoved.value = false
  if (photoInput.value) {
    photoInput.value.value = ''
  }
}

// Load purok chairmen for selection dropdown
const loadPurokChairmen = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, purok')
      .eq('role', 'purok_chairman')
      .order('purok')

    if (error) throw error
    purokChairmen.value = data || []
    console.log('Loaded', purokChairmen.value.length, 'purok chairmen')
  } catch (error) {
    console.error('Error loading chairmen:', error)
  }
}

// Load chairmen when component mounts
loadPurokChairmen()

// Photo handling functions
const handlePhotoSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    formError.value = 'Please select an image file'
    return
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    formError.value = 'Image size must be less than 5MB'
    return
  }

  photoFile.value = file
  photoRemoved.value = false // Reset removed flag when new photo is selected

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    photoPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  formError.value = ''
}

const removePhoto = () => {
  photoFile.value = null
  photoPreview.value = ''
  photoRemoved.value = true // Mark photo as explicitly removed
  if (photoInput.value) {
    photoInput.value.value = ''
  }
}

const deleteOldPhoto = async (photoUrl: string): Promise<void> => {
  try {
    // Extract the file path from the public URL
    const urlParts = photoUrl.split('/storage/v1/object/public/user-photos/')
    if (urlParts.length < 2) {
      console.log('Could not extract file path from URL:', photoUrl)
      return
    }

    const filePath = urlParts[1]
    console.log('Deleting old photo:', filePath)

    const { error } = await supabase.storage
      .from('user-photos')
      .remove([filePath])

    if (error) {
      console.error('Error deleting old photo:', error)
      // Don't throw - we still want to upload the new photo even if delete fails
    } else {
      console.log('✅ Old photo deleted successfully')
    }
  } catch (error) {
    console.error('Exception deleting old photo:', error)
    // Don't throw - we still want to upload the new photo
  }
}

const uploadPhoto = async (userId: string, oldPhotoUrl?: string): Promise<string | null> => {
  if (!photoFile.value) return null

  try {
    // Delete old photo first if it exists
    if (oldPhotoUrl) {
      await deleteOldPhoto(oldPhotoUrl)
    }

    console.log('Starting photo upload for user:', userId)
    const fileExt = photoFile.value.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `chairmen-photos/${fileName}`

    console.log('Uploading to path:', filePath)

    // Add timeout to prevent infinite loading
    const uploadPromise = supabase.storage
      .from('user-photos')
      .upload(filePath, photoFile.value, {
        cacheControl: '3600',
        upsert: false
      })

    // Add 30 second timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Upload timeout - check if storage bucket exists')), 30000)
    )

    const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any

    if (error) {
      console.error('Upload error:', error)
      throw error
    }

    console.log('Upload successful, getting public URL')

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-photos')
      .getPublicUrl(filePath)

    console.log('Public URL generated:', publicUrl)
    return publicUrl
  } catch (error: any) {
    console.error('Error uploading photo:', error)
    // Show more detailed error to user
    if (error.message?.includes('timeout')) {
      formError.value = 'Photo upload timed out. Please check if the storage bucket "user-photos" exists in Supabase.'
    } else if (error.message?.includes('not found')) {
      formError.value = 'Storage bucket "user-photos" not found. Please create it in Supabase Storage.'
    } else {
      formError.value = `Photo upload failed: ${error.message || 'Unknown error'}`
    }
    return null
  }
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  editingUser.value = null
  resetForm()
}

const viewUserDetails = (user: User) => {
  selectedUser.value = user
  showDetailsModal.value = true
}

const editUser = (user: User) => {
  // Close details modal if it's open
  showDetailsModal.value = false

  editingUser.value = user

  // Extract personal info fields safely
  const userWithPersonalInfo = user as any

  formData.value = {
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    middle_name: user.middle_name || '',
    suffix: user.suffix || '',
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    purok: user.purok || '',
    purok_chairman_id: userWithPersonalInfo.purok_chairman_id || '',
    phone_number: user.phone_number || '',
    address: user.address || '',
    // Personal information - load from database
    date_of_birth: userWithPersonalInfo.date_of_birth || '',
    place_of_birth: userWithPersonalInfo.place_of_birth || '',
    gender: userWithPersonalInfo.gender || '',
    civil_status: userWithPersonalInfo.civil_status || '',
    age: userWithPersonalInfo.age?.toString() || '',
    nationality: userWithPersonalInfo.nationality || 'Filipino',
    password: '', // Don't populate password for editing
    face_verified: user.face_verified || false,
    photo_url: user.photo_url || '',
    face_verified_at: user.face_verified_at || ''
  }

  // Reset photo state
  photoRemoved.value = false
  photoPreview.value = ''
  photoFile.value = null

  // Auto-calculate age if date_of_birth exists
  if (formData.value.date_of_birth) {
    autoCalculateAge()
  }

  console.log('📝 Editing user:', user.full_name)
  console.log('📝 Form data loaded:', formData.value)

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
    // Basic validation
    if (!formData.value.full_name.trim()) {
      formError.value = 'Full name is required'
      return
    }

    if (!formData.value.email.trim()) {
      formError.value = 'Email is required'
      return
    }

    // Validate photo for Purok Chairman
    if (formData.value.role === 'purok_chairman' && !showEditModal.value && !photoFile.value) {
      formError.value = 'Photo is required for Purok Chairman to prevent fake profiles'
      return
    }

    // Trim and normalize email
    formData.value.email = formData.value.email.trim().toLowerCase()

    // More comprehensive email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(formData.value.email)) {
      formError.value = 'Please enter a valid email address (e.g., user@gmail.com)'
      return
    }

    console.log('Form data before submission:', formData.value)

    if (showEditModal.value && editingUser.value) {
      // Remove password field when updating (passwords are in auth.users, not users table)
      const { password, ...updateData } = formData.value

      // Convert age to number if it exists
      if (updateData.age) {
        updateData.age = parseInt(updateData.age as string, 10) as any
      }

      // Convert empty strings to null for UUID fields and optional fields
      if (updateData.purok_chairman_id === '') {
        updateData.purok_chairman_id = null as any
      }
      if (updateData.middle_name === '') {
        updateData.middle_name = null as any
      }
      if (updateData.suffix === '') {
        updateData.suffix = null as any
      }
      if (updateData.purok === '') {
        updateData.purok = null as any
      }
      if (updateData.phone_number === '') {
        updateData.phone_number = null as any
      }
      if (updateData.address === '') {
        updateData.address = null as any
      }
      if (updateData.date_of_birth === '') {
        updateData.date_of_birth = null as any
      }
      if (updateData.place_of_birth === '') {
        updateData.place_of_birth = null as any
      }
      if (updateData.gender === '') {
        updateData.gender = undefined as any
      }
      if (updateData.civil_status === '') {
        updateData.civil_status = undefined as any
      }
      if (updateData.nationality === '') {
        updateData.nationality = null as any
      }

      console.log('📤 Submitting update for user:', editingUser.value.id)
      console.log('📤 Update data:', updateData)

      // Handle photo changes for purok chairman
      if (formData.value.role === 'purok_chairman') {
        if (photoFile.value) {
          // Upload new photo if one was selected
          const oldPhotoUrl = editingUser.value.photo_url
          const photoUrl = await uploadPhoto(editingUser.value.id, oldPhotoUrl)
          if (photoUrl) {
            // Add photo data to update
            updateData.photo_url = photoUrl
            updateData.face_verified = true
            updateData.face_verified_at = new Date().toISOString()
          } else {
            formError.value = 'Photo upload failed. Please try again.'
            return
          }
        } else if (photoRemoved.value && editingUser.value.photo_url) {
          // User explicitly removed the photo - delete it from storage
          await deleteOldPhoto(editingUser.value.photo_url)
          updateData.photo_url = null as any
          updateData.face_verified = false
          updateData.face_verified_at = null as any
        }
      }

      // Parse full_name into first_name, middle_name, last_name
      if (updateData.full_name) {
        const nameParts = updateData.full_name.trim().split(' ')
        if (nameParts.length === 1) {
          updateData.first_name = nameParts[0]
          updateData.last_name = nameParts[0]
        } else if (nameParts.length === 2) {
          updateData.first_name = nameParts[0]
          updateData.last_name = nameParts[1]
        } else if (nameParts.length >= 3) {
          updateData.first_name = nameParts[0]
          updateData.last_name = nameParts[nameParts.length - 1]
          updateData.middle_name = nameParts.slice(1, nameParts.length - 1).join(' ')
        }
      }

      const { success, error } = await usersStore.updateUser(editingUser.value.id, updateData as any)
      if (!success) {
        formError.value = error || 'Failed to update user'
        console.error('❌ Update failed:', error)
        return
      }

      console.log('✅ User updated successfully')
      alert('User updated successfully!')

      // Close modal and reset form
      showEditModal.value = false
      editingUser.value = null
      resetForm()
    } else {
      // Convert age to number before creating user
      const createData = { ...formData.value }
      if (createData.age) {
        createData.age = parseInt(createData.age as string, 10) as any
      }

      // Convert empty strings to null for UUID fields and optional fields
      if (createData.purok_chairman_id === '') {
        createData.purok_chairman_id = null as any
      }
      if (createData.middle_name === '') {
        createData.middle_name = null as any
      }
      if (createData.suffix === '') {
        createData.suffix = null as any
      }
      if (createData.purok === '') {
        createData.purok = null as any
      }
      if (createData.phone_number === '') {
        createData.phone_number = null as any
      }
      if (createData.address === '') {
        createData.address = null as any
      }
      if (createData.date_of_birth === '') {
        createData.date_of_birth = null as any
      }
      if (createData.place_of_birth === '') {
        createData.place_of_birth = null as any
      }
      if (createData.gender === '') {
        createData.gender = undefined as any
      }
      if (createData.civil_status === '') {
        createData.civil_status = undefined as any
      }
      if (createData.nationality === '') {
        createData.nationality = null as any
      }

      console.log('📤 Creating new user with data:', createData)

      // Create user first to get user ID for photo upload
      const { success, error, password, userId } = await usersStore.addUser(createData as any, createData.password || undefined)
      if (!success) {
        // Better error handling for common issues
        if (error?.includes('already registered') || error?.includes('already exists')) {
          formError.value = 'This email address is already registered in the system'
        } else if (error?.includes('invalid') && error?.includes('email')) {
          formError.value = 'Please enter a valid email address'
        } else {
          formError.value = error || 'Failed to create user'
        }
        return
      }

      // Upload photo if it's a Purok Chairman and photo is selected
      if (formData.value.role === 'purok_chairman' && photoFile.value && userId) {
        const photoUrl = await uploadPhoto(userId)
        if (photoUrl) {
          // Update user with photo URL and mark as verified
          await usersStore.updateUser(userId, {
            photo_url: photoUrl,
            face_verified: true,
            face_verified_at: new Date().toISOString()
          })
        } else {
          formError.value = 'User created but photo upload failed. Please edit the user to add photo.'
          return
        }
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
    const { success, error } = await usersStore.removeUser(userToDelete.value.id)
    if (success) {
      alert(`User "${userToDelete.value.full_name}" deleted successfully!`)
      showDeleteModal.value = false
      userToDelete.value = null
    } else {
      alert(`Failed to delete user: ${error || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    alert(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    formLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const calculateAge = (dateOfBirth: string): number | null => {
  if (!dateOfBirth) return null

  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

const getDisplayAge = (user: User): string => {
  if (user.age) return user.age.toString()
  if (user.date_of_birth) {
    const calculated = calculateAge(user.date_of_birth)
    return calculated !== null ? calculated.toString() : '-'
  }
  return '-'
}

// Auto-calculate age when date of birth changes
const autoCalculateAge = () => {
  if (formData.value.date_of_birth) {
    const calculatedAge = calculateAge(formData.value.date_of_birth)
    if (calculatedAge !== null) {
      formData.value.age = calculatedAge.toString()
      console.log('✅ Age auto-calculated:', calculatedAge)
    }
  } else {
    formData.value.age = ''
  }
}

let usersSubscription: any = null

onMounted(() => {
  // ✅ Data is already loaded by AdminLayout
  console.log('👥 Users page using cached data from layout')

  // Set up real-time subscription for users
  console.log('📡 Setting up real-time subscription for users...')
  usersSubscription = supabase
    .channel('users_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'users'
      },
      (payload) => {
        console.log('🔔 Users real-time update:', payload.eventType, payload)
        // Refetch all users to update the list
        usersStore.fetchUsers()
      }
    )
    .subscribe((status) => {
      console.log('📡 Users subscription status:', status)
    })
})

onUnmounted(() => {
  console.log('🔌 Unsubscribing from users changes')
  if (usersSubscription) {
    usersSubscription.unsubscribe()
  }
})
</script>

<style scoped>
.users-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
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

/* Search and Filter Section */
.search-filter-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 0;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 500px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  background-color: white;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input::placeholder {
  color: #9ca3af;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  background-color: white;
  border-radius: 0.5rem;
  padding: 0.25rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  background: none;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.filter-tab:hover {
  color: #374151;
  background-color: #f9fafb;
}

.filter-tab-active {
  color: #3b82f6;
  background-color: #eff6ff;
}

.filter-count {
  background-color: #e5e7eb;
  color: #6b7280;
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-weight: 600;
}

.filter-tab-active .filter-count {
  background-color: #3b82f6;
  color: white;
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
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.action-buttons .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  flex-shrink: 0;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.action-buttons .btn-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.action-buttons .btn-text {
  line-height: 1;
}

.action-buttons .btn-info {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.action-buttons .btn-info:hover {
  background-color: #2563eb;
  border-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.action-buttons .btn-outline {
  background-color: white;
  color: #6b7280;
  border-color: #d1d5db;
}

.action-buttons .btn-outline:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
  color: #374151;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-buttons .btn-danger {
  background-color: #ef4444;
  color: white;
  border-color: #ef4444;
}

.action-buttons .btn-danger:hover {
  background-color: #dc2626;
  border-color: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

/* Verification Badge Styles */
.verification-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.verification-badge .badge-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.verification-badge.verified {
  background-color: #d1fae5;
  color: #065f46;
}

.verification-badge.unverified {
  background-color: #fef3c7;
  color: #92400e;
}

/* Badge Styles */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
}

.badge-info {
  background-color: #dbeafe;
  color: #1e40af;
}

.badge-warning {
  background-color: #fef3c7;
  color: #92400e;
}

.badge-danger {
  background-color: #fee2e2;
  color: #991b1b;
}

.badge-success {
  background-color: #d1fae5;
  color: #065f46;
}

/* Table Styles */
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
  white-space: nowrap;
}

.table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}

.table th:last-child {
  text-align: right;
  padding-right: 1rem;
}

.table td:last-child {
  white-space: nowrap;
  padding-right: 1rem;
}

.text-sm {
  font-size: 0.875rem;
}

.text-gray-600 {
  color: #6b7280;
}

.form-help {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
  display: block;
}

/* User Details Modal Styles */
.modal-large {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.details-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.details-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.user-photo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.user-photo-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.user-photo-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-photo-placeholder {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 3rem;
  font-weight: 600;
}

.verification-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge-icon {
  width: 1rem;
  height: 1rem;
  margin-right: 0.25rem;
}

.user-summary {
  flex: 1;
}

.user-summary h2 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.user-email {
  color: #6b7280;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.badge-large {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  display: inline-block;
}

.details-section {
  padding: 1.5rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item-full {
  grid-column: 1 / -1;
}

.detail-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-item p {
  font-size: 1rem;
  color: #111827;
  font-weight: 500;
}

.modal-header-with-close {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-close-button {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #6b7280;
  border-radius: 0.375rem;
  transition: all 0.2s;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-button:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.modal-close-button svg {
  width: 1.5rem;
  height: 1.5rem;
}

.modal-close {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #6b7280;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.modal-close svg {
  width: 1.5rem;
  height: 1.5rem;
}

@media (max-width: 768px) {
  .details-header {
    flex-direction: column;
    text-align: center;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .modal-large {
    max-width: 95%;
  }
}

/* Photo Upload Styles */
.photo-upload-container {
  margin-top: 0.5rem;
}

.photo-preview {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-remove-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.photo-remove-btn:hover {
  background-color: rgba(220, 38, 38, 1);
  transform: scale(1.1);
}

.photo-remove-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.photo-upload-box {
  position: relative;
  width: 200px;
  height: 200px;
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #f9fafb;
}

.photo-upload-box:hover {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.photo-input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  pointer-events: none;
}

.upload-icon {
  width: 3rem;
  height: 3rem;
  color: #9ca3af;
}

.upload-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  margin: 0;
}

.upload-hint {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
}

.text-danger {
  color: #dc2626;
}

.text-warning {
  color: #d97706;
}

.text-muted {
  color: #9ca3af;
  font-size: 0.875rem;
}

/* Section Divider and Form Row Styles */
.section-divider {
  margin: 1.5rem 0 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
