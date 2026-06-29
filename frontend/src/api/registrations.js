import api from './client'

export const registrationsApi = {
  register: (activityId, extraData = {}) => api.post(`/activities/${activityId}/register`, { extraData }),
  cancel: (activityId) => api.delete(`/activities/${activityId}/register`),
  mine: (params = {}) => api.get('/activities/registrations/me', { params }),
  forActivity: (activityId, params = {}) => api.get(`/activities/${activityId}/registrations`, { params }),
  adminList: (params = {}) => api.get('/admin/registrations', { params }),
  approve: (id) => api.patch(`/admin/registrations/${id}/approve`),
  reject: (id, motifRejet) => api.patch(`/admin/registrations/${id}/reject`, { motifRejet }),
  validateQr: (qrContent) => api.post('/admin/registrations/validate-qr', { qrContent }),
  qrCodeUrl: (id) => `${api.defaults.baseURL}/registrations/${id}/qrcode`,
  qrCodeBlob: (id) => api.get(`/registrations/${id}/qrcode`, { responseType: 'blob' }),
  ticketBlob: (id) => api.get(`/registrations/${id}/ticket`, { responseType: 'blob' }),
}
