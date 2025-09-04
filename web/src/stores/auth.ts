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

      // For admin users, create a temporary profile if database is having issues
      if (authUser.email === 'admin@resare.com') {
        console.log('Admin user detected, creating temporary profile...')
        user.value = {
          id: userId,
          email: authUser.email,
          full_name: 'System Administrator',
          role: 'admin' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Try to load from database, but don't fail if it doesn't work
        try {
          const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email)
            .single()

          console.log('Database profile query result:', { userProfile, error })

          if (userProfile && !error) {
            user.value = userProfile
            console.log('Successfully loaded profile from database')
          } else {
            console.log('Using temporary admin profile (database issue)')
          }
        } catch (dbError) {
          console.warn('Database query failed, using temporary profile:', dbError)
        }
      } else {
        // For non-admin users, try database lookup
        try {
          const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email)
            .single()

          if (error) {
            console.error('Profile lookup failed for non-admin user:', error)
            user.value = null
          } else {
            user.value = userProfile
          }
        } catch (error) {
          console.error('Exception loading non-admin profile:', error)
          user.value = null
        }
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

  return {
    user,
    session,
    loading,
    isAuthenticated,
    isAdmin,
    initialize,
    signIn,
    signOut,
  }
})
