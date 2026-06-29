import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Edit, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { activityTypesApi } from '../api/activityTypes'
import { authStore } from '../stores/authStore'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import ActivityTypeForm from '../components/activityTypes/ActivityTypeForm'

export default function ActivityTypesAdmin() {
  const user = authStore((state) => state.user)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [mode, setMode] = useState('list')

  const canManage = user?.role === 'ADMIN'

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  )

  const load = async () => {
    setLoading(true)
    try {
      setItems(await activityTypesApi.list())
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
        await activityTypesApi.update(editing.id, payload)
        toast.success('Type d activite modifie')
      } else {
        await activityTypesApi.create(payload)
        toast.success('Type d activite cree')
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

  const toggleStatus = async (item) => {
    try {
      await activityTypesApi.updateStatus(item.id, !item.active)
      toast.success(item.active ? 'Type desactive' : 'Type active')
      await load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mise a jour impossible')
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Supprimer ${item.name} ?`)) return
    try {
      await activityTypesApi.remove(item.id)
      toast.success('Type supprime')
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
          <p className="mt-2 text-sm text-slate-600">La configuration des types d'activites est reservee aux administrateurs.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-blue-700">Sprint 2</p>
            <h1 className="text-2xl font-bold text-slate-950">ActivityType & formulaires dynamiques</h1>
            <p className="mt-1 text-sm text-slate-600">Configurez les types d'activites reutilisables pour les prochains sprints.</p>
          </div>
          {mode === 'list' ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={load}>
                <RefreshCw className="size-4" />
                Actualiser
              </Button>
              <Button onClick={() => { setEditing(null); setMode('form') }}>
                <Plus className="size-4" />
                Nouveau type
              </Button>
            </div>
          ) : null}
        </header>

        {mode === 'form' ? (
          <ActivityTypeForm
            initialValue={editing}
            saving={saving}
            onSubmit={save}
            onCancel={() => { setMode('list'); setEditing(null) }}
          />
        ) : (
          <section className="rounded-lg border bg-white shadow-sm">
            <div className="grid grid-cols-[1fr_120px_130px] gap-4 border-b px-5 py-3 text-sm font-medium text-slate-500 md:grid-cols-[1fr_140px_160px_180px]">
              <span>Type</span>
              <span>Statut</span>
              <span>Champs</span>
              <span className="hidden md:block text-right">Actions</span>
            </div>
            {loading ? (
              <div className="p-6 text-sm text-slate-500">Chargement...</div>
            ) : sortedItems.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">Aucun type d'activite.</div>
            ) : (
              sortedItems.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_120px_130px] gap-4 border-b px-5 py-4 last:border-b-0 md:grid-cols-[1fr_140px_160px_180px]">
                  <div>
                    <div className="font-medium text-slate-950">{item.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.code} · {item.description || 'Sans description'}</div>
                  </div>
                  <div>
                    <Badge variant={item.active ? 'default' : 'secondary'}>{item.active ? 'Actif' : 'Inactif'}</Badge>
                  </div>
                  <div className="text-sm text-slate-600">{Object.keys(item.customFieldsSchema || {}).length} champs</div>
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="icon" onClick={() => { setEditing(item); setMode('form') }}>
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleStatus(item)}>
                      {item.active ? 'Desactiver' : 'Activer'}
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => remove(item)}>
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
