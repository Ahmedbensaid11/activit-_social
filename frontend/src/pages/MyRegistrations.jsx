import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  Download, QrCode, RefreshCw, Trash2, CalendarRange,
  MapPin, CheckCircle2, Clock, XCircle, Compass, AlertCircle,
} from 'lucide-react'
import { registrationsApi } from '../api/registrations'

const STATUS_CONFIG = {
  PENDING:  { labelKey: 'status_pending',  cls: 'bg-amber-100 text-amber-700 border border-amber-200',   Icon: Clock },
  APPROVED: { labelKey: 'status_approved', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200', Icon: CheckCircle2 },
  REJECTED: { labelKey: 'status_rejected', cls: 'bg-red-100 text-red-700 border border-red-200',          Icon: XCircle },
}

const formatDate = (v) =>
  v ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(v)) : '—'

export default function MyRegistrations() {
  const { t } = useTranslation()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const r = await registrationsApi.mine({ size: 50 })
      setRegistrations(r.content || [])
    } catch (err) {
      toast.error(err.response?.data?.message || t('common_error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const cancel = async (reg) => {
    if (!window.confirm(`${t('myreg_cancel_confirm')} ${reg.activity.title} ?`)) return
    try {
      await registrationsApi.cancel(reg.activity.id)
      toast.success(t('myreg_cancel'))
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || t('common_error'))
    }
  }

  const openQr = async (reg) => {
    try {
      const blob = await registrationsApi.qrCodeBlob(reg.id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err) {
      toast.error(err.response?.data?.message || t('common_error'))
    }
  }

  const downloadTicket = async (reg) => {
    try {
      const blob = await registrationsApi.ticketBlob(reg.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ticket-inscription-${reg.id}.png`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t('myreg_ticket_downloaded'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('common_error'))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <CalendarRange className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('myreg_title')}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{t('myreg_subtitle')}</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-600 hover:text-violet-700 text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          {t('myreg_refresh')}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">{t('myreg_loading')}</span>
          </div>
        </div>
      ) : registrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Compass className="w-8 h-8 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-slate-700">{t('myreg_empty')}</p>
            <p className="text-sm text-slate-400 mt-1">{t('myreg_empty_sub')}</p>
          </div>
          <Link
            to="/activities"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-violet-500/20"
          >
            <Compass className="w-4 h-4" />
            {t('myreg_browse')}
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_130px_130px_220px] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>{t('myreg_col_activity')}</span>
            <span>{t('myreg_col_date')}</span>
            <span>{t('myreg_col_status')}</span>
            <span className="text-right">{t('myreg_col_actions')}</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-50">
            {registrations.map((reg) => {
              const cfg = STATUS_CONFIG[reg.status] || STATUS_CONFIG.PENDING
              const StatusIcon = cfg.Icon
              return (
                <div key={reg.id} className="grid grid-cols-[1fr_130px_130px_220px] gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors items-center">
                  {/* Activity Info */}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{reg.activity.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {reg.activity.activityType?.name && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                          {reg.activity.activityType.name}
                        </span>
                      )}
                      {reg.activity.location && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="w-3 h-3" />{reg.activity.location}
                        </span>
                      )}
                    </div>
                    {reg.motifRejet && (
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-600 font-medium">{t('myreg_motif')}: {reg.motifRejet}</p>
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <p className="text-sm text-slate-600">{formatDate(reg.activity.startsAt)}</p>

                  {/* Status Badge */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${cfg.cls}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {t(cfg.labelKey)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    {reg.status === 'APPROVED' && (
                      <>
                        <button
                          onClick={() => openQr(reg)}
                          title={t('myreg_qr')}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          {t('myreg_qr')}
                        </button>
                        <button
                          onClick={() => downloadTicket(reg)}
                          title={t('myreg_ticket')}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 px-3 py-1.5 rounded-lg transition-all shadow-sm shadow-blue-200"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {t('myreg_ticket')}
                        </button>
                      </>
                    )}
                    {reg.status === 'PENDING' && (
                      <button
                        onClick={() => cancel(reg)}
                        title={t('myreg_cancel')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
