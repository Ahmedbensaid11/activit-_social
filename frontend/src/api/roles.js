import api from './client'

export const rolesApi = {
  list:        ()        => api.get('/admin/roles'),
  get:         (id)      => api.get(`/admin/roles/${id}`),
  permissions: ()        => api.get('/admin/roles/permissions'),
  create:      (payload) => api.post('/admin/roles', payload),
  update:      (id, payload) => api.put(`/admin/roles/${id}`, payload),
  remove:      (id)      => api.delete(`/admin/roles/${id}`),
}