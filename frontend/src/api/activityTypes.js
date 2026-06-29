import api from './client'

export const activityTypesApi = {
  list: () => api.get('/activity-types'),
  get: (id) => api.get(`/activity-types/${id}`),
  create: (payload) => api.post('/admin/activity-types', payload),
  update: (id, payload) => api.put(`/admin/activity-types/${id}`, payload),
  updateStatus: (id, active) => api.patch(`/admin/activity-types/${id}/status`, { active }),
  remove: (id) => api.delete(`/admin/activity-types/${id}`),
}
