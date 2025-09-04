import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  type Certificate
} from '../lib/supabase'

export const useCertificatesStore = defineStore('certificates', () => {
  const certificates = ref<Certificate[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCertificates = async (userId?: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await getCertificates(userId)
      if (fetchError) throw fetchError
      certificates.value = data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch certificates'
      console.error('Error fetching certificates:', err)
    } finally {
      loading.value = false
    }
  }

  const addCertificate = async (certificateData: Omit<Certificate, 'id' | 'requested_at'>) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await createCertificate(certificateData)
      if (createError) throw createError

      if (data) {
        certificates.value.unshift(data)
      }

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Failed to create certificate'
      console.error('Error creating certificate:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateCertificateStatus = async (certificateId: string, updates: Partial<Certificate>) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await updateCertificate(certificateId, updates)
      if (updateError) throw updateError

      if (data) {
        const index = certificates.value.findIndex(c => c.id === certificateId)
        if (index !== -1) {
          certificates.value[index] = data
        }
      }

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Failed to update certificate'
      console.error('Error updating certificate:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const removeCertificate = async (certificateId: string) => {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await deleteCertificate(certificateId)
      if (deleteError) throw deleteError

      certificates.value = certificates.value.filter(c => c.id !== certificateId)
      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Failed to delete certificate'
      console.error('Error deleting certificate:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    certificates,
    loading,
    error,
    fetchCertificates,
    addCertificate,
    updateCertificateStatus,
    removeCertificate,
  }
})
