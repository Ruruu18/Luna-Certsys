<template>
  <div class="payments-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-left">
        <h2 class="view-title">Payment Management</h2>
        <p class="view-description">Track and manage certificate payments</p>
      </div>
      <div class="header-right">
        <button @click="showAddModal = true" class="btn btn-primary">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Record Payment
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-filter-section">
      <div class="search-box">
        <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by payer name, email, certificate type..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-header">
            <h3 class="stat-title">Total Revenue</h3>
            <span class="stat-badge success">{{ paidCount }} Paid</span>
          </div>
          <p class="stat-value">₱{{ totalRevenue.toLocaleString() }}</p>
          <p class="stat-description">All time earnings</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-green">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-header">
            <h3 class="stat-title">This Month</h3>
            <span class="stat-badge info">{{ currentMonthName }}</span>
          </div>
          <p class="stat-value">₱{{ monthlyRevenue.toLocaleString() }}</p>
          <p class="stat-description">{{ monthlyPaidCount }} transactions</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-yellow">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-header">
            <h3 class="stat-title">Pending Payments</h3>
            <span class="stat-badge warning">{{ failedCount }} Failed</span>
          </div>
          <p class="stat-value">{{ pendingCount }}</p>
          <p class="stat-description">₱{{ pendingAmount.toLocaleString() }} awaiting</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon-purple">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-header">
            <h3 class="stat-title">Average Payment</h3>
            <span class="stat-badge purple">{{ paymentMethods.length }} Methods</span>
          </div>
          <p class="stat-value">₱{{ averagePayment.toLocaleString() }}</p>
          <p class="stat-description">Per transaction</p>
        </div>
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

    <!-- Payments Table -->
    <div class="table-container">
      <div v-if="error" class="error-state">
        <p>{{ error }}</p>
      </div>

      <div v-else-if="filteredPayments.length === 0" class="empty-state">
        <svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3>No payments found</h3>
        <p>{{ activeFilter === 'all' ? 'Get started by recording your first payment' : `No ${activeFilter} payments` }}</p>
        <button @click="showAddModal = true" class="btn btn-primary">Record Payment</button>
      </div>

      <table v-else class="table">
        <thead>
          <tr>
            <th>Certificate</th>
            <th>Payer</th>
            <th>Amount</th>
            <th>Payment Method</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in filteredPayments" :key="payment.id">
            <td>
              <div class="certificate-info">
                <div class="certificate-type">{{ payment.certificateType }}</div>
                <div class="certificate-id">Ref: {{ payment.referenceNumber }}</div>
              </div>
            </td>
            <td>
              <div class="user-info">
                <div class="user-name">{{ payment.payerName }}</div>
                <div class="user-email">{{ payment.payerEmail }}</div>
              </div>
            </td>
            <td>
              <div class="amount">₱{{ payment.amount.toLocaleString() }}</div>
            </td>
            <td>
              <span class="payment-method">{{ payment.paymentMethod }}</span>
            </td>
            <td>
              <span
                class="badge"
                :class="{
                  'badge-warning': payment.status === 'pending',
                  'badge-success': payment.status === 'paid',
                  'badge-danger': payment.status === 'failed'
                }"
              >
                {{ payment.status }}
              </span>
            </td>
            <td>{{ formatDate(payment.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  v-if="payment.status === 'pending'"
                  @click="markAsPaid(payment)"
                  class="btn btn-success btn-sm btn-with-text"
                  title="Mark as paid"
                >
                  <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="btn-text">Mark Paid</span>
                </button>
                <button
                  @click="editPayment(payment)"
                  class="btn btn-outline btn-sm btn-with-text"
                  title="Edit payment"
                >
                  <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span class="btn-text">Edit</span>
                </button>
                <button
                  @click="confirmDeletePayment(payment)"
                  class="btn btn-danger btn-sm btn-with-text"
                  title="Delete payment"
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

    <!-- Add/Edit Payment Modal -->
    <div v-if="showAddModal || showEditModal" class="modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ showEditModal ? 'Edit Payment' : 'Record New Payment' }}</h3>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div v-if="formError" class="alert alert-error">
              {{ formError }}
            </div>

            <!-- Show certificate request selector only when adding new payment -->
            <div v-if="!showEditModal" class="form-group">
              <label for="certificateRequest" class="form-label">Certificate Request</label>
              <select
                id="certificateRequest"
                v-model="formData.certificateRequestId"
                @change="onRequestSelected(formData.certificateRequestId)"
                class="form-select"
                required
                :disabled="formLoading"
              >
                <option value="">Select certificate request</option>
                <option v-for="req in unpaidRequests" :key="req.id" :value="req.id">
                  {{ req.users?.full_name || 'Unknown' }} - {{ req.certificate_type }} ({{ new Date(req.created_at).toLocaleDateString() }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="payerName" class="form-label">Payer Name</label>
              <input
                id="payerName"
                v-model="formData.payerName"
                type="text"
                class="form-input"
                required
                :disabled="formLoading || !showEditModal"
                placeholder="Enter payer's full name"
                readonly
              />
            </div>

            <div class="form-group">
              <label for="payerEmail" class="form-label">Payer Email</label>
              <input
                id="payerEmail"
                v-model="formData.payerEmail"
                type="email"
                class="form-input"
                required
                :disabled="formLoading || !showEditModal"
                placeholder="payer@example.com"
                readonly
              />
            </div>

            <div class="form-group">
              <label for="certificateType" class="form-label">Certificate Type</label>
              <input
                id="certificateType"
                v-model="formData.certificateType"
                type="text"
                class="form-input"
                required
                :disabled="formLoading"
                readonly
              />
            </div>

            <div class="form-group">
              <label for="amount" class="form-label">Amount (₱)</label>
              <input
                id="amount"
                v-model.number="formData.amount"
                type="number"
                class="form-input"
                required
                :disabled="formLoading"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            <div class="form-group">
              <label for="paymentMethod" class="form-label">Payment Method</label>
              <select
                id="paymentMethod"
                v-model="formData.paymentMethod"
                class="form-select"
                required
                :disabled="formLoading"
              >
                <option value="">Select payment method</option>
                <option value="Cash">Cash</option>
                <option value="GCash">GCash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Check">Check</option>
              </select>
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
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
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
            {{ showEditModal ? 'Update' : 'Record' }} Payment
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
          <p>Are you sure you want to delete this payment record for <strong>{{ paymentToDelete?.payerName }}</strong>?</p>
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
            @click="handleDeletePayment"
            type="button"
            class="btn btn-danger"
            :disabled="formLoading"
          >
            <div v-if="formLoading" class="spinner"></div>
            Delete Payment
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCertificateRequestsStore } from '../stores/certificateRequests'
import { updateCertificateRequest, type CertificateRequest } from '../lib/supabase'

interface Payment {
  id: string
  certificateRequestId?: string
  payerName: string
  payerEmail: string
  certificateType: string
  amount: number
  paymentMethod: string
  referenceNumber: string
  status: 'pending' | 'paid' | 'failed'
  notes?: string
  createdAt: string
}

const certificateRequestsStore = useCertificateRequestsStore()
const loading = ref(false)
const error = ref('')
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const formLoading = ref(false)
const formError = ref('')
const paymentToDelete = ref<Payment | null>(null)
const editingPayment = ref<Payment | null>(null)
const activeFilter = ref('all')
const searchQuery = ref('')

// Convert certificate requests to payment format
const payments = computed(() => {
  return certificateRequestsStore.requests
    .filter(req => req.payment_status && req.payment_amount) // Only show requests with payment info
    .map(req => ({
      id: req.id,
      payerName: req.users?.full_name || 'Unknown',
      payerEmail: req.users?.email || '',
      certificateType: req.certificate_type,
      amount: req.payment_amount || 0,
      paymentMethod: req.payment_method || 'Cash',
      referenceNumber: req.id.substring(0, 8).toUpperCase(),
      status: (req.payment_status || 'pending') as 'pending' | 'paid' | 'failed',
      notes: req.notes,
      createdAt: req.payment_date || req.created_at
    }))
})

const formData = ref({
  certificateRequestId: '',
  payerName: '',
  payerEmail: '',
  certificateType: '',
  amount: 0,
  paymentMethod: '',
  referenceNumber: '',
  status: 'pending' as 'pending' | 'paid' | 'failed',
  notes: ''
})

// Certificate requests that don't have payment info yet
const unpaidRequests = computed(() => {
  return certificateRequestsStore.requests.filter(req => !req.payment_status || !req.payment_amount)
})

// Handle certificate request selection in add payment modal
const onRequestSelected = (requestId: string) => {
  const request = certificateRequestsStore.requests.find(r => r.id === requestId)
  if (request) {
    formData.value.payerName = request.users?.full_name || ''
    formData.value.payerEmail = request.users?.email || ''
    formData.value.certificateType = request.certificate_type
    formData.value.amount = request.amount || 0
  }
}

const statusFilters = computed(() => [
  {
    label: 'All',
    value: 'all',
    count: payments.value.length
  },
  {
    label: 'Paid',
    value: 'paid',
    count: payments.value.filter(p => p.status === 'paid').length
  },
  {
    label: 'Pending',
    value: 'pending',
    count: payments.value.filter(p => p.status === 'pending').length
  },
  {
    label: 'Failed',
    value: 'failed',
    count: payments.value.filter(p => p.status === 'failed').length
  }
])

const filteredPayments = computed(() => {
  let filtered = payments.value

  // Filter by status
  if (activeFilter.value !== 'all') {
    filtered = filtered.filter(p => p.status === activeFilter.value)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p =>
      p.payerName.toLowerCase().includes(query) ||
      p.payerEmail.toLowerCase().includes(query) ||
      p.certificateType.toLowerCase().includes(query) ||
      p.referenceNumber.toLowerCase().includes(query)
    )
  }

  return filtered
})

const totalRevenue = computed(() => {
  return payments.value
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)
})

const paidCount = computed(() => {
  return payments.value.filter(p => p.status === 'paid').length
})

const pendingCount = computed(() => {
  return payments.value.filter(p => p.status === 'pending').length
})

const monthlyRevenue = computed(() => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return payments.value
    .filter(p => p.status === 'paid' && new Date(p.createdAt) >= startOfMonth)
    .reduce((sum, p) => sum + p.amount, 0)
})

const currentMonthName = computed(() => {
  return new Date().toLocaleDateString('en-US', { month: 'long' })
})

const monthlyPaidCount = computed(() => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return payments.value.filter(p => p.status === 'paid' && new Date(p.createdAt) >= startOfMonth).length
})

