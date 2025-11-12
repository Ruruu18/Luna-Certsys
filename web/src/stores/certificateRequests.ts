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
  const lastFetch = ref<number>(0)
  const CACHE_TIME = 5000 // 5 seconds cache
  let fetchTimeout: ReturnType<typeof setTimeout> | null = null

  const fetchRequests = async (userId?: string, forceRefresh = false) => {
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
      console.log('⏳ Already fetching requests, skipping duplicate request')
      return
    }

    // Prevent duplicate fetches within 5 seconds (only if we have data)
    const now = Date.now()
    if (!forceRefresh && requests.value.length > 0 && (now - lastFetch.value) < CACHE_TIME) {
      console.log('⚡ Using cached requests data (' + requests.value.length + ' requests)')
      return
    }

    loading.value = true
    error.value = null
    lastFetch.value = Date.now() // Mark fetch start time

    // ✅ Safety timeout - 30 seconds for cold starts (Supabase free tier wakeup)
    fetchTimeout = setTimeout(() => {
      if (loading.value) {
        console.error('❌ [REQUESTS] Timeout after 30s - database may be sleeping or connection issue')
        loading.value = false
        error.value = 'Database timeout (30s). Your Supabase project may be sleeping. Please refresh the page.'
        fetchTimeout = null
      }
    }, 30000) // 30s for cold starts

    try {
      console.log('📡 Fetching certificate requests...')
      const startTime = Date.now()

      const { data, error: fetchError } = await getCertificateRequests(userId)

      const endTime = Date.now()
      console.log(`⏱️ Fetch completed in ${endTime - startTime}ms`)

      if (fetchError) {
        console.error('❌ Supabase error:', fetchError)
        console.error('Error details:', {
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
          error.value = fetchError.message || 'Failed to fetch certificate requests'
        }

        throw fetchError
      }

      console.log('✅ Fetched requests:', data?.length || 0)
      requests.value = data || []
      lastFetch.value = Date.now()
      error.value = null // Clear any previous errors on success
    } catch (err: any) {
      // Only set error if it wasn't already set above
      if (!error.value) {
        error.value = err.message || 'Failed to fetch certificate requests'
      }
      console.error('Error fetching certificate requests:', err)
    } finally {
      if (fetchTimeout) {
        clearTimeout(fetchTimeout)
        fetchTimeout = null
      }
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
      console.log('📱 [STORE] Updating certificate request:', requestId, updates)
      const { data, error: updateError } = await updateCertificateRequest(requestId, updates)

      if (updateError) {
        console.error('❌ [STORE] Update error:', updateError)
        throw updateError
      }

      if (data) {
        console.log('✅ [STORE] Update successful, updating local state')
        const index = requests.value.findIndex(r => r.id === requestId)
        if (index !== -1 && data) {
          // Preserve the users relation from the existing data
          requests.value[index] = {
            ...(data as any),
            users: requests.value[index].users
          }
          console.log('✅ [STORE] Local state updated')
        } else {
          console.warn('⚠️ [STORE] Request not found in local state')
        }
      }

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Failed to update certificate request'
      console.error('❌ [STORE] Error updating certificate request:', err)
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
