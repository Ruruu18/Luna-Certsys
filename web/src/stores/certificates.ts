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
  const lastFetch = ref<number>(0)
  const CACHE_TIME = 5000 // 5 seconds cache
  let fetchTimeout: ReturnType<typeof setTimeout> | null = null

  const fetchCertificates = async (userId?: string, forceRefresh = false) => {
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
      console.log('⏳ Already fetching certificates, skipping duplicate request')
      return
    }

    // Prevent duplicate fetches within 5 seconds (only if we have data)
    const now = Date.now()
    if (!forceRefresh && lastFetch.value > 0 && (now - lastFetch.value) < CACHE_TIME && certificates.value.length > 0) {
      console.log('⚡ Using cached certificates data (' + certificates.value.length + ' items)')
      return
    }

    loading.value = true
    error.value = null
    lastFetch.value = Date.now() // Mark fetch start time

    // ✅ Safety timeout - 30 seconds for cold starts (Supabase free tier wakeup)
    fetchTimeout = setTimeout(() => {
      if (loading.value) {
        console.error('❌ [CERTIFICATES] Timeout after 30s - database may be sleeping or connection issue')
        loading.value = false
        error.value = 'Database timeout (30s). Your Supabase project may be sleeping. Please refresh the page.'
        fetchTimeout = null
      }
    }, 30000) // 30s for cold starts

    try {
      console.log('📡 [CERTIFICATES] Starting fetch...')
      console.log('📡 [CERTIFICATES] User ID filter:', userId || 'none (fetching all)')
      const startTime = Date.now()

      const { data, error: fetchError } = await getCertificates(userId)

      const endTime = Date.now()
      const duration = endTime - startTime
      console.log(`⏱️ [CERTIFICATES] Fetch completed in ${duration}ms`)

      if (duration > 3000) {
        console.warn(`⚠️ [CERTIFICATES] Slow query: ${duration}ms - consider adding database indexes`)
      }

      if (fetchError) {
        console.error('❌ [CERTIFICATES] Supabase error:', fetchError)
        console.error('❌ [CERTIFICATES] Error details:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        })

        // Provide helpful error messages based on error type
        if (fetchError.message?.includes('RLS')) {
          error.value = 'Permission denied. Please make sure you are logged in.'
        } else if (fetchError.message?.includes('JWT')) {
          error.value = 'Session expired. Please log out and log back in.'
        } else if (fetchError.message?.includes('network')) {
          error.value = 'Network error. Please check your internet connection.'
        } else {
          error.value = fetchError.message || 'Failed to fetch certificates'
        }

        throw fetchError
      }

      console.log('✅ [CERTIFICATES] Fetched:', data?.length || 0, 'records')
      certificates.value = data || []
      lastFetch.value = Date.now()
      error.value = null // Clear any previous errors on success
    } catch (err: any) {
      // Only set error if it wasn't already set above
      if (!error.value) {
        error.value = err.message || 'Failed to fetch certificates'
      }
      console.error('❌ [CERTIFICATES] Error fetching:', err)
    } finally {
      if (fetchTimeout) {
        clearTimeout(fetchTimeout)
        fetchTimeout = null
      }
      loading.value = false
      console.log('🏁 [CERTIFICATES] Fetch cycle complete')
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
      console.log('📝 [STORE] Updating certificate:', certificateId, updates)
      const { data, error: updateError } = await updateCertificate(certificateId, updates)

      if (updateError) {
        console.error('❌ [STORE] Update error:', updateError)
        throw updateError
      }

      if (data) {
        console.log('✅ [STORE] Update successful, updating local state')
        const index = certificates.value.findIndex(c => c.id === certificateId)
        if (index !== -1 && data) {
          // Preserve the users relation from the existing data
          certificates.value[index] = {
            ...(data as any),
            users: certificates.value[index].users
          }
          console.log('✅ [STORE] Local state updated')
        } else {
          console.warn('⚠️ [STORE] Certificate not found in local state')
        }
      }

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Failed to update certificate'
      console.error('❌ [STORE] Error updating certificate:', err)
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
