import React, { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserQRCodeReader } from '@zxing/browser'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  Camera, CheckCircle2, XCircle, ScanLine, Square, RefreshCw,
  ChevronDown, ChevronUp, ShieldCheck, User, CalendarDays, MapPin,
  QrCode, Keyboard, Play
} from 'lucide-react'
import { registrationsApi } from '../api/registrations'
import { authStore } from '../stores/authStore'

const SCAN_IDLE = 'idle'
const SCAN_ACTIVE = 'active'
const SCAN_SUCCESS = 'success'
const SCAN_ERROR = 'error'

const formatDate = (v) =>
  v ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : '—'

export default function QrScannerAdmin() {
  const { t } = useTranslation()
  const user = authStore((state) => state.user)
  const videoRef = useRef(null)
  const controlsRef = useRef(null)

  const [scanState, setScanState] = useState(SCAN_IDLE)
  const [result, setResult] = useState(null)
  const [validating, setValidating] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualValue, setManualValue] = useState('')
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState('')
  const [cameraError, setCameraError] = useState(null)
  const [history, setHistory] = useState([])

  const canManage = user?.role === 'ADMIN'

  const stopScanner = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
    setScanState((p) => (p === SCAN_ACTIVE ? SCAN_IDLE : p))
  }, [])

  useEffect(() => () => stopScanner(), [stopScanner])

  useEffect(() => {
    BrowserQRCodeReader.listVideoInputDevices()
      .then((devices) => {
        setCameras(devices)
        if (devices.length > 0) setSelectedCamera(devices[0].deviceId)
      })
      .catch(() => setCameraError("Impossible d'accéder aux caméras."))
  }, [])

  const validate = useCallback(async (qrContent) => {
    if (!qrContent?.trim() || validating) return
    setValidating(true)
    try {
      const reg = await registrationsApi.validateQr(qrContent.trim())
      setResult({ ok: true, registration: reg })
      setScanState(SCAN_SUCCESS)
      toast.success(t('qr_success'))
      // Add to session scan history
      setHistory(prev => [{
        id: Date.now(),
        name: reg.userFullName,
        activity: reg.activity?.title,
        time: new Date(),
        ok: true
      }, ...prev])
      stopScanner()
    } catch (err) {
      const msg = err.response?.data?.message || t('qr_error')
      setResult({ ok: false, message: msg })
      setScanState(SCAN_ERROR)
      toast.error(msg)
      setHistory(prev => [{
        id: Date.now(),
        name: 'QR Code',
        activity: msg,
        time: new Date(),
        ok: false
      }, ...prev])
      stopScanner()
    } finally {
      setValidating(false)
    }
  }, [validating, stopScanner, t])

  const startScanner = useCallback(async () => {
    setCameraError(null)
    setResult(null)
    setScanState(SCAN_ACTIVE)

    const reader = new BrowserQRCodeReader()
    try {
      const controls = await reader.decodeFromVideoDevice(
        selectedCamera || undefined,
        videoRef.current,
        (scanResult, err, ctrl) => {
          if (scanResult) {
            controlsRef.current = ctrl
            validate(scanResult.getText())
          }
        }
      )
      controlsRef.current = controls
    } catch (err) {
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions.")
      setScanState(SCAN_IDLE)
    }
  }, [selectedCamera, validate])

  const reset = () => {
    setResult(null)
    setManualValue('')
    setScanState(SCAN_IDLE)
  }

  if (!canManage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center shadow-sm max-w-sm">
          <ShieldCheck className="mx-auto mb-4 w-12 h-12 text-slate-300" />
          <h1 className="text-xl font-bold text-slate-800">Accès refusé</h1>
          <p className="text-sm text-slate-400 mt-2">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    )
  }

  const isActive = scanState === SCAN_ACTIVE

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <QrCode className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('qr_title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('qr_subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Camera panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-50 px-6 py-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Scanner</h2>
            </div>

            {cameras.length > 1 && (
              <div className="relative">
                <select
                  value={selectedCamera} onChange={e => setSelectedCamera(e.target.value)} disabled={isActive}
                  className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {cameras.map(cam => (
                    <option key={cam.deviceId} value={cam.deviceId}>
                      {cam.label || `Caméra ${cam.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              </div>
            )}
          </div>

          {/* Video viewer */}
          <div className="relative aspect-video bg-slate-950 w-full">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

            {/* Sweep screen frame */}
            {isActive && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 h-48 w-48">
                  {['top-left','top-right','bottom-left','bottom-right'].map(corner => (
                    <span key={corner}
                      className={`absolute h-6 w-6 border-blue-400 ${
                        corner.includes('top') ? 'top-0 border-t-2' : 'bottom-0 border-b-2'
                      } ${
                        corner.includes('left') ? 'left-0 border-l-2' : 'right-0 border-r-2'
                      }`}
                    />
                  ))}
                  <ScanLine className="absolute left-2 right-2 top-1/2 -translate-y-1/2 text-blue-400 animate-bounce" />
                </div>
              </div>
            )}

            {/* Overlay Status cards */}
            {scanState === SCAN_IDLE && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 text-white">
                <Camera className="w-10 h-10 text-slate-300" />
                <p className="text-sm font-semibold">{t('qr_scanning')}</p>
              </div>
            )}
            {scanState === SCAN_SUCCESS && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-emerald-900/90 text-white">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-pulse" />
                <p className="text-base font-bold">{t('qr_success')}</p>
              </div>
            )}
            {scanState === SCAN_ERROR && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-900/95 text-white p-4 text-center">
                <XCircle className="w-12 h-12 text-red-400" />
                <p className="text-sm font-semibold">{result?.message}</p>
              </div>
            )}
          </div>

          {cameraError && (
            <p className="px-6 pt-3 text-xs text-red-500 font-semibold">{cameraError}</p>
          )}

          {/* Action triggers */}
          <div className="flex gap-3 px-6 py-4 border-t border-slate-50">
            {isActive ? (
              <button
                onClick={stopScanner}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2.5 rounded-xl transition-all"
              >
                <Square className="w-4 h-4" />
                {t('qr_stop')}
              </button>
            ) : (
              <button
                onClick={startScanner} disabled={validating}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition-all shadow-sm shadow-blue-500/10"
              >
                <Play className="w-4 h-4" />
                {scanState === SCAN_IDLE ? t('qr_start') : t('common_retry')}
              </button>
            )}
            {(scanState === SCAN_SUCCESS || scanState === SCAN_ERROR) && (
              <button
                onClick={reset}
                className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="space-y-4">
          {/* Result view */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('qr_history_status')}</h3>

            {!result ? (
              <div className="flex flex-col items-center py-6 text-center text-slate-400">
                <ScanLine className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-xs">{t('qr_scanning')}</p>
              </div>
            ) : result.ok && result.registration ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-800 px-3.5 py-2.5 rounded-xl border border-emerald-100 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('qr_success')}
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex gap-2">
                    <User className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">{result.registration.userFullName}</p>
                      <p className="text-slate-400">{result.registration.userMatricule}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">{result.registration.activity?.title}</p>
                      <p className="text-slate-400">{result.registration.activity?.activityType?.name}</p>
                    </div>
                  </div>
                  {result.registration.activity?.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>{result.registration.activity.location}</span>
                    </div>
                  )}
                  <p className="bg-slate-50 text-[10px] text-slate-400 px-3 py-1 rounded-lg">
                    {formatDate(result.registration.validatedAt)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 bg-red-50 text-red-800 p-3.5 rounded-xl border border-red-100 text-xs font-bold">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{result.message}</p>
              </div>
            )}
          </div>

          {/* Manual Input Fallback */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowManual(v => !v)}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                {t('qr_manual')}
              </span>
              {showManual ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showManual && (
              <div className="px-5 pb-5 pt-1 space-y-3">
                <textarea
                  rows={3} value={manualValue} onChange={e => setManualValue(e.target.value)}
                  placeholder={t('qr_manual_placeholder')}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => validate(manualValue)} disabled={!manualValue.trim() || validating}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-xl transition-all"
                >
                  {t('qr_validate')}
                </button>
              </div>
            )}
          </div>

          {/* Session logs */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('qr_history')}</h3>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">{t('qr_history_empty')}</p>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {history.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-xs border-b border-slate-50 pb-2 last:border-b-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{item.activity}</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
