import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  FileDown, FileSpreadsheet, Filter, Loader2,
  FileText, CreditCard, CheckCircle2, XCircle, Clock,
  CalendarRange, FileOutput
} from 'lucide-react'
import { reportsApi } from '../api/reports'

export default function ReportsAdmin() {
  const { t } = useTranslation()
  const [type, setType] = useState('REGISTRATION')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [status, setStatus] = useState('')
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadingExcel, setLoadingExcel] = useState(false)

  const filters = () => ({
    type,
    dateDebut: dateDebut || undefined,
    dateFin: dateFin || undefined,
    status: status || undefined,
  })

  const handlePdf = async () => {
    setLoadingPdf(true)
    try {
      await reportsApi.downloadPdf(filters())
      toast.success(t('reports_export_pdf') + ' ' + t('myreg_download'))
    } catch {
      toast.error(t('common_error'))
    } finally {
      setLoadingPdf(false)
    }
  }

  const handleExcel = async () => {
    setLoadingExcel(true)
    try {
      await reportsApi.downloadExcel(filters())
      toast.success(t('reports_export_excel') + ' ' + t('myreg_download'))
    } catch {
      toast.error(t('common_error'))
    } finally {
      setLoadingExcel(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <FileOutput className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('reports_title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('reports_subtitle')}</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
          <Filter className="w-4 h-4 text-blue-600" /> {t('common_filter')}
        </h2>

        {/* Entity type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            {t('reports_filter_type')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
              ${type === 'REGISTRATION'
                ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
            >
              <input
                type="radio" name="type" value="REGISTRATION"
                checked={type === 'REGISTRATION'}
                onChange={() => setType('REGISTRATION')}
                className="accent-blue-600 w-4 h-4"
              />
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <FileText className="w-4 h-4 text-slate-500" />
                {t('dash_kpi_registrations')}
              </div>
            </label>

            <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
              ${type === 'TICKET'
                ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
            >
              <input
                type="radio" name="type" value="TICKET"
                checked={type === 'TICKET'}
                onChange={() => setType('TICKET')}
                className="accent-blue-600 w-4 h-4"
              />
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <CreditCard className="w-4 h-4 text-slate-500" />
                {t('dash_kpi_tickets')}
              </div>
            </label>
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date-debut" className="block text-sm font-semibold text-slate-700 mb-2">
              {t('reports_filter_start')}
            </label>
            <input
              id="date-debut" type="date" value={dateDebut}
              onChange={e => setDateDebut(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="date-fin" className="block text-sm font-semibold text-slate-700 mb-2">
              {t('reports_filter_end')}
            </label>
            <input
              id="date-fin" type="date" value={dateFin}
              onChange={e => setDateFin(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="report-status" className="block text-sm font-semibold text-slate-700 mb-2">
            {t('reports_filter_status')}
          </label>
          <div className="relative">
            <select
              id="report-status" value={status} onChange={e => setStatus(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('reports_all_status')}</option>
              <option value="PENDING">{t('status_pending')}</option>
              <option value="APPROVED">{t('status_approved')}</option>
              <option value="REJECTED">{t('status_rejected')}</option>
            </select>
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* PDF */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">PDF Document</p>
                <p className="text-xs text-slate-400">Landscape A4</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-500 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tunisie Telecom Official header & logo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Clean status-colored data tables</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Pagination & Timestamping</span>
              </div>
            </div>
          </div>
          <button
            onClick={handlePdf} disabled={loadingPdf}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-sm shadow-red-500/10"
          >
            {loadingPdf
              ? <><Loader2 className="w-4 h-4 animate-spin" />{t('reports_generating')}</>
              : <><FileDown className="w-4 h-4" />{t('reports_export_pdf')}</>}
          </button>
        </div>

        {/* Excel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Excel Spreadsheet</p>
                <p className="text-xs text-slate-400">Apache POI .xlsx</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-500 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Separated dynamic sheets for registrations & tickets</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Statistical analysis workbook sheet</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Excel-native calculation formulas</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleExcel} disabled={loadingExcel}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-sm shadow-emerald-500/10"
          >
            {loadingExcel
              ? <><Loader2 className="w-4 h-4 animate-spin" />{t('reports_generating')}</>
              : <><FileSpreadsheet className="w-4 h-4" />{t('reports_export_excel')}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
