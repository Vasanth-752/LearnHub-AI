import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../services/supabase'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      initialized: false,

      setSession: (session) => {
        set({ session, user: session?.user ?? null, loading: false, initialized: true })
      },

      setUser: (user) => {
        set({ user })
      },

      setLoading: (loading) => {
        set({ loading })
      },

      syncProfile: async (session) => {
        if (!session?.user) return
        try {
          await api.post('/auth/sync', {
            user_id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || '',
            avatar_url: session.user.user_metadata?.avatar_url || null,
          })
        } catch (error) {
          console.warn('Profile sync failed (non-critical):', error)
        }
      },

      login: async (email, password) => {
        set({ loading: true })
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // Sync profile with backend
        await get().syncProfile(data)
        return data
      },

      register: async (email, password) => {
        set({ loading: true })
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // Sync profile with backend (if session exists)
        if (data.session) {
          await get().syncProfile(data)
        }
        return data
      },

      loginWithOAuth: async (provider) => {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        return data
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null })
      },

      initializeAuth: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        set({ session, user: session?.user ?? null, loading: false, initialized: true })

        supabase.auth.onAuthStateChange((_event, session) => {
          set({ session, user: session?.user ?? null, loading: false })
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
)

// Alias for components that import useAuth
export const useAuth = useAuthStore