<template>
  <div class="certificate-requests-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-left">
        <h2 class="view-title">Certificate Requests</h2>
        <p class="view-description">Manage certificate requests from mobile app</p>
      </div>
      <div class="header-right">
        <button @click="showAddModal = true" class="btn btn-primary">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Request
        </button>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button
        v-for="filter in statusFilters"
        :key="filter.value"
        @click="activeFilter = filter.value"
        class="filter-tab"
        :class="{ 'filter-tab-active': activeFilter === filter.value }"
      >
        {{ filter.label }}
        <span v-if="filter.count !== undefined" class="filter-count">{{ filter.count }}</span>
      </button>
    </div>

    <!-- Requests Table -->
    <div class="table-container">
      <div v-if="requestsStore.loading" class="loading">
        <div class="spinner"></div>
        <p>Loading certificate requests...</p>
      </div>

      <div v-else-if="requestsStore.error" class="alert alert-error">
        {{ requestsStore.error }}
      </div>

      <div v-else-if="filteredRequests.length === 0" class="empty-state">
        <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3>No requests found</h3>
        <p>{{ activeFilter === 'all' ? 'No certificate requests yet' : `No ${activeFilter} requests` }}</p>
        <button @click="showAddModal = true" class="btn btn-primary">Add Request</button>
      </div>

      <table v-else class="table">
        <thead>
          <tr>
            <th>Certificate Type</th>
            <th>Requestor</th>
            <th>Purpose</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Requested</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="request in filteredRequests" :key="request.id">
            <td>
              <div class="certificate-type">
                {{ request.certificate_type }}
              </div>
            </td>
            <td>
              <div class="user-info">
                <div class="user-name">{{ request.users?.full_name || 'Unknown User' }}</div>
                <div class="user-email">{{ request.users?.email || '' }}</div>
              </div>
            </td>
            <td>
              <div class="purpose-text">{{ request.purpose }}</div>
            </td>
            <td>
              <div class="amount">₱{{ request.amount || 0 }}</div>
            </td>
            <td>
              <span
                class="badge"
                :class="{
                  'badge-warning': request.status === 'pending',
                  'badge-info': request.status === 'in_progress',
                  'badge-success': request.status === 'completed',
                  'badge-danger': request.status === 'rejected'
                }"
              >
                {{ request.status }}
              </span>
            </td>
            <td>{{ formatDate(request.created_at) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  v-if="request.status === 'pending'"
                  @click="updateRequestStatus(request, 'in_progress')"
                  class="btn btn-info btn-sm"
                  title="Start processing"
                >
                  <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  v-if="request.status === 'in_progress'"
                  @click="updateRequestStatus(request, 'completed')"
                  class="btn btn-success btn-sm"
                  title="Mark as completed"
                >
                  <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  v-if="request.status === 'pending'"
                  @click="updateRequestStatus(request, 'rejected')"
                  class="btn btn-danger btn-sm"
                  title="Reject"
                >
                  <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  @click="editRequest(request)"
                  class="btn btn-outline btn-sm"
                  title="Edit request"
                >
                  <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="confirmDeleteRequest(request)"
                  class="btn btn-danger btn-sm"
                  title="Delete request"
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

    <!-- Add/Edit Request Modal -->
    <div v-if="showAddModal || showEditModal" class="modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ showEditModal ? 'Edit Request' : 'Add New Request' }}</h3>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div v-if="formError" class="alert alert-error">
              {{ formError }}
            </div>

            <div class="form-group">
              <label for="user_id" class="form-label">User</label>
              <select
                id="user_id"
                v-model="formData.user_id"
                class="form-select"
                required
                :disabled="formLoading"
              >
                <option value="">Select a user</option>
                <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                  {{ user.full_name }} ({{ user.email }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="certificate_type" class="form-label">Certificate Type</label>
              <select
                id="certificate_type"
                v-model="formData.certificate_type"
                class="form-select"
                required
                :disabled="formLoading"
              >
                <option value="">Select certificate type</option>
                <option value="Barangay Clearance">Barangay Clearance</option>
                <option value="Certificate of Residency">Certificate of Residency</option>
                <option value="Business Permit">Business Permit</option>
                <option value="Certificate of Indigency">Certificate of Indigency</option>
                <option value="Good Moral Certificate">Good Moral Certificate</option>
              </select>
            </div>

            <div class="form-group">
              <label for="purpose" class="form-label">Purpose</label>
              <textarea
                id="purpose"
                v-model="formData.purpose"
                class="form-input"
                rows="3"
                required
                :disabled="formLoading"
                placeholder="Enter the purpose for this request..."
              ></textarea>
            </div>

            <div class="form-group">
              <label for="amount" class="form-label">Amount</label>
              <input
                id="amount"
                v-model.number="formData.amount"
                type="number"
                step="0.01"
                min="0"
                class="form-input"
                :disabled="formLoading"
                placeholder="0.00"
              />
            </div>

            <div class="form-group">
              <label for="status" class="form-label">Status</label>
              <select
                id="status"
                v-model="formData.status"
                class="form-select"
                required
                :disabled="formLoading"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div class="form-group">
              <label for="notes" class="form-label">Notes (Optional)</label>
              <textarea
                id="notes"
                v-model="formData.notes"
                class="form-input"
                rows="2"
                :disabled="formLoading"
                placeholder="Add any additional notes..."
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
            {{ showEditModal ? 'Update' : 'Create' }} Request
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
          <p>Are you sure you want to delete this <strong>{{ requestToDelete?.certificate_type }}</strong> request?</p>
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
            @click="handleDeleteRequest"
            type="button"
            class="btn btn-danger"
            :disabled="formLoading"
          >
            <div v-if="formLoading" class="spinner"></div>
            Delete Request
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCertificateRequestsStore } from '../stores/certificateRequests'
import { useUsersStore } from '../stores/users'
import type { CertificateRequest, User } from '../lib/supabase'

const requestsStore = useCertificateRequestsStore()
const usersStore = useUsersStore()

const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const formLoading = ref(false)
const formError = ref('')
const requestToDelete = ref<CertificateRequest | null>(null)
const editingRequest = ref<CertificateRequest | null>(null)
const activeFilter = ref('all')

const formData = ref({
  user_id: '',
  certificate_type: '',
  purpose: '',
  status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'rejected',
  notes: '',
  amount: 0
})

const statusFilters = computed(() => [
  {
    label: 'All',
    value: 'all',
    count: requestsStore.requests.length
  },
  {
    label: 'Pending',
    value: 'pending',
    count: requestsStore.requests.filter(r => r.status === 'pending').length
  },
  {
    label: 'In Progress',
    value: 'in_progress',
    count: requestsStore.requests.filter(r => r.status === 'in_progress').length
  },
  {
    label: 'Completed',
    value: 'completed',
    count: requestsStore.requests.filter(r => r.status === 'completed').length
  },
  {
    label: 'Rejected',
    value: 'rejected',
    count: requestsStore.requests.filter(r => r.status === 'rejected').length
  }
])

const filteredRequests = computed(() => {
  if (activeFilter.value === 'all') {
    return requestsStore.requests
  }
  return requestsStore.requests.filter(r => r.status === activeFilter.value)
})

const availableUsers = computed(() => {
  return usersStore.users.filter(u => u.role !== 'admin')
})

const resetForm = () => {
  formData.value = {
    user_id: '',
    certificate_type: '',
    purpose: '',
    status: 'pending',
    notes: '',
    amount: 0
  }
  formError.value = ''
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  editingRequest.value = null
  resetForm()
}

const editRequest = (request: CertificateRequest) => {
  editingRequest.value = request
  formData.value = {
    user_id: request.user_id,
    certificate_type: request.certificate_type,
    purpose: request.purpose,
    status: request.status,
    notes: request.notes || '',
    amount: request.amount || 0
  }
  showEditModal.value = true
}

const confirmDeleteRequest = (request: CertificateRequest) => {
  requestToDelete.value = request
  showDeleteModal.value = true
}

const updateRequestStatus = async (request: CertificateRequest, newStatus: string) => {
  const updates: Partial<CertificateRequest> = {
    status: newStatus as any
  }

  await requestsStore.updateRequestStatus(request.id, updates)
}

const handleSubmit = async () => {
  formLoading.value = true
  formError.value = ''

  try {
    if (showEditModal.value && editingRequest.value) {
      const { success, error } = await requestsStore.updateRequestStatus(
        editingRequest.value.id,
        formData.value
      )
      if (!success) {
        formError.value = error || 'Failed to update request'
        return
      }
    } else {
      const { success, error } = await requestsStore.addRequest(formData.value as any)
      if (!success) {
        formError.value = error || 'Failed to create request'
        return
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

const handleDeleteRequest = async () => {
  if (!requestToDelete.value) return

  formLoading.value = true

  try {
    const { success } = await requestsStore.removeRequest(requestToDelete.value.id)
    if (success) {
      showDeleteModal.value = false
      requestToDelete.value = null
    }
  } catch (error) {
    console.error('Error deleting request:', error)
  } finally {
    formLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(async () => {
  await Promise.all([
    requestsStore.fetchRequests(),
    usersStore.fetchUsers()
  ])
})
</script>

<style scoped>
/* Reuse the same styles from CertificatesView.vue */
.certificate-requests-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.filter-tabs {
  display: flex;
  background-color: white;
  border-radius: 0.5rem;
  padding: 0.25rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
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

.certificate-type {
  font-weight: 500;
  color: #111827;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #111827;
}

.user-email {
  font-size: 0.875rem;
  color: #6b7280;
}

.purpose-text {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.amount {
  font-weight: 600;
  color: #059669;
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
