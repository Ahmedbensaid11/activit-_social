import api from './client'

export const dashboardApi = {
  stats:   () => api.get('/dashboard/stats'),
  charts:  () => api.get('/dashboard/charts'),
  pending: () => api.get('/dashboard/pending'),
}