const pendingAmount = computed(() => {
  return payments.value
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)
})

const failedCount = computed(() => {
  return payments.value.filter(p => p.status === 'failed').length
})

const averagePayment = computed(() => {
  const paidPayments = payments.value.filter(p => p.status === 'paid')
  if (paidPayments.length === 0) return 0
  const total = paidPayments.reduce((sum, p) => sum + p.amount, 0)
  return Math.round(total / paidPayments.length)
})

const paymentMethods = computed(() => {
  const methods = new Set(payments.value.map(p => p.paymentMethod))
  return Array.from(methods)
})

const resetForm = () => {
  formData.value = {
    certificateRequestId: '',
    payerName: '',
    payerEmail: '',
    certificateType: '',
    amount: 0,
    paymentMethod: '',
    referenceNumber: '',
    status: 'pending',
    notes: ''
  }
  formError.value = ''
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  editingPayment.value = null
  resetForm()
}

const editPayment = (payment: Payment) => {
  editingPayment.value = payment
  formData.value = {
    certificateRequestId: payment.certificateRequestId || '',
    payerName: payment.payerName,
    payerEmail: payment.payerEmail,
    certificateType: payment.certificateType,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    referenceNumber: payment.referenceNumber,
    status: payment.status,
    notes: payment.notes || ''
  }
  showEditModal.value = true
}

