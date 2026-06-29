import axios from 'axios'
import { authStore } from '../stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
})

const buildUserFromAuthResponse = (data) => ({
  id: data.id,
  matricule: data.matricule,
  nom: data.nom,
  prenom: data.prenom,
  email: data.email,
  telephone: data.telephone,
  role: data.role,
  photoUrl: data.photoUrl,
})

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
        setSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: buildUserFromAuthResponse(data),
        })

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

export { buildUserFromAuthResponse }
export default api
