<template>
  <div class="reports-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Reports & Analytics</h1>
        <p class="page-description">
          Generate comprehensive reports to analyze system performance and user data
        </p>
      </div>
    </div>

    <!-- Date Range Selector -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Select Date Range</h2>
      </div>
      <div class="card-body">
        <div class="date-range-selector">
          <div class="date-input-group">
            <label for="start-date">Start Date</label>
            <input
              id="start-date"
              v-model="startDate"
              type="date"
              class="date-input"
            />
          </div>
          <div class="date-input-group">
            <label for="end-date">End Date</label>
            <input
              id="end-date"
              v-model="endDate"
              type="date"
              class="date-input"
              :max="todayDate"
            />
          </div>
        </div>

        <div class="date-presets">
          <button @click="setDateRange(7)" class="preset-btn">Last 7 Days</button>
          <button @click="setDateRange(30)" class="preset-btn">Last 30 Days</button>
          <button @click="setDateRange(90)" class="preset-btn">Last 3 Months</button>
          <button @click="setDateRange(365)" class="preset-btn">Last Year</button>
        </div>
      </div>
    </div>

    <!-- Available Reports -->
    <div class="reports-grid">
      <!-- Summary Report -->
      <div class="report-card">
        <div class="report-icon summary">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div class="report-content">
          <h3 class="report-title">Summary Report</h3>
          <p class="report-description">
            Overview of all certificate requests with statistics, trends, and analytics
          </p>
          <div class="report-meta">
            <span class="date-range-badge">{{ formatDateRange() }}</span>
          </div>
        </div>
        <button
          @click="downloadReport('summary')"
          :disabled="loading"
          class="download-btn"
        >
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </button>
      </div>

      <!-- Detailed Report -->
      <div class="report-card">
        <div class="report-icon detailed">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div class="report-content">
          <h3 class="report-title">Detailed Requests Report</h3>
          <p class="report-description">
            Complete list of all certificate requests with full details and status
          </p>
          <div class="report-meta">
            <span class="date-range-badge">{{ formatDateRange() }}</span>
          </div>
        </div>
        <button
          @click="downloadReport('detailed')"
          :disabled="loading"
          class="download-btn"
        >
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </button>
      </div>

      <!-- Users Report -->
      <div class="report-card">
        <div class="report-icon users">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div class="report-content">
          <h3 class="report-title">Registered Users Report</h3>
          <p class="report-description">
            Complete list of all registered users in the system with their details
          </p>
          <div class="report-meta">
            <span class="date-range-badge">All time</span>
          </div>
        </div>
        <button
          @click="downloadReport('users')"
          :disabled="loading"
          class="download-btn"
        >
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </button>
      </div>

      <!-- Payments Report -->
      <div class="report-card">
        <div class="report-icon payments">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div class="report-content">
          <h3 class="report-title">Payments & Revenue Report</h3>
          <p class="report-description">
            Detailed financial report showing all payments, revenue, and transaction history
          </p>
          <div class="report-meta">
            <span class="date-range-badge">{{ formatDateRange() }}</span>
          </div>
        </div>
        <button
          @click="downloadReport('payments')"
          :disabled="loading"
          class="download-btn"
        >
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </button>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p class="loading-text">Generating report...</p>
        <p class="loading-subtext">This may take a few moments</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useReportsStore } from '../stores/reports'

const reportsStore = useReportsStore()

const startDate = ref('')
const endDate = ref('')
const loading = ref(false)

const todayDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Initialize dates
const initializeDates = () => {
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 30)

  endDate.value = today.toISOString().split('T')[0]
  startDate.value = thirtyDaysAgo.toISOString().split('T')[0]
}

initializeDates()

const setDateRange = (days: number) => {
  const today = new Date()
  const startDay = new Date()
  startDay.setDate(today.getDate() - days)

  endDate.value = today.toISOString().split('T')[0]
  startDate.value = startDay.toISOString().split('T')[0]
}

const formatDateRange = () => {
  if (!startDate.value || !endDate.value) return 'Select date range'

  const start = new Date(startDate.value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  const end = new Date(endDate.value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return `${start} - ${end}`
}

const downloadReport = async (type: 'summary' | 'detailed' | 'users' | 'payments') => {
  try {
    loading.value = true
    await reportsStore.downloadReport(type, startDate.value, endDate.value)
  } catch (error) {
    console.error('Error downloading report:', error)
    alert('Failed to generate report. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reports-view {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.page-description {
  color: #64748b;
  font-size: 1rem;
}

.card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.card-body {
  padding: 1.5rem;
}

.date-range-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-input-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

.date-input {
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.date-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-presets {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.report-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.report-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.report-icon {
  width: 60px;
  height: 60px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.report-icon svg {
  width: 32px;
  height: 32px;
  color: white;
}

.report-icon.summary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.report-icon.detailed {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.report-icon.users {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.report-icon.payments {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.report-content {
  flex: 1;
}

.report-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.report-description {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.report-meta {
  margin-top: 0.5rem;
}

.date-range-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: #f1f5f9;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #475569;
}

.download-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.download-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.download-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  background: white;
  padding: 2.5rem;
  border-radius: 1rem;
  text-align: center;
  min-width: 300px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.loading-subtext {
  font-size: 0.875rem;
  color: #64748b;
}

@media (max-width: 1024px) {
  .reports-grid {
    grid-template-columns: 1fr;
  }
}
</style>
