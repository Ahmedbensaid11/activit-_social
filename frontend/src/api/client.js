import axios from 'axios'
import { authStore } from '../stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
})

/**
 * Build a minimal user object from an auth response.
 * allPermissions will be populated separately via fetchAndAttachPermissions.
 */
const buildUserFromAuthResponse = (data) => ({
  id: data.id,
  matricule: data.matricule,
  nom: data.nom,
  prenom: data.prenom,
  email: data.email,
  telephone: data.telephone,
  role: data.role,
  photoUrl: data.photoUrl,
  allPermissions: data.allPermissions || [],
})

/**
 * After login/refresh, fetch the user's custom-role permissions from
 * GET /admin/users/:id and merge allPermissions into the stored user.
 * Only called for PERSONNEL accounts (ADMIN already has full access).
 */
async function fetchAndAttachPermissions(userId, token) {
  if (!userId || !token) return
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL || '/api'}/admin/users/${userId}`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
    )
    const data = res.data
    const perms = data.allPermissions || []
    const customRoles = data.customRoles || []
    authStore.setState(state => ({
      user: state.user
        ? { ...state.user, allPermissions: perms, customRoles }
        : state.user,
    }))
  } catch {
    // non-admin users can't hit /admin/users — that's fine, permissions stay []
  }
}

let refreshRequest = null

api.interceptors.request.use(
  (config) => {
    const token = authStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const { refreshToken, logout, setSession } = authStore.getState()

      if (!refreshToken) {
        logout()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        if (!refreshRequest) {
          refreshRequest = axios
            .post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken }, { timeout: 30000 })
            .finally(() => {
              refreshRequest = null
            })
        }

        const { data } = await refreshRequest
        const user = buildUserFromAuthResponse(data)
        setSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user,
        })

        // Re-fetch permissions after token refresh
        if (user.role !== 'ADMIN') {
          fetchAndAttachPermissions(user.id, data.accessToken)
        }

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export { buildUserFromAuthResponse, fetchAndAttachPermissions }
export default api