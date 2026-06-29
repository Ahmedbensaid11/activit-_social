import React, { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  CreditCard, Clock, CheckCircle2, XCircle,
  FileDown, ChevronLeft, ChevronRight, RefreshCcw,
} from 'lucide-react'
import { ticketsApi } from '../api/tickets'

/* ── helpers ─────────────────────────────────────────────── */
const STATUS_CONFIG = {
  PENDING:  { label: 'En attente', cls: 'bg-amber-100 text-amber-800',  Icon: Clock },
  APPROVED: { label: 'Approuvé',   cls: 'bg-green-100 text-green-800',  Icon: CheckCircle2 },
  REJECTED: { label: 'Rejeté',     cls: 'bg-red-100  text-red-800',     Icon: XCircle },
}

const TYPE_ICONS = { RESTAURANT: '🍽️', CARBURANT: '⛽', CADEAU: '🎁' }

const fmtDate = (v) =>
  v ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(v)) : '—'

/* ─────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────── */
export default function MyTickets() {
  const [tickets,  setTickets]  = useState([])
  const [page,     setPage]     = useState(0)
  const [totalPages, setTotal]  = useState(0)
  const [loading,  setLoading]  = useState(true)

  const load = useCallback((p = 0) => {
    setLoading(true)
    ticketsApi.myTickets({ page: p, size: 10 })
      .then(r => {
        setTickets(r.content)
        setTotal(r.totalPages)
        setPage(r.number)
      })
      .catch(() => toast.error('Impossible de charger vos tickets'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(0) }, [load])

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-10">

        {/* header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Tickets Pluxee</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Mes demandes</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => load(0)} id="btn-refresh-tickets"
              className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl transition-colors">
              <RefreshCcw className="w-4 h-4" /> Actualiser
            </button>
            <a href="/tickets/submit"
              className="flex items-center gap-2 text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors font-medium">
              + Nouvelle demande
            </a>
          </div>
        </div>

        {/* legend */}
        <div className="flex flex-wrap gap-3 mb-6">
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <span key={k} className={`text-xs font-semibold px-3 py-1 rounded-full ${v.cls}`}>
              {v.label}
            </span>
          ))}
        </div>

        {/* table */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20 text-slate-400 text-sm">
              Chargement…
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <CreditCard className="w-12 h-12 text-slate-200" />
              <p className="text-slate-400 text-sm">Aucune demande de ticket pour l'instant.</p>
              <a href="/tickets/submit"
                className="text-sm text-blue-600 font-medium hover:underline">
                Soumettre ma première demande →
              </a>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-6 py-3 text-left font-semibold">Ticket</th>
                  <th className="px-4 py-3 text-center font-semibold">Jours</th>
                  <th className="px-4 py-3 text-left font-semibold">Offre</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-center font-semibold">Statut</th>
                  <th className="px-4 py-3 text-center font-semibold">Doc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => {
                  const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING
                  const Icon = sc.Icon
                  return (
                    <React.Fragment key={t.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{TYPE_ICONS[t.typeTicket] || '🎫'}</span>
                            <div>
                              <p className="font-medium text-slate-900">{t.nom}</p>
                              <p className="text-xs text-slate-400">{t.typeTicket}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-bold text-slate-800">{t.nbTickets}</span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{t.offre || '—'}</td>
                        <td className="px-4 py-4 text-slate-500">{fmtDate(t.createdAt)}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${sc.cls}`}>
                            <Icon className="w-3 h-3" />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {t.documentPath ? (
                            <a href={t.documentPath} target="_blank" rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Voir le document">
                              <FileDown className="w-4 h-4 mx-auto" />
                            </a>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                      {/* rejection reason inline */}
                      {t.status === 'REJECTED' && t.motifRejet && (
                        <tr className="bg-red-50">
                          <td colSpan={6} className="px-6 py-2">
                            <p className="text-xs text-red-700">
                              <strong>Motif de rejet :</strong> {t.motifRejet}
                            </p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => load(page - 1)} disabled={page === 0}
              className="flex items-center gap-1 text-sm text-slate-600 disabled:opacity-30 hover:text-slate-900 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
            <span className="text-sm text-slate-500">
              Page {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => load(page + 1)} disabled={page >= totalPages - 1}
              className="flex items-center gap-1 text-sm text-slate-600 disabled:opacity-30 hover:text-slate-900 transition-colors">
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
