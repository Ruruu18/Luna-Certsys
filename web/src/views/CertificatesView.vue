<template>
  <div class="certificates-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-left">
        <h2 class="view-title">Certificate Management</h2>
        <p class="view-description">Manage all certificates from walk-in and mobile app requests</p>
      </div>
      <div class="header-right">
        <button @click="showAddModal = true" class="btn btn-primary">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Walk-in Certificate
        </button>
      </div>
    </div>

    <!-- Source Filter Tabs -->
    <div class="filter-tabs">
      <button
        v-for="filter in sourceFilters"
        :key="filter.value"
        @click="activeSourceFilter = filter.value"
        class="filter-tab"
        :class="{ 'filter-tab-active': activeSourceFilter === filter.value }"
      >
        {{ filter.label }}
        <span v-if="filter.count !== undefined" class="filter-count">{{ filter.count }}</span>
      </button>
    </div>

    <!-- Status Filter Tabs -->
    <div class="filter-tabs secondary-tabs">
      <button
        v-for="filter in statusFilters"
        :key="filter.value"
        @click="activeStatusFilter = filter.value"
        class="filter-tab"
        :class="{ 'filter-tab-active': activeStatusFilter === filter.value }"
      >
        {{ filter.label }}
        <span v-if="filter.count !== undefined" class="filter-count">{{ filter.count }}</span>
      </button>
    </div>

    <!-- Certificates Table -->
    <div class="table-container">
      <div v-if="certificatesStore.error || requestsStore.error" class="alert alert-error">
        {{ certificatesStore.error || requestsStore.error }}
      </div>

      <div v-else-if="filteredCertificates.length === 0" class="empty-state">
        <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3>No certificates found</h3>
        <p>{{ getEmptyStateMessage() }}</p>
        <button @click="showAddModal = true" class="btn btn-primary">Add Walk-in Certificate</button>
      </div>

      <table v-else class="table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Certificate Type</th>
            <th>Requestor</th>
            <th>Purpose</th>
            <th>Status</th>
            <th>Requested</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="certificate in filteredCertificates" :key="certificate.id + certificate.source">
            <td>
              <span
                class="badge"
                :class="certificate.source === 'walk-in' ? 'badge-purple' : 'badge-blue'"
              >
                {{ certificate.source === 'walk-in' ? '🏢 Walk-in' : '📱 Mobile App' }}
              </span>
            </td>
            <td>
              <div class="certificate-type">
                {{ certificate.certificate_type }}
              </div>
            </td>
            <td>
              <div class="user-info">
                <div class="user-name">{{ certificate.users?.full_name || 'Unknown User' }}</div>
                <div class="user-email">{{ certificate.users?.email || '' }}</div>
              </div>
            </td>
            <td>
              <div class="purpose-text">{{ certificate.purpose }}</div>
            </td>
            <td>
              <span
                class="badge"
                :class="{
                  'badge-warning': certificate.status === 'pending',
                  'badge-info': certificate.status === 'approved' || certificate.status === 'in_progress',
                  'badge-success': certificate.status === 'completed',
                  'badge-danger': certificate.status === 'rejected'
                }"
              >
                {{ formatStatus(certificate.status) }}
              </span>
            </td>
            <td>{{ formatDate(certificate.requested_at) }}</td>
            <td>
              <div class="action-buttons">
                <!-- Approve button - for pending status -->
                <button
                  v-if="certificate.status === 'pending'"
                  @click="updateStatus(certificate, 'approved')"
                  class="btn-icon-only btn-icon-success"
                  title="Approve"
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>

                <!-- Complete button - for approved/in_progress status -->
                <button
                  v-if="certificate.status === 'approved' || certificate.status === 'in_progress'"
                  @click="updateStatus(certificate, 'completed')"
                  class="btn-icon-only btn-icon-primary"
                  title="Mark as completed"
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                <!-- View button - always visible -->
                <button
                  @click="viewCertificateReadOnly(certificate)"
                  class="btn-icon-only btn-icon-info"
                  title="View certificate details"
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>

                <!-- Edit button - only for walk-in -->
                <button
                  v-if="certificate.source === 'walk-in'"
                  @click="editCertificate(certificate)"
                  class="btn-icon-only btn-icon-warning"
                  title="Edit certificate"
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                <!-- Delete button - always visible -->
                <button
                  @click="confirmDelete(certificate)"
                  class="btn-icon-only btn-icon-danger"
                  title="Delete certificate"
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Certificate Modal (only for walk-in) -->
    <div v-if="showAddModal || showEditModal" class="modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ showEditModal ? 'Edit Walk-in Certificate' : 'Add Walk-in Certificate' }}</h3>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div v-if="formError" class="alert alert-error">
              {{ formError }}
            </div>

            <div class="form-group">
              <label for="user_id" class="form-label">Resident</label>
              <select
                id="user_id"
                v-model="formData.user_id"
                class="form-select"
                required
                :disabled="formLoading"
              >
                <option value="">Select a resident</option>
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
                <option value="Certificate of Indigency">Certificate of Indigency</option>
                <option value="Business Permit">Business Permit</option>
                <option value="Barangay ID">Barangay ID</option>
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
                placeholder="Enter the purpose for this certificate..."
              ></textarea>
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
                <option value="approved">Approved</option>
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
            {{ showEditModal ? 'Update' : 'Create' }} Certificate
          </button>
        </div>
      </div>
    </div>

    <!-- View Certificate Modal (Read-Only) -->
    <div v-if="showViewModal && viewingCertificate" class="modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">View Certificate Details</h3>
        </div>

        <div class="modal-body">
          <div class="view-grid">
            <div class="view-row">
              <span class="view-label">Certificate ID:</span>
              <span class="view-value">{{ viewingCertificate.id }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Source:</span>
              <span class="view-value">
                <span class="badge" :class="viewingCertificate.source === 'walk-in' ? 'badge-info' : 'badge-success'">
                  {{ viewingCertificate.source === 'walk-in' ? 'Walk-in' : 'Mobile App' }}
                </span>
              </span>
            </div>

            <div class="view-row">
              <span class="view-label">Resident:</span>
              <span class="view-value">{{ viewingCertificate.users?.full_name || 'N/A' }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Certificate Type:</span>
              <span class="view-value">{{ viewingCertificate.certificate_type }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Purpose:</span>
              <span class="view-value">{{ viewingCertificate.purpose }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Status:</span>
              <span class="view-value">
                <span
                  class="badge"
                  :class="{
                    'badge-warning': viewingCertificate.status === 'pending',
                    'badge-info': viewingCertificate.status === 'approved' || viewingCertificate.status === 'in_progress',
                    'badge-success': viewingCertificate.status === 'completed',
                    'badge-danger': viewingCertificate.status === 'rejected'
                  }"
                >
                  {{ formatStatus(viewingCertificate.status) }}
                </span>
              </span>
            </div>

            <div class="view-row">
              <span class="view-label">Requested At:</span>
              <span class="view-value">{{ formatDate(viewingCertificate.requested_at) }}</span>
            </div>

            <div class="view-row" v-if="viewingCertificate.processed_at">
              <span class="view-label">Processed At:</span>
              <span class="view-value">{{ formatDate(viewingCertificate.processed_at) }}</span>
            </div>

            <div class="view-row" v-if="viewingCertificate.notes">
              <span class="view-label">Notes:</span>
              <span class="view-value">{{ viewingCertificate.notes }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            @click="closeModal"
            type="button"
            class="btn btn-outline"
          >
            Close
          </button>
          <button
            v-if="viewingCertificate.source === 'walk-in'"
            @click="editCertificate(viewingCertificate); showViewModal = false"
            type="button"
            class="btn btn-primary"
          >
            Edit Certificate
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
          <p>Are you sure you want to delete this <strong>{{ certificateToDelete?.source }}</strong> certificate?</p>
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
            @click="handleDelete"
            type="button"
            class="btn btn-danger"
            :disabled="formLoading"
          >
            <div v-if="formLoading" class="spinner"></div>
            Delete Certificate
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCertificatesStore } from '../stores/certificates'
import { useCertificateRequestsStore } from '../stores/certificateRequests'
import { useUsersStore } from '../stores/users'
import type { Certificate, CertificateRequest, User } from '../lib/supabase'

const certificatesStore = useCertificatesStore()
const requestsStore = useCertificateRequestsStore()
const usersStore = useUsersStore()

const showAddModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)
const formLoading = ref(false)
const formError = ref('')
const certificateToDelete = ref<any | null>(null)
const editingCertificate = ref<Certificate | null>(null)
const viewingCertificate = ref<any | null>(null)
const activeSourceFilter = ref('all')
const activeStatusFilter = ref('all')

const formData = ref({
  user_id: '',
  certificate_type: '',
  purpose: '',
  status: 'pending' as 'pending' | 'approved' | 'rejected' | 'completed',
  notes: ''
})

// Combine walk-in certificates and mobile app requests
const allCertificates = computed(() => {
  const walkIn = certificatesStore.certificates.map(cert => ({
    ...cert,
    source: 'walk-in' as const,
    requested_at: cert.requested_at
  }))

  const mobileApp = requestsStore.requests.map(req => ({
    ...req,
    source: 'mobile-app' as const,
    requested_at: req.created_at
  }))

  return [...walkIn, ...mobileApp].sort((a, b) =>
    new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
  )
})

// Source filters
const sourceFilters = computed(() => [
  {
    label: 'All Certificates',
    value: 'all',
    count: allCertificates.value.length
  },
  {
    label: '🏢 Walk-in',
    value: 'walk-in',
    count: certificatesStore.certificates.length
  },
  {
    label: '📱 Mobile App',
    value: 'mobile-app',
    count: requestsStore.requests.length
  }
])

// Status filters based on current source
const statusFilters = computed(() => {
  const filtered = allCertificates.value.filter(c =>
    activeSourceFilter.value === 'all' || c.source === activeSourceFilter.value
  )

  return [
    {
      label: 'All',
      value: 'all',
      count: filtered.length
    },
    {
      label: 'Pending',
      value: 'pending',
      count: filtered.filter(c => c.status === 'pending').length
    },
    {
      label: 'Approved / In Progress',
      value: 'approved',
      count: filtered.filter(c => c.status === 'approved' || c.status === 'in_progress').length
    },
    {
      label: 'Completed',
      value: 'completed',
      count: filtered.filter(c => c.status === 'completed').length
    },
    {
      label: 'Rejected',
      value: 'rejected',
      count: filtered.filter(c => c.status === 'rejected').length
    }
  ]
})

// Filtered certificates
const filteredCertificates = computed(() => {
  let certs = allCertificates.value

  // Apply source filter
  if (activeSourceFilter.value !== 'all') {
    certs = certs.filter(c => c.source === activeSourceFilter.value)
  }

  // Apply status filter
  if (activeStatusFilter.value !== 'all') {
    certs = certs.filter(c => {
      if (activeStatusFilter.value === 'approved') {
        return c.status === 'approved' || c.status === 'in_progress'
      }
      return c.status === activeStatusFilter.value
    })
  }

  return certs
})

const availableUsers = computed(() => {
  return usersStore.users.filter(u => u.role !== 'admin')
})

const getEmptyStateMessage = () => {
  if (activeSourceFilter.value === 'walk-in') {
    return activeStatusFilter.value === 'all'
      ? 'No walk-in certificates yet. Add one to get started.'
      : `No ${activeStatusFilter.value} walk-in certificates.`
  }
  if (activeSourceFilter.value === 'mobile-app') {
    return activeStatusFilter.value === 'all'
      ? 'No mobile app requests yet. Residents can request via the mobile app.'
      : `No ${activeStatusFilter.value} mobile app requests.`
  }
  return activeStatusFilter.value === 'all'
    ? 'No certificates found. Add a walk-in certificate or wait for mobile app requests.'
    : `No ${activeStatusFilter.value} certificates.`
}

const resetForm = () => {
  formData.value = {
    user_id: '',
    certificate_type: '',
    purpose: '',
    status: 'pending',
    notes: ''
  }
  formError.value = ''
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  showViewModal.value = false
  editingCertificate.value = null
  viewingCertificate.value = null
  resetForm()
}

const editCertificate = (certificate: any) => {
  if (certificate.source !== 'walk-in') return // Only allow editing walk-in certificates

  editingCertificate.value = certificate
  formData.value = {
    user_id: certificate.user_id,
    certificate_type: certificate.certificate_type,
    purpose: certificate.purpose,
    status: certificate.status,
    notes: certificate.notes || ''
  }
  showEditModal.value = true
}

const confirmDelete = (certificate: any) => {
  certificateToDelete.value = certificate
  showDeleteModal.value = true
}

const viewCertificateReadOnly = (certificate: any) => {
  // Open read-only view modal
  viewingCertificate.value = certificate
  showViewModal.value = true
}

const updateStatus = async (certificate: any, newStatus: string) => {
  console.log('🔄 Updating certificate status:', {
    id: certificate.id,
    source: certificate.source,
    currentStatus: certificate.status,
    newStatus: newStatus
  })

  try {
    if (certificate.source === 'walk-in') {
      console.log('📝 Updating walk-in certificate...')
      const { success, error } = await certificatesStore.updateCertificateStatus(certificate.id, { status: newStatus as any })
      if (!success) {
        console.error('❌ Failed to update walk-in certificate:', error)
        alert(`Failed to update certificate: ${error}`)
      } else {
        console.log('✅ Walk-in certificate updated successfully')
      }
    } else {
      // Mobile app requests use different status values
      // Map 'approved' to 'in_progress' for mobile app requests
      let mappedStatus = newStatus
      if (newStatus === 'approved') {
        mappedStatus = 'in_progress'
        console.log('📱 Mapping "approved" to "in_progress" for mobile app request')
      }

      console.log('📱 Updating mobile app request...')
      const { success, error } = await requestsStore.updateRequestStatus(certificate.id, { status: mappedStatus as any })
      if (!success) {
        console.error('❌ Failed to update mobile app request:', error)
        alert(`Failed to update certificate: ${error}`)
      } else {
        console.log('✅ Mobile app request updated successfully')
      }
    }
  } catch (error) {
    console.error('❌ Exception while updating status:', error)
    alert(`Error: ${error}`)
  }
}

const handleSubmit = async () => {
  formLoading.value = true
  formError.value = ''

  try {
    if (!formData.value.user_id || !formData.value.certificate_type || !formData.value.purpose) {
      formError.value = 'Please fill in all required fields'
      return
    }

    if (showEditModal.value && editingCertificate.value) {
      const { success } = await certificatesStore.updateCertificateStatus(
        editingCertificate.value.id,
        formData.value
      )
      if (!success) {
        formError.value = 'Failed to update certificate'
        return
      }
    } else {
      const { success } = await certificatesStore.addCertificate(formData.value)
      if (!success) {
        formError.value = 'Failed to create certificate'
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

const handleDelete = async () => {
  if (!certificateToDelete.value) return

  formLoading.value = true

  try {
    if (certificateToDelete.value.source === 'walk-in') {
      await certificatesStore.removeCertificate(certificateToDelete.value.id)
    } else {
      await requestsStore.removeRequest(certificateToDelete.value.id)
    }
    showDeleteModal.value = false
    certificateToDelete.value = null
  } catch (error) {
    console.error('Error deleting certificate:', error)
  } finally {
    formLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const formatStatus = (status: string) => {
  if (status === 'in_progress') return 'In Progress'
  return status.charAt(0).toUpperCase() + status.slice(1)
}
</script>

<style scoped>
.certificates-view {
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

.filter-tabs {
  display: flex;
  background-color: white;
  border-radius: 0.5rem;
  padding: 0.25rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
}

.secondary-tabs {
  background-color: #f9fafb;
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
  gap: 0.125rem;
}

.user-name {
  font-weight: 500;
  color: #111827;
}

.user-email {
  font-size: 0.75rem;
  color: #6b7280;
}

.purpose-text {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #6b7280;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

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

.badge-warning {
  background-color: #fef3c7;
  color: #92400e;
}

.badge-info {
  background-color: #dbeafe;
  color: #1e40af;
}

.badge-success {
  background-color: #d1fae5;
  color: #065f46;
}

.badge-danger {
  background-color: #fee2e2;
  color: #991b1b;
}

.badge-blue {
  background-color: #dbeafe;
  color: #1e40af;
}

.badge-purple {
  background-color: #f3e8ff;
  color: #6b21a8;
}

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

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.text-sm {
  font-size: 0.875rem;
}

.text-gray-600 {
  color: #6b7280;
}

/* Circular Icon-only Buttons */
.btn-icon-only {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.btn-icon-only svg {
  width: 1.25rem;
  height: 1.25rem;
}

.btn-icon-success {
  background-color: #10b981;
  color: white;
}

.btn-icon-success:hover {
  background-color: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4);
}

.btn-icon-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-icon-primary:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
}

.btn-icon-info {
  background-color: #06b6d4;
  color: white;
}

.btn-icon-info:hover {
  background-color: #0891b2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(6, 182, 212, 0.4);
}

.btn-icon-danger {
  background-color: #ef4444;
  color: white;
}

.btn-icon-danger:hover {
  background-color: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
}

.btn-icon-warning {
  background-color: #f59e0b;
  color: white;
}

.btn-icon-warning:hover {
  background-color: #d97706;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(245, 158, 11, 0.4);
}

/* View Modal Styles */
.view-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.view-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.view-row:last-child {
  border-bottom: none;
}

.view-label {
  font-weight: 600;
  color: #374151;
  min-width: 150px;
}

.view-value {
  flex: 1;
  text-align: right;
  color: #6b7280;
}
</style>
