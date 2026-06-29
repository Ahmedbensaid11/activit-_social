import React, { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Check, Download, QrCode, RefreshCw, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { registrationsApi } from '../api/registrations'
import { activitiesApi } from '../api/activities'
import { authStore } from '../stores/authStore'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED']

const statusVariant = {
  PENDING: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function RegistrationsAdmin() {
  const user = authStore((state) => state.user)
  const [registrations, setRegistrations] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ activityId: '', status: '', employee: '' })
  const [qrContent, setQrContent] = useState('')

  const canManage = user?.role === 'ADMIN'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.activityId) params.activityId = filters.activityId
      if (filters.status) params.status = filters.status
      if (filters.employee) params.employee = filters.employee

      const [registrationData, activityData] = await Promise.all([
        registrationsApi.adminList({ ...params, size: 100 }),
        activitiesApi.list(),
      ])
      setRegistrations(registrationData.content || [])
      setActivities(activityData)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }, [filters.activityId, filters.employee, filters.status])

  useEffect(() => {
    if (canManage) load()
  }, [canManage, load])

  const approve = async (registration) => {
    try {
      await registrationsApi.approve(registration.id)
      toast.success('Inscription approuvee')
      await load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approbation impossible')
    }
  }

  const reject = async (registration) => {
    const motif = window.prompt('Motif du rejet')
    if (!motif) return
    try {
      await registrationsApi.reject(registration.id, motif)
      toast.success('Inscription rejetee')
      await load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Rejet impossible')
    }
  }

  const validateQr = async () => {
    try {
      await registrationsApi.validateQr(qrContent)
      toast.success('QR Code valide')
      setQrContent('')
      await load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'QR Code invalide')
    }
  }

  const openQr = async (registration) => {
    try {
      const blob = await registrationsApi.qrCodeBlob(registration.id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (error) {
      toast.error(error.response?.data?.message || 'QR Code inaccessible')
    }
  }

  const exportCsv = () => {
    const header = ['id', 'activite', 'employe', 'email', 'matricule', 'status', 'date']
    const rows = registrations.map((registration) => [
      registration.id,
      registration.activity.title,
      registration.userFullName,
      registration.userEmail,
      registration.userMatricule,
      registration.status,
      registration.registeredAt,
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'inscriptions.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const pendingCount = useMemo(() => registrations.filter((registration) => registration.status === 'PENDING').length, [registrations])

  if (!canManage) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Acces admin requis</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-blue-700">Sprint 4</p>
            <h1 className="text-2xl font-bold text-slate-950">Gestion des inscriptions</h1>
            <p className="mt-1 text-sm text-slate-600">{pendingCount} demande(s) en attente.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="default" asChild>
              <Link to="/admin/qr-scanner">
                <QrCode className="size-4" />
                Scanner QR
              </Link>
            </Button>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={load}>
              <RefreshCw className="size-4" />
              Actualiser
            </Button>
          </div>
        </header>

        <section className="mb-5 grid gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-[220px_160px_1fr_auto]">
          <select
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={filters.activityId}
            onChange={(event) => setFilters((current) => ({ ...current, activityId: event.target.value }))}
          >
            <option value="">Toutes les activites</option>
            {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.title}</option>)}
          </select>
          <select
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">Tous les statuts</option>
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <Input
            placeholder="Filtrer par employe, email ou matricule"
            value={filters.employee}
            onChange={(event) => setFilters((current) => ({ ...current, employee: event.target.value }))}
          />
          <Button onClick={load}>
            <Search className="size-4" />
            Filtrer
          </Button>
        </section>

        <section className="mb-5 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Validation QR</h2>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Textarea
              rows={2}
              placeholder="Coller ici le contenu JSON du QR Code scanne"
              value={qrContent}
              onChange={(event) => setQrContent(event.target.value)}
            />
            <Button onClick={validateQr} disabled={!qrContent.trim()}>Valider</Button>
          </div>
        </section>

        <section className="rounded-lg border bg-white shadow-sm">
          <div className="grid grid-cols-[1fr_140px_120px] gap-4 border-b px-5 py-3 text-sm font-medium text-slate-500 md:grid-cols-[1fr_220px_120px_190px]">
            <span>Inscription</span>
            <span>Employe</span>
            <span>Statut</span>
            <span className="hidden text-right md:block">Actions</span>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Chargement...</div>
          ) : registrations.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">Aucune inscription.</div>
          ) : registrations.map((registration) => (
            <div key={registration.id} className="grid grid-cols-[1fr_140px_120px] gap-4 border-b px-5 py-4 last:border-b-0 md:grid-cols-[1fr_220px_120px_190px]">
              <div>
                <div className="font-medium text-slate-950">{registration.activity.title}</div>
                <div className="mt-1 text-xs text-slate-500">{formatDate(registration.registeredAt)} · {registration.activity.activityType?.name}</div>
                {registration.validatedAt && <div className="mt-1 text-xs text-green-700">Presence validee: {formatDate(registration.validatedAt)}</div>}
              </div>
              <div className="text-sm text-slate-600">
                <div>{registration.userFullName}</div>
                <div className="text-xs text-slate-500">{registration.userMatricule}</div>
              </div>
              <div><Badge variant={statusVariant[registration.status] || 'secondary'}>{registration.status}</Badge></div>
              <div className="flex justify-end gap-1">
                {registration.status === 'PENDING' && (
                  <>
                    <Button variant="outline" size="icon" onClick={() => approve(registration)}>
                      <Check className="size-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => reject(registration)}>
                      <X className="size-4" />
                    </Button>
                  </>
                )}
                {registration.status === 'APPROVED' && (
                  <Button variant="outline" size="sm" onClick={() => openQr(registration)}>
                    QR
                  </Button>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
