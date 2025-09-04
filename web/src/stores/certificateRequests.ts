import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getCertificateRequests,
  createCertificateRequest,
  updateCertificateRequest,
  deleteCertificateRequest,
  type CertificateRequest
} from '../lib/supabase'

export const useCertificateRequestsStore = defineStore('certificateRequests', () => {
  const requests = ref<CertificateRequest[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchRequests = async (userId?: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await getCertificateRequests(userId)
      if (fetchError) throw fetchError
      requests.value = data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch certificate requests'
      console.error('Error fetching certificate requests:', err)
    } finally {
      loading.value = false
    }
  }

  const addRequest = async (requestData: Omit<CertificateRequest, 'id' | 'created_at' | 'updated_at'>) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await createCertificateRequest(requestData)
      if (createError) throw createError

      if (data) {
        requests.value.unshift(data)
      }

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Failed to create certificate request'
      console.error('Error creating certificate request:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateRequestStatus = async (requestId: string, updates: Partial<CertificateRequest>) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await updateCertificateRequest(requestId, updates)
      if (updateError) throw updateError

      if (data) {
        const index = requests.value.findIndex(r => r.id === requestId)
        if (index !== -1) {
          requests.value[index] = data
        }
      }

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Failed to update certificate request'
      console.error('Error updating certificate request:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const removeRequest = async (requestId: string) => {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await deleteCertificateRequest(requestId)
      if (deleteError) throw deleteError

      requests.value = requests.value.filter(r => r.id !== requestId)
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Failed to delete certificate request'
      console.error('Error deleting certificate request:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    requests,
    loading,
    error,
    fetchRequests,
    addRequest,
    updateRequestStatus,
    removeRequest,
  }
})
