import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Edit, Plus, RefreshCw, Trash2, ShieldCheck, Users } from 'lucide-react'
import { rolesApi } from '../api/roles'
import { authStore } from '../stores/authStore'
import { Button } from '../components/ui/button'
import RoleForm from '../components/roles/RoleForm'

export default function RolesAdmin() {
  const user = authStore((state) => state.user)
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [mode, setMode] = useState('list')

  const canManage = user?.role === 'ADMIN'

  const load = async () => {
    setLoading(true)
    try {
      const [roleData, permData] = await Promise.all([
        rolesApi.list(),
        rolesApi.permissions(),
      ])
      setRoles(roleData)
      setPermissions(permData)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canManage) load()
  }, [canManage])

  const save = async (payload) => {
    setSaving(true)
    try {
      if (editing?.id) {
        await rolesApi.update(editing.id, payload)
        toast.success('Rôle modifié')
      } else {
        await rolesApi.create(payload)
        toast.success('Rôle créé')
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

  const remove = async (role) => {
    if (!window.confirm(`Supprimer le rôle "${role.name}" ?`)) return
    try {
      await rolesApi.remove(role.id)
      toast.success('Rôle supprimé')
      await load()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Suppression impossible')
    }
  }

  if (!canManage) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Accès admin requis</h1>
          <p className="mt-2 text-sm text-slate-600">La gestion des rôles est réservée aux administrateurs.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-blue-700">Administration</p>
            <h1 className="text-2xl font-bold text-slate-950 flex items-center gap-2">
              <ShieldCheck className="size-7 text-blue-600" />
              Rôles personnalisés
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Créez des rôles et associez-leur des permissions précises (pages, actions, données).
            </p>
          </div>
          {mode === 'list' ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={load}>
                <RefreshCw className="size-4" />
                Actualiser
              </Button>
              <Button onClick={() => { setEditing(null); setMode('form') }}>
                <Plus className="size-4" />
                Nouveau rôle
              </Button>
            </div>
          ) : null}
        </header>

        {mode === 'form' ? (
          <RoleForm
            initialValue={editing}
            permissions={permissions}
            saving={saving}
            onSubmit={save}
            onCancel={() => { setMode('list'); setEditing(null) }}
          />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <div className="col-span-full rounded-lg border bg-white p-6 text-sm text-slate-500">
                Chargement...
              </div>
            ) : roles.length === 0 ? (
              <div className="col-span-full rounded-lg border bg-white p-6 text-sm text-slate-500">
                Aucun rôle créé. Créez le premier rôle personnalisé.
              </div>
            ) : (
              roles.map((role) => (
                <div key={role.id} className="rounded-lg border bg-white p-5 shadow-sm flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="size-3 rounded-full shrink-0"
                        style={{ backgroundColor: role.color }}
                      />
                      <h3 className="font-semibold text-slate-950 truncate">{role.name}</h3>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      role.active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {role.active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem]">
                    {role.description || 'Aucune description.'}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="size-3.5" />
                    {role.permissions?.length || 0} permission(s)
                  </div>

                  <div className="flex justify-end gap-1 pt-2 border-t">
                    <Button variant="outline" size="icon" onClick={() => { setEditing(role); setMode('form') }}>
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => remove(role)}>
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