import api from './client'

export const activitiesApi = {
  list: (params = {}) => api.get('/activities', { params }),
  get: (id) => api.get(`/activities/${id}`),
  create: (payload) => api.post('/admin/activities', payload),
  update: (id, payload) => api.put(`/admin/activities/${id}`, payload),
  updateStatus: (id, status) => api.patch(`/admin/activities/${id}/status`, { status }),
  remove: (id) => api.delete(`/admin/activities/${id}`),
  uploadPhoto: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/admin/uploads/activity-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
