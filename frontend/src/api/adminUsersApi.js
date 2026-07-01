import api from './client'

export const adminUsersApi = {
  list:   (params = {}) => api.get('/admin/users', { params }),
  get:    (id)          => api.get(`/admin/users/${id}`),
  create: (data)        => api.post('/admin/users', data),
  update: (id, data)    => api.put(`/admin/users/${id}`, data),
  delete: (id)          => api.delete(`/admin/users/${id}`),
  toggle: (id, active)  => api.patch(`/admin/users/${id}/toggle-active`, { active }),
}