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

export default function RoleForm({
  initialValue,
  permissions = [],
  saving,
  onSubmit,
  onCancel
}) {
  const [form, setForm] = useState(() => ({
    name: initialValue?.name || '',
    description: initialValue?.description || '',
    color: initialValue?.color || '#6366f1',
    active: initialValue?.active ?? true,
  }))

  const [selectedPermissionIds, setSelectedPermissionIds] = useState(
    () => new Set((initialValue?.permissions || []).map((p) => p.id))
  )

  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    const groups = {}
    permissions.forEach((perm) => {
      if (!groups[perm.category]) groups[perm.category] = []
      groups[perm.category].push(perm)
    })
    return groups
  }, [permissions])

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

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

  const submit = (e) => {
    e.preventDefault()

    onSubmit({
      ...form,
      permissionIds: Array.from(selectedPermissionIds),
    })
  }

  const hasPermissions = Object.keys(groupedPermissions).length > 0
  const hasSelectedPermissions = selectedPermissionIds.size > 0

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">

      <div className="space-y-6">

        {/* ROLE INFO */}
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Informations du rôle
            </h2>
            <p className="text-sm text-slate-500">
              Nom, description et couleur d'affichage.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <div className="md:col-span-2 space-y-2">
              <Label>Nom du rôle</Label>
              <Input
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="Ex: Gestionnaire"
                required
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="Description du rôle"
              />
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => updateForm('color', color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      form.color === color
                        ? 'border-slate-900 scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border rounded-lg px-3 py-2">
              <div>
                <Label>Actif</Label>
                <p className="text-xs text-slate-500">
                  Peut être assigné aux utilisateurs
                </p>
              </div>

              <Switch
                checked={form.active}
                onCheckedChange={(v) => updateForm('active', v)}
              />
            </div>

          </div>
        </section>

        {/* PERMISSIONS */}
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Permissions
            </h2>
            <p className="text-sm text-slate-500">
              {selectedPermissionIds.size} sélectionnée(s)
            </p>
          </div>

          {!hasPermissions && (
            <p className="text-sm text-slate-500">
              Aucune permission disponible.
            </p>
          )}

          <div className="space-y-5">
            {Object.entries(groupedPermissions).map(([category, perms]) => {
              const allChecked = perms.every((p) =>
                selectedPermissionIds.has(p.id)
              )

              const someChecked = perms.some((p) =>
                selectedPermissionIds.has(p.id)
              )

              return (
                <div key={category} className="border rounded-lg">

                  {/* CATEGORY HEADER */}
                  <div className="flex items-center justify-between bg-slate-50 px-4 py-2 border-b">
                    <span className="font-semibold text-sm">{category}</span>

                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <Checkbox
                        checked={allChecked}
                        onCheckedChange={(checked) =>
                          toggleCategory(perms, Boolean(checked))
                        }
                      />
                      Tout {allChecked ? 'désélectionner' : 'sélectionner'}
                    </label>
                  </div>

                  {/* PERMISSIONS LIST */}
                  <div className="grid sm:grid-cols-2 gap-2 p-3">
                    {perms.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-start gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedPermissionIds.has(perm.id)}
                          onCheckedChange={(checked) =>
                            togglePermission(perm.id, Boolean(checked))
                          }
                        />

                        <div>
                          <p className="text-sm font-medium">
                            {perm.label}
                          </p>
                          {perm.description && (
                            <p className="text-xs text-slate-500">
                              {perm.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                </div>
              )
            })}
          </div>
        </section>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>

          <Button type="submit" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>

      </div>

      {/* PREVIEW */}
      <aside className="space-y-4">
        <section className="border rounded-lg bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Aperçu</h2>

          <span
            className="text-white px-3 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: form.color }}
          >
            {form.name || 'Nom du rôle'}
          </span>

          {!form.active && (
            <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
              Inactif
            </span>
          )}

          <p className="mt-3 text-sm text-slate-500">
            {form.description || 'Aucune description.'}
          </p>
        </section>
      </aside>

    </form>
  )
}