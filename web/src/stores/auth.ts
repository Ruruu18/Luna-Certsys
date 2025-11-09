import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type User } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!session.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const initialize = async () => {
    try {
      loading.value = true

      // Get initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      session.value = initialSession

      if (initialSession?.user) {
        await loadUserProfile(initialSession.user.id)
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        console.log('Auth state changed:', event, newSession)
        
        // Handle specific auth events
        if (event === 'TOKEN_REFRESHED') {
          console.log('✅ Token refreshed successfully')
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          user.value = null
          session.value = null
          return
        }
        
        session.value = newSession
        if (newSession?.user) {
          await loadUserProfile(newSession.user.id)
        } else {
          user.value = null
        }
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      loading.value = false
    }
  }

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading user profile for ID:', userId)

      const { data: { user: authUser } } = await supabase.auth.getUser()
      console.log('Auth user:', authUser)

      if (!authUser?.email) {
        console.error('No auth user email found')
        user.value = null
        return
      }

      // Try database lookup for all users
      try {
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single()

        console.log('Database profile query result:', { userProfile, error })

        if (error) {
          console.error('Profile lookup failed:', error)
          user.value = null
        } else {
          user.value = userProfile
          console.log('Successfully loaded profile from database')
        }
      } catch (error) {
        console.error('Exception loading profile:', error)
        user.value = null
      }

    } catch (error) {
      console.error('Exception in loadUserProfile:', error)
      user.value = null
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error && data.session?.user) {
      await loadUserProfile(data.session.user.id)
    }

    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      user.value = null
      session.value = null
    }
    return { error }
  }

  const handleAuthError = async (error: any) => {
    console.log('Handling auth error:', error)
    
    // Check if it's a refresh token error
    if (error?.message?.includes('refresh') || 
        error?.message?.includes('Invalid Refresh Token') ||
        error?.message?.includes('Refresh Token Not Found')) {
      console.log('🔄 Refresh token error detected, forcing logout...')
      
      // Force a clean logout to clear corrupted session
      try {
        await supabase.auth.signOut()
        user.value = null
        session.value = null
        console.log('✅ Forced logout completed')
      } catch (logoutError) {
        console.error('Error during forced logout:', logoutError)
        // Even if logout fails, clear local state
        user.value = null
        session.value = null
      }
      
      return { shouldReauth: true }
    }
    
    return { shouldReauth: false }
  }

  return {
    user,
    session,
    loading,
    isAuthenticated,
    isAdmin,
    initialize,
    signIn,
    signOut,
    handleAuthError
  }
})
