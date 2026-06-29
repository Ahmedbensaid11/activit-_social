import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  CheckCircle2, XCircle, Clock, Trash2, ChevronLeft, ChevronRight,
  FileDown, Search, ChevronDown, Loader2, CreditCard, Ban, Trash
} from 'lucide-react'
import { ticketsApi } from '../api/tickets'

const STATUS_CONFIG = {
  PENDING:  { labelKey: 'status_pending',  cls: 'bg-amber-100 text-amber-700 border border-amber-200',   Icon: Clock },
  APPROVED: { labelKey: 'status_approved', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200', Icon: CheckCircle2 },
  REJECTED: { labelKey: 'status_rejected', cls: 'bg-red-100 text-red-700 border border-red-200',          Icon: XCircle },
}

const TYPE_CONFIG = {
  RESTAURANT: 'Restaurant',
  CARBURANT: 'Carburant',
  CADEAU: 'Cadeau'
}

const fmtDate = (v) => v ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(v)) : '—'

const MONTHS_KEYS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
]

function RejectModal({ ticket, onConfirm, onCancel, loading, t }) {
  const [motif, setMotif] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md p-6 space-y-4">
        <div>
          <h3 className="text-lg font-black text-slate-900">{t('adm_tickets_reject_modal')}</h3>
          <p className="text-xs text-slate-500 mt-1">
            <strong>{ticket?.userFullName}</strong> — {ticket?.nom}
          </p>
        </div>
        <textarea
          rows={4} value={motif} onChange={e => setMotif(e.target.value)}
          placeholder={t('adm_tickets_reject_placeholder')}
          className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-slate-200 text-slate-700 text-sm font-bold py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
            {t('adm_tickets_reject_cancel')}
          </button>
          <button
            onClick={() => onConfirm(motif)} disabled={!motif.trim() || loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
            {t('adm_tickets_reject_confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TicketsAdmin() {
  const { t } = useTranslation()
  const [tickets, setTickets] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(0)
  const [actionId, setActionId] = useState(null)

  const [statusF, setStatusF] = useState('')
  const [monthF, setMonthF] = useState('')
  const [yearF, setYearF] = useState('')
  const [employeeF, setEmployeeF] = useState('')

  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejecting, setRejecting] = useState(false)

  const load = useCallback((p = 0) => {
    setLoading(true)
    const params = { page: p, size: 20 }
    if (statusF) params.status = statusF
    if (monthF) params.month = Number(monthF)
    if (yearF) params.year = Number(yearF)
    if (employeeF) params.employee = employeeF
    ticketsApi.adminList(params)
      .then(r => {
        setTickets(r.content)
        setTotal(r.totalPages)
        setPage(r.number)
      })
      .catch(() => toast.error(t('common_error')))
      .finally(() => setLoading(false))
  }, [statusF, monthF, yearF, employeeF, t])

  useEffect(() => { load(0) }, [load])

  useEffect(() => {
    ticketsApi.pendingCount().then(r => setPending(r.count)).catch(() => {})
  }, [tickets])

  const approve = async (id) => {
    setActionId(id)
    try {
      const r = await ticketsApi.approve(id)
      setTickets(prev => prev.map(t => t.id === id ? r : t))
      toast.success(t('status_approved'))
      setPending(p => Math.max(0, p - 1))
    } catch (e) {
      toast.error(e.response?.data?.message || t('common_error'))
    } finally { setActionId(null) }
  }

  const reject = async (motif) => {
    setRejecting(true)
    try {
      const r = await ticketsApi.reject(rejectTarget.id, motif)
      setTickets(prev => prev.map(t => t.id === rejectTarget.id ? r : t))
      toast.success(t('status_rejected'))
      setPending(p => Math.max(0, p - 1))
      setRejectTarget(null)
    } catch (e) {
      toast.error(e.response?.data?.message || t('common_error'))
    } finally { setRejecting(false) }
  }

  const remove = async (id) => {
    if (!window.confirm(t('common_delete') + '?')) return
    setActionId(id)
    try {
      await ticketsApi.delete(id)
      setTickets(prev => prev.filter(t => t.id !== id))
      toast.success(t('common_delete'))
    } catch (e) {
      toast.error(e.response?.data?.message || t('common_error'))
    } finally { setActionId(null) }
  }

  const clearFilters = () => { setStatusF(''); setMonthF(''); setYearF(''); setEmployeeF('') }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              {t('adm_tickets_title')}
              {pending > 0 && (
                <span className="text-xs font-bold bg-amber-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                  {pending}
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{t('adm_tickets_subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Employee search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" placeholder={t('adm_tickets_search')}
              value={employeeF} onChange={e => setEmployeeF(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div className="relative">
            <select value={statusF} onChange={e => setStatusF(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">{t('adm_tickets_filter_status')}</option>
              <option value="PENDING">{t('status_pending')}</option>
              <option value="APPROVED">{t('status_approved')}</option>
              <option value="REJECTED">{t('status_rejected')}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>

          {/* Month */}
          <div className="relative">
            <select value={monthF} onChange={e => setMonthF(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Tous les mois</option>
              {MONTHS_KEYS.map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>

          {/* Year */}
          <div className="flex gap-2">
            <input
              type="number" placeholder="Année (ex: 2026)"
              value={yearF} onChange={e => setYearF(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={clearFilters}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 px-3 rounded-xl hover:bg-slate-50 transition-colors">
              {t('qr_clear')}
            </button>
          </div>
        </div>
      </div>

      {/* Grid List / Table layout */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-400 text-sm gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> {t('common_loading')}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Clock className="w-12 h-12 text-slate-200" />
            <p className="text-sm font-medium">{t('adm_tickets_empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide font-bold">
                  <th className="px-6 py-4 text-left font-bold">{t('adm_tickets_col_employee')}</th>
                  <th className="px-4 py-4 text-left font-bold">{t('adm_tickets_col_type')}</th>
                  <th className="px-4 py-4 text-center font-bold">{t('adm_tickets_col_days')}</th>
                  <th className="px-4 py-4 text-left font-bold">{t('adm_tickets_col_offer')}</th>
                  <th className="px-4 py-4 text-left font-bold">{t('adm_tickets_col_date')}</th>
                  <th className="px-4 py-4 text-center font-bold">{t('adm_tickets_col_status')}</th>
                  <th className="px-4 py-4 text-center font-bold">Doc</th>
                  <th className="px-6 py-4 text-center font-bold">{t('adm_tickets_col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((tItem) => {
                  const sc = STATUS_CONFIG[tItem.status] || STATUS_CONFIG.PENDING
                  const SIcon = sc.Icon
                  const busy = actionId === tItem.id
                  return (
                    <React.Fragment key={tItem.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        {/* Employee */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{tItem.userFullName}</p>
                          <p className="text-xs text-slate-400">{tItem.userMatricule} · {tItem.userEmail}</p>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-4">
                          <span className="font-semibold text-slate-800">
                            {TYPE_CONFIG[tItem.typeTicket] || tItem.typeTicket}
                          </span>
                        </td>

                        {/* Days */}
                        <td className="px-4 py-4 text-center font-bold text-slate-800">{tItem.nbTickets}</td>

                        {/* Offer */}
                        <td className="px-4 py-4 text-slate-600 font-medium">{tItem.offre || '—'}</td>

                        {/* Date */}
                        <td className="px-4 py-4 text-slate-500 text-xs">{fmtDate(tItem.createdAt)}</td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${sc.cls}`}>
                            <SIcon className="w-3.5 h-3.5" />
                            {t(sc.labelKey)}
                          </span>
                        </td>

                        {/* Document */}
                        <td className="px-4 py-4 text-center">
                          {tItem.documentPath ? (
                            <a href={tItem.documentPath} target="_blank" rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 inline-block p-1 border border-slate-100 rounded-lg hover:bg-blue-50 transition-colors">
                              <FileDown className="w-4 h-4" />
                            </a>
                          ) : <span className="text-slate-300">—</span>}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {tItem.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => approve(tItem.id)} disabled={busy}
                                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 px-3 py-1.5 rounded-lg transition-all"
                                >
                                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                  {t('adm_tickets_approve')}
                                </button>
                                <button
                                  onClick={() => setRejectTarget(tItem)} disabled={busy}
                                  className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-all"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  {t('adm_tickets_reject')}
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => remove(tItem.id)} disabled={busy}
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg border border-slate-100 hover:border-red-200 hover:bg-red-50 transition-all"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Rejection reasons */}
                      {tItem.status === 'REJECTED' && tItem.motifRejet && (
                        <tr className="bg-red-50/50">
                          <td colSpan={8} className="px-6 py-3 border-t border-red-100">
                            <p className="text-xs text-red-800">
                              <span className="font-bold">{t('myreg_motif')}: </span>
                              {tItem.motifRejet}
                            </p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination control */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button onClick={() => load(page - 1)} disabled={page === 0}
            className="flex items-center gap-1 text-sm font-semibold text-slate-600 disabled:opacity-30 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-500">{page + 1} / {totalPages}</span>
          <button onClick={() => load(page + 1)} disabled={page >= totalPages - 1}
            className="flex items-center gap-1 text-sm font-semibold text-slate-600 disabled:opacity-30 hover:text-slate-900 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Rejection modal view */}
      {rejectTarget && (
        <RejectModal
          ticket={rejectTarget} onConfirm={reject} onCancel={() => setRejectTarget(null)}
          loading={rejecting} t={t}
        />
      )}
    </div>
  )
}
