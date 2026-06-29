import api from './client'

export const ticketsApi = {
  // ── Employee ──────────────────────────────────────────────────────────
  submit:       (data)         => api.post('/tickets', data),
  myTickets:    (params = {})  => api.get('/tickets/me', { params }),
  checkQuota:   ()             => api.get('/tickets/me/quota'),
  uploadDoc:    (file)         => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/uploads/ticket-document', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // ── Admin ─────────────────────────────────────────────────────────────
  adminList:    (params = {})  => api.get('/tickets', { params }),
  pendingCount: ()             => api.get('/tickets/pending-count'),
  approve:      (id)           => api.patch(`/tickets/${id}/approve`),
  reject:       (id, motifRejet) => api.patch(`/tickets/${id}/reject`, { motifRejet }),
  delete:       (id)           => api.delete(`/tickets/${id}`),
}
