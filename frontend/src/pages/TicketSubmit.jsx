import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  CreditCard, Fuel, Gift, Upload, FileText, X,
  CheckCircle2, AlertTriangle, Loader2, ChevronDown, Banknote,
} from 'lucide-react'
import { ticketsApi } from '../api/tickets'

const TICKET_TYPES = [
  { value: 'RESTAURANT', labelKey: 'ticket_type_restaurant', descKey: 'ticket_type_restaurant_desc', Icon: CreditCard, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'CARBURANT',  labelKey: 'ticket_type_fuel',        descKey: 'ticket_type_fuel_desc',        Icon: Fuel,       color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'CADEAU',     labelKey: 'ticket_type_gift',        descKey: 'ticket_type_gift_desc',        Icon: Gift,       color: 'text-pink-600 bg-pink-50 border-pink-200' },
]

const OFFRES = ['6 DT/jour', '8 DT/jour', '10 DT/jour', '12 DT/jour']
const fmtBytes = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} Ko` : `${(b / 1024 / 1024).toFixed(1)} Mo`

export default function TicketSubmit() {
  const { t } = useTranslation()
  const [quotaUsed,    setQuotaUsed]    = useState(false)
  const [quotaLoading, setQuotaLoading] = useState(true)
  const [typeTicket,   setTypeTicket]   = useState('RESTAURANT')
  const [nbTickets,    setNbTickets]    = useState(22)
  const [offre,        setOffre]        = useState('8 DT/jour')
  const [docFile,      setDocFile]      = useState(null)
  const [uploading,    setUploading]    = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [submitted,    setSubmitted]    = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    ticketsApi.checkQuota()
      .then(r => setQuotaUsed(r.quotaUsed))
      .catch(() => {})
      .finally(() => setQuotaLoading(false))
  }, [])

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) { toast.error('Fichier trop volumineux (max 10 Mo)'); return }
    setDocFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) { fileRef.current.files = e.dataTransfer.files; handleFile({ target: { files: [f] } }) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      let documentPath = null
      if (docFile) {
        setUploading(true)
        const res = await ticketsApi.uploadDoc(docFile)
        documentPath = res.url
        setUploading(false)
      }
      await ticketsApi.submit({ typeTicket, nbTickets, offre, documentPath })
      toast.success(t('ticket_success_title'))
      setSubmitted(true)
      setQuotaUsed(true)
    } catch (err) {
      toast.error(err.response?.data?.message || t('common_error'))
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  /* Success screen */
  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">{t('ticket_success_title')}</h2>
          <p className="text-sm text-slate-500 mb-8">{t('ticket_success_msg')}</p>
          <Link
            to="/tickets/my-tickets"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors shadow-sm shadow-blue-500/20"
          >
            <CreditCard className="w-4 h-4" />
            {t('ticket_success_btn')}
          </Link>
        </div>
      </div>
    )
  }

  const selectedOffer = parseFloat(offre)
  const estimated = nbTickets * selectedOffer

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('ticket_title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('ticket_subtitle')}</p>
        </div>
      </div>

      {/* Quota Warning */}
      {!quotaLoading && quotaUsed && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-amber-800 text-sm">{t('ticket_quota_title')}</p>
            <p className="text-xs text-amber-700 mt-0.5">{t('ticket_quota_msg')}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Ticket Type */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide mb-5">
            <CreditCard className="w-4 h-4 text-blue-600" />
            {t('ticket_type_section')}
          </h2>
          <div className="grid gap-3">
            {TICKET_TYPES.map(({ value, labelKey, descKey, Icon, color }) => (
              <label key={value}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${typeTicket === value
                    ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100'
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{t(labelKey)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t(descKey)}</p>
                </div>
                <input type="radio" name="typeTicket" value={value}
                  checked={typeTicket === value}
                  onChange={() => setTypeTicket(value)}
                  className="accent-blue-600 w-4 h-4 shrink-0"
                  id={`type-${value}`}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
            <FileText className="w-4 h-4 text-blue-600" />
            {t('ticket_details_section')}
          </h2>

          <div>
            <label htmlFor="nb-tickets" className="block text-sm font-semibold text-slate-700 mb-2">
              {t('ticket_days_label')}
            </label>
            <input
              id="nb-tickets" type="number" min={1} max={31}
              value={nbTickets}
              onChange={e => setNbTickets(Number(e.target.value))}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: 22"
            />
          </div>

          <div>
            <label htmlFor="offre" className="block text-sm font-semibold text-slate-700 mb-2">
              {t('ticket_offer_label')}
            </label>
            <div className="relative">
              <select id="offre" value={offre} onChange={e => setOffre(e.target.value)}
                className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                {OFFRES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {typeTicket === 'RESTAURANT' && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5">
              <Banknote className="w-5 h-5 text-blue-600 shrink-0" />
              <p className="text-sm text-blue-800">
                <span className="font-medium">{t('ticket_estimated')}: </span>
                <strong className="font-black text-blue-900">{estimated.toFixed(0)} DT</strong>
                <span className="text-blue-600 text-xs ml-1">({nbTickets} j × {offre})</span>
              </p>
            </div>
          )}
        </div>

        {/* Document Upload */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">
            <Upload className="w-4 h-4 text-blue-600" />
            {t('ticket_doc_section')}
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full normal-case tracking-normal">
              {t('ticket_doc_optional')}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">{t('ticket_doc_hint')}</p>

          {docFile ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{docFile.name}</p>
                <p className="text-xs text-slate-400">{fmtBytes(docFile.size)}</p>
              </div>
              <button type="button" onClick={() => setDocFile(null)}
                className="w-8 h-8 rounded-lg hover:bg-red-100 hover:text-red-500 text-slate-400 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <p className="text-sm text-slate-600">
                {t('ticket_doc_drag')} <span className="text-blue-600 font-semibold">{t('ticket_doc_browse')}</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, WEBP — max 10 Mo</p>
              <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={handleFile} className="hidden" id="doc-upload" />
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          id="btn-submit-ticket"
          type="submit"
          disabled={submitting || quotaUsed || quotaLoading}
          className="w-full flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm px-6 py-4 rounded-xl transition-colors shadow-md shadow-blue-500/20"
        >
          {uploading
            ? <><Loader2 className="w-4 h-4 animate-spin" />{t('ticket_uploading')}</>
            : submitting
            ? <><Loader2 className="w-4 h-4 animate-spin" />{t('ticket_submitting')}</>
            : quotaUsed
            ? t('ticket_quota_btn')
            : <><CreditCard className="w-4 h-4" />{t('ticket_submit')}</>}
        </button>
      </form>
    </div>
  )
}
