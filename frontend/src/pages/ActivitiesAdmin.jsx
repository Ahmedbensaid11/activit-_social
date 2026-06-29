import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Edit, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { activitiesApi } from '../api/activities'
import { activityTypesApi } from '../api/activityTypes'
import { authStore } from '../stores/authStore'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import ActivityForm from '../components/activities/ActivityForm'

const statusVariant = {
  DRAFT: 'secondary',
  OPEN: 'default',
  CLOSED: 'outline',
  CANCELLED: 'destructive',
}

export default function ActivitiesAdmin() {
  const user = authStore((state) => state.user)
  const [activities, setActivities] = useState([])
  const [activityTypes, setActivityTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [mode, setMode] = useState('list')

  const canManage = user?.role === 'ADMIN'

  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [activities]
  )

  const load = async () => {
    setLoading(true)
    try {
      const [activityData, typeData] = await Promise.all([
        activitiesApi.list(),
        activityTypesApi.list(),
      ])
      setActivities(activityData)
      setActivityTypes(typeData.filter((type) => type.active))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async (payload) => {
    setSaving(true)
    try {
      if (editing?.id) {
        await activitiesApi.update(editing.id, payload)
        toast.success('Activite modifiee')
      } else {
        await activitiesApi.create(payload)
        toast.success('Activite creee')
      }
      setMode('list')
      setEditing(null)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (activity) => {
    if (!window.confirm(`Supprimer ${activity.title} ?`)) return
    try {
      await activitiesApi.remove(activity.id)
      toast.success('Activite supprimee')
      await load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Suppression impossible')
    }
  }

  if (!canManage) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Acces admin requis</h1>
          <p className="mt-2 text-sm text-slate-600">La creation des activites est reservee aux administrateurs.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-blue-700">Sprint 3</p>
            <h1 className="text-2xl font-bold text-slate-950">Activites & galerie photos</h1>
            <p className="mt-1 text-sm text-slate-600">Creez des activites generiques a partir des types configures au Sprint 2.</p>
          </div>
          {mode === 'list' ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={load}>
                <RefreshCw className="size-4" />
                Actualiser
              </Button>
              <Button onClick={() => { setEditing(null); setMode('form') }} disabled={activityTypes.length === 0}>
                <Plus className="size-4" />
                Nouvelle activite
              </Button>
            </div>
          ) : null}
        </header>

        {mode === 'form' ? (
          <ActivityForm
            activityTypes={activityTypes}
            initialValue={editing}
            saving={saving}
            onSubmit={save}
            onCancel={() => { setMode('list'); setEditing(null) }}
          />
        ) : (
          <section className="rounded-lg border bg-white shadow-sm">
            <div className="grid grid-cols-[1fr_130px_110px] gap-4 border-b px-5 py-3 text-sm font-medium text-slate-500 md:grid-cols-[1fr_140px_120px_140px_160px]">
              <span>Activite</span>
              <span>Type</span>
              <span>Statut</span>
              <span className="hidden md:block">Galerie</span>
              <span className="hidden md:block text-right">Actions</span>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500">Chargement...</div>
            ) : sortedActivities.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">Aucune activite. Creez la premiere depuis un type existant.</div>
            ) : (
              sortedActivities.map((activity) => (
                <div key={activity.id} className="grid grid-cols-[1fr_130px_110px] gap-4 border-b px-5 py-4 last:border-b-0 md:grid-cols-[1fr_140px_120px_140px_160px]">
                  <div>
                    <div className="font-medium text-slate-950">{activity.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{activity.location || 'Lieu non defini'} · {activity.capacityMax || '-'} places</div>
                  </div>
                  <div className="text-sm text-slate-600">{activity.activityType?.name}</div>
                  <div>
                    <Badge variant={statusVariant[activity.status] || 'secondary'}>{activity.status}</Badge>
                  </div>
                  <div className="hidden text-sm text-slate-600 md:block">{activity.galleryPhotoUrls?.length || 0} photos</div>
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="icon" onClick={() => { setEditing(activity); setMode('form') }}>
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => remove(activity)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}
      </div>
    </main>
  )
}