const confirmDeletePayment = (payment: Payment) => {
  paymentToDelete.value = payment
  showDeleteModal.value = true
}

const markAsPaid = async (payment: Payment) => {
  try {
    await certificateRequestsStore.updateRequestStatus(payment.id, {
      payment_status: 'paid',
      payment_date: new Date().toISOString()
    })
  } catch (err) {
    console.error('Error marking payment as paid:', err)
    error.value = 'Failed to update payment status'
  }
}

const handleSubmit = async () => {
  formLoading.value = true
  formError.value = ''

  try {
    if (showEditModal.value && editingPayment.value) {
      // Update existing payment in certificate request
      const result = await certificateRequestsStore.updateRequestStatus(editingPayment.value.id, {
        payment_amount: formData.value.amount,
        payment_method: formData.value.paymentMethod,
        payment_status: formData.value.status as 'pending' | 'paid' | 'failed',
        payment_date: formData.value.status === 'paid' ? new Date().toISOString() : undefined,
        notes: formData.value.notes
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update payment')
      }
    } else {
      // Record new payment for selected certificate request
      if (!formData.value.certificateRequestId) {
        formError.value = 'Please select a certificate request'
        return
      }

      const result = await certificateRequestsStore.updateRequestStatus(formData.value.certificateRequestId, {
        payment_amount: formData.value.amount,
        payment_method: formData.value.paymentMethod,
        payment_status: formData.value.status as 'pending' | 'paid' | 'failed',
        payment_date: formData.value.status === 'paid' ? new Date().toISOString() : undefined,
        notes: formData.value.notes
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to record payment')
      }
    }

    closeModal()
  } catch (err: any) {
    formError.value = err.message || 'An unexpected error occurred'
    console.error('Error submitting form:', err)
  } finally {
    formLoading.value = false
  }
}

const handleDeletePayment = async () => {
  if (!paymentToDelete.value) return

  formLoading.value = true

  try {
    // Clear payment info from the certificate request (set to null to remove)
    const result = await certificateRequestsStore.updateRequestStatus(paymentToDelete.value.id, {
      payment_status: null as any,
      payment_method: null as any,
      payment_date: null as any,
      payment_amount: null as any
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete payment')
    }

    showDeleteModal.value = false
    paymentToDelete.value = null
  } catch (err: any) {
    error.value = err.message || 'Error deleting payment'
    console.error('Error deleting payment:', err)
  } finally {
    formLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const loadPayments = async () => {
  loading.value = true
  error.value = ''

  try {
    await certificateRequestsStore.fetchRequests(undefined, true) // Force refresh
  } catch (err: any) {
    error.value = err.message || 'Failed to load payment data'
    console.error('Error loading payment data:', err)
  } finally {
    loading.value = false
  }
}

// Add visibility change listener to reload when page comes back into focus
const handleVisibilityChange = () => {
  if (!document.hidden) {
    console.log('🔄 Page became visible, reloading payments...')
    loadPayments()
  }
}

onMounted(async () => {
  // Load certificate requests which contain payment data
  await loadPayments()

  // Add visibility change listener
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

// Cleanup listener on unmount
onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.payments-view {
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
  font-size: 0.9375rem;
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

/* Search Section */
.search-filter-section {
  background: white;
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  transition: all 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input::placeholder {
  color: #9ca3af;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 1.75rem;
  height: 1.75rem;
  color: white;
}

.stat-icon-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.stat-icon-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-icon-yellow {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-icon-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.stat-card-blue .stat-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.stat-card-green .stat-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-card-yellow .stat-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-card-purple .stat-icon {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.stat-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  margin-bottom: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;
}

.stat-badge.success {
  background-color: #d1fae5;
  color: #065f46;
}

.stat-badge.info {
  background-color: #dbeafe;
  color: #1e40af;
}

.stat-badge.warning {
  background-color: #fef3c7;
  color: #92400e;
}

.stat-badge.purple {
  background-color: #ede9fe;
  color: #5b21b6;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 0.125rem;
  line-height: 1;
}

.stat-description {
  font-size: 0.8125rem;
  color: var(--gray-500);
  font-weight: 500;
}

/* Filter Tabs */
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

/* Table */
.table-container {
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid rgba(59, 130, 246, 0.1);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: var(--gray-500);
  font-size: 0.875rem;
  font-weight: 500;
}

.error-state {
  text-align: center;
  padding: 3.5rem 1.5rem;
  color: var(--danger-600);
  font-size: 0.9375rem;
  background-color: var(--danger-50);
  border-radius: 0.5rem;
  margin: 0.5rem;
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

.certificate-info {
  display: flex;
  flex-direction: column;
}

.certificate-type {
  font-weight: 500;
  color: #111827;
  margin-bottom: 0.125rem;
}

.certificate-id {
  font-size: 0.75rem;
  color: #6b7280;
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

.amount {
  font-weight: 600;
  color: #059669;
  font-size: 1rem;
}

.payment-method {
  font-size: 0.875rem;
  color: #6b7280;
  padding: 0.25rem 0.625rem;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-with-text {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.btn-with-text .btn-icon {
  width: 1rem;
  height: 1rem;
}

.btn-with-text .btn-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.text-sm {
  font-size: 0.875rem;
}

.text-gray-600 {
  color: #6b7280;
}
</style>
