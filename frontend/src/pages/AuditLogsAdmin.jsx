import React, { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  FileSpreadsheet, Search, Clock, ShieldAlert,
  ChevronLeft, ChevronRight, RefreshCcw, ChevronDown,
} from 'lucide-react'
import { auditApi } from '../api/audit'

/* ── helpers ──────────────────────────────────────────────────── */
const ACTION_BADGES = {
  // Auth
  LOGIN:                  'bg-blue-100 text-blue-800',
  LOGIN_FAILED:           'bg-red-100 text-red-800',
  REGISTER:               'bg-teal-100 text-teal-800',
  LOGOUT:                 'bg-slate-100 text-slate-800',
  // Registration
  REGISTRATION_CREATE:    'bg-purple-100 text-purple-800',
  REGISTRATION_APPROVE:   'bg-green-100 text-green-800',
  REGISTRATION_REJECT:    'bg-rose-100 text-rose-800',
  REGISTRATION_QR_VALIDATED: 'bg-emerald-100 text-emerald-800',
  // Tickets
  TICKET_CREATE:          'bg-indigo-100 text-indigo-800',
  TICKET_APPROVE:         'bg-green-100 text-green-800',
  TICKET_REJECT:          'bg-rose-100 text-rose-800',
  TICKET_DELETE:          'bg-gray-100 text-gray-800',
}

const fmtDate = (v) =>
  v ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : '—'

/* ─────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────── */
export default function AuditLogsAdmin() {
  const [logs,       setLogs]       = useState([])
  const [page,       setPage]       = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading,    setLoading]    = useState(true)

  // Filters
  const [action,      setAction]      = useState('')
  const [performedBy, setPerformedBy] = useState('')
  const [dateDebut,   setDateDebut]   = useState('')
  const [dateFin,     setDateFin]     = useState('')

  const load = useCallback((p = 0) => {
    setLoading(true)
    const params = { page: p, size: 20 }
    if (action)      params.action      = action
    if (performedBy) params.performedBy = performedBy.trim()
    if (dateDebut)   params.dateDebut   = dateDebut
    if (dateFin)     params.dateFin     = dateFin

    auditApi.list(params)
      .then(res => {
        // Axios client returns response.data directly.
        setLogs(res.content || [])
        setTotalPages(res.totalPages || 0)
        setPage(res.number || 0)
      })
      .catch(() => toast.error('Impossible de charger le journal d\'audit'))
      .finally(() => setLoading(false))
  }, [action, performedBy, dateDebut, dateFin])

  useEffect(() => { load(0) }, [load])

  const clearFilters = () => {
    setAction('')
    setPerformedBy('')
    setDateDebut('')
    setDateFin('')
  }

  // Export to CSV client-side helper
  const exportCsv = () => {
    if (logs.length === 0) {
      toast.error('Aucune donnée à exporter.')
      return
    }

    const headers = ['Timestamp', 'Action', 'Performed By', 'IP Address', 'Target Entity', 'Target ID', 'Details']
    const csvRows = [headers.join(',')]

    for (const log of logs) {
      // Stringify details object nicely
      const detailStr = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : ''
      const row = [
        log.timestamp,
        log.action,
        log.performedBy,
        log.ipAddress,
        log.targetEntity || '',
        log.targetId     || '',
        `"${detailStr}"`,
      ]
      csvRows.push(row.join(','))
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `journal-audit-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Journal exporté au format CSV !')
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Administration</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-blue-600" /> Journal d'audit
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Historique complet des actions stocké de manière sécurisée dans MongoDB.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => exportCsv()} id="btn-export-csv"
              className="flex items-center gap-2 text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition-colors font-medium">
              <FileSpreadsheet className="w-4 h-4 text-green-600" /> Exporter CSV
            </button>
            <button onClick={() => load(0)} id="btn-refresh-audit"
              className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl transition-colors">
              <RefreshCcw className="w-4 h-4" /> Actualiser
            </button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl border shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Email search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="filter-performedBy"
                type="text"
                placeholder="Filtrer par email/auteur…"
                value={performedBy}
                onChange={e => setPerformedBy(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action */}
            <div className="relative">
              <select id="filter-action" value={action} onChange={e => setAction(e.target.value)}
                className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Toutes les actions</option>
                {Object.keys(ACTION_BADGES).map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            {/* Date debut */}
            <input
              id="filter-dateDebut"
              type="date"
              value={dateDebut}
              onChange={e => setDateDebut(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Date fin */}
            <div className="flex gap-2">
              <input
                id="filter-dateFin"
                type="date"
                value={dateFin}
                onChange={e => setDateFin(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                Effacer
              </button>
            </div>

          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20 text-slate-400 text-sm gap-2">
              <RefreshCcw className="w-5 h-5 animate-spin" /> Chargement…
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Clock className="w-12 h-12 text-slate-200" />
              <p className="text-sm">Aucun log d'audit trouvé.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                    <th className="px-6 py-3 text-left font-semibold">Horodatage</th>
                    <th className="px-4 py-3 text-left font-semibold">Action</th>
                    <th className="px-4 py-3 text-left font-semibold">Utilisateur</th>
                    <th className="px-4 py-3 text-left font-semibold">Adresse IP</th>
                    <th className="px-4 py-3 text-left font-semibold">Entité</th>
                    <th className="px-4 py-3 text-left font-semibold">ID Cible</th>
                    <th className="px-6 py-3 text-left font-semibold">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const badgeCls = ACTION_BADGES[log.action] || 'bg-slate-100 text-slate-800'
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          {fmtDate(log.timestamp)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${badgeCls}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-900 text-xs">
                          {log.performedBy}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-slate-500 text-xs font-mono">
                          {log.ipAddress}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-slate-600 text-xs">
                          {log.targetEntity || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-slate-800 text-xs font-mono font-bold">
                          {log.targetId || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 font-mono break-all max-w-sm">
                          {log.details ? (
                            <pre className="whitespace-pre-wrap font-sans">
                              {typeof log.details === 'string'
                                ? log.details
                                : (log.details.message || JSON.stringify(log.details))}
                            </pre>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button onClick={() => load(page - 1)} disabled={page === 0}
              className="flex items-center gap-1 text-sm text-slate-600 disabled:opacity-30 hover:text-slate-900 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
            <span className="text-sm text-slate-500">Page {page + 1} / {totalPages}</span>
            <button onClick={() => load(page + 1)} disabled={page >= totalPages - 1}
              className="flex items-center gap-1 text-sm text-slate-600 disabled:opacity-30 hover:text-slate-900 transition-colors">
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
