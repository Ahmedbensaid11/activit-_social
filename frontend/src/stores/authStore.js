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

// ── Permission helpers ────────────────────────────────────────────────────

/**
 * Returns true if the current user is ADMIN OR has the given permission code
 * among their custom roles.
 */
export function hasPermission(user, permissionCode) {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  const perms = user.allPermissions || []
  return perms.includes(permissionCode)
}

/**
 * Returns true if the current user has ANY of the given permission codes.
 */
export function hasAnyPermission(user, ...codes) {
  return codes.some(code => hasPermission(user, code))
}