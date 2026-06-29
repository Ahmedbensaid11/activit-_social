import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const authStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,

      setUser: (user) => set({ user }),
      setSession: ({ accessToken, refreshToken, user }) => set({
        accessToken,
        refreshToken,
        user,
        isAuthenticated: Boolean(accessToken),
      }),
      setTokens: (accessToken, refreshToken) => set({ 
        accessToken, 
        refreshToken,
        isAuthenticated: true 
      }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ 
        user: null, 
        accessToken: null, 
        refreshToken: null,
        isAuthenticated: false 
      }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
