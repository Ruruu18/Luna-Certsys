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
        return { userProfile: null, error: new Error('No auth user email found') }
      }

      // Try database lookup for current user by id (RLS-friendly)
      try {
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        console.log('Database profile query result:', { userProfile, error })

        if (error) {
          // If no profile row exists, attempt to create a minimal one
          if (error.code === 'PGRST116' || error.message?.toLowerCase()?.includes('row') || error.details?.toLowerCase()?.includes('0 rows')) {
            console.warn('No profile found, attempting to create a minimal profile...')

            const fullName = (authUser?.user_metadata as any)?.full_name
              || [
                   (authUser?.user_metadata as any)?.first_name,
                   (authUser?.user_metadata as any)?.last_name
                 ].filter(Boolean).join(' ')
              || (authUser?.email?.split('@')[0] || 'User')

            const role = (authUser?.user_metadata as any)?.role || 'resident'

            const { data: created, error: insertError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: authUser.email,
                full_name: fullName,
                first_name: (authUser?.user_metadata as any)?.first_name || null,
                last_name: (authUser?.user_metadata as any)?.last_name || null,
                role,
                face_verified: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as any)
              .select('*')
              .single()

            if (insertError) {
              console.error('Failed to auto-create profile:', insertError)
              user.value = null
              return { userProfile: null, error: insertError }
            } else {
              console.log('Minimal profile created successfully')
              user.value = created as any
              return { userProfile: created as any, error: null }
            }
          } else {
            console.error('Profile lookup failed:', error)
            user.value = null
            return { userProfile: null, error }
          }
        } else {
          user.value = userProfile
          console.log('Successfully loaded profile from database')
          return { userProfile, error: null }
        }
      } catch (error) {
        console.error('Exception loading profile:', error)
        user.value = null
        return { userProfile: null, error }
      }

    } catch (error) {
      console.error('Exception in loadUserProfile:', error)
      user.value = null
      return { userProfile: null, error }
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
