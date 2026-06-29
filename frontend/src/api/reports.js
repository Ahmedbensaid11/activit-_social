import api from './client'

const buildParams = ({ type, dateDebut, dateFin, status }) => {
  const p = {}
  if (type)      p.type      = type
  if (dateDebut) p.dateDebut = dateDebut
  if (dateFin)   p.dateFin   = dateFin
  if (status)    p.status    = status
  return p
}

/** Trigger a file download from a blob response */
const downloadBlob = (data, filename, mimeType) => {
  const blob = new Blob([data], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const reportsApi = {
  downloadPdf: async (filters) => {
    const res = await api.get('/reports/pdf', {
      params: buildParams(filters),
      responseType: 'arraybuffer',
    })
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    downloadBlob(res, `rapport-${filters.type?.toLowerCase() ?? 'social'}-${date}.pdf`, 'application/pdf')
  },

  downloadExcel: async (filters) => {
    const res = await api.get('/reports/excel', {
      params: buildParams(filters),
      responseType: 'arraybuffer',
    })
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    downloadBlob(
      res,
      `rapport-social-${date}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
  },
}
