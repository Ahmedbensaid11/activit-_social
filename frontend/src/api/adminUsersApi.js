import api from 'axios'

export const listUsers = (params) =>
  api.get('/api/admin/users', {
    params,
  })

export const getUser = (id) =>
  api.get(`/api/admin/users/${id}`)

export const createUser = (data) =>
  api.post(
    '/api/admin/users',
    data
  )

export const updateUser = (
  id,
  data
) =>
  api.put(
    `/api/admin/users/${id}`,
    data
  )

export const deleteUser = (
  id
) =>
  api.delete(
    `/api/admin/users/${id}`
  )

export const toggleUser = (
  id,
  active
) =>
  api.patch(
    `/api/admin/users/${id}/toggle-active`,
    {
      active,
    }
  )