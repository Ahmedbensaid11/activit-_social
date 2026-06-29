import api from './client'

export const notificationsApi = {
  me:        (params = {}) => api.get('/notifications/me', { params }),
  markRead:  (id)          => api.patch(`/notifications/${id}/read`),
  markAll:   ()            => api.patch('/notifications/read-all'),
  broadcast: (data)        => api.post('/notifications/broadcast', data),
}
