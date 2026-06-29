import api from './client'

export const usersApi = {
  getProfile: () => api.get('/users/me'),

  updateProfile: (data) => api.patch('/users/me', data),

  uploadPhoto: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/users/me/photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deletePhoto: () => api.delete('/users/me/photo'),

  changePassword: (data) => api.post('/auth/change-password', data),
}
