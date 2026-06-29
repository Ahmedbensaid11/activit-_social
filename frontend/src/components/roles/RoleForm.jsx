import React, { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import { Checkbox } from '../ui/checkbox'

const COLOR_OPTIONS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899',
]

export default function RoleForm({ initialValue, permissions, saving, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({
    name: initialValue?.name || '',
    description: initialValue?.description || '',
    color: initialValue?.color || '#6366f1',
    active: initialValue?.active ?? true,
  }))
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(
    () => new Set((initialValue?.permissions || []).map((p) => p.id))
  )

  const groupedPermissions = useMemo(() => {
    const groups = {}
    permissions.forEach((perm) => {
      if (!groups[perm.category]) groups[perm.category] = []
      groups[perm.category].push(perm)
    })
    return groups
  }, [permissions])

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const togglePermission = (id, checked) => {
    setSelectedPermissionIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleCategory = (categoryPermissions, checked) => {
    setSelectedPermissionIds((current) => {
      const next = new Set(current)
      categoryPermissions.forEach((p) => {
        if (checked) next.add(p.id)
        else next.delete(p.id)
      })
      return next
    })
  }

  const submit = (event) => {
    event.preventDefault()
    onSubmit({
      ...form,
      permissionIds: Array.from(selectedPermissionIds),
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Informations du rôle</h2>
            <p className="text-sm text-slate-500">Nom, description et couleur d'affichage.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nom du rôle</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="Ex: Gestionnaire Activités"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="À quoi sert ce rôle ?"
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur du badge</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => updateForm('color', color)}
                    className={`size-8 rounded-full border-2 transition-all ${
                      form.color === color ? 'border-slate-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <Label>Actif</Label>
                <p className="text-xs text-slate-500">Peut être assigné aux utilisateurs.</p>
              </div>
              <Switch checked={form.active} onCheckedChange={(checked) => updateForm('active', checked)} />
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Permissions</h2>
            <p className="text-sm text-slate-500">
              {selectedPermissionIds.size} permission(s) sélectionnée(s)
            </p>
          </div>

          <div className="space-y-5">
            {Object.entries(groupedPermissions).map(([category, perms]) => {
              const allChecked = perms.every((p) => selectedPermissionIds.has(p.id))
              const someChecked = perms.some((p) => selectedPermissionIds.has(p.id))
              return (
                <div key={category} className="rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-t-lg border-b border-slate-200">
                    <span className="text-sm font-semibold text-slate-800">{category}</span>
                    <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                      <Checkbox
                        checked={allChecked}
                        onCheckedChange={(checked) => toggleCategory(perms, Boolean(checked))}
                      />
                      Tout {allChecked ? 'désélectionner' : 'sélectionner'}
                    </label>
                  </div>
                  <div className="grid gap-3 p-4 sm:grid-cols-2">
                    {perms.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-start gap-2.5 rounded-lg border border-transparent p-2 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedPermissionIds.has(perm.id)}
                          onCheckedChange={(checked) => togglePermission(perm.id, Boolean(checked))}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">{perm.label}</p>
                          {perm.description && (
                            <p className="text-xs text-slate-500">{perm.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
            {!someChecked && Object.keys(groupedPermissions).length === 0 && (
              <p className="text-sm text-slate-500">Aucune permission disponible.</p>
            )}
          </div>
        </section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
        </div>
      </div>

      <aside className="space-y-4">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Aperçu</h2>
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: form.color }}
            >
              {form.name || 'Nom du rôle'}
            </span>
            {!form.active && (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                Inactif
              </span>
            )}
          </div>
          <p className="mt-3 text-sm text-slate-500">
            {form.description || 'Aucune description.'}
          </p>
        </section>
      </aside>
    </form>
  )
}