import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  Users, Plus, RefreshCw, Edit, Trash2, ShieldCheck,
  ShieldOff, Search, ChevronLeft, ChevronRight, Loader2,
  X, Eye, EyeOff,
} from 'lucide-react'
import { adminUsersApi } from '../api/adminUsersApi'
import { rolesApi } from '../api/roles'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'

// ── User Form Modal ────────────────────────────────────────────────────────

function UserModal({ user, roles, onSave, onClose, saving }) {
  const isEdit = Boolean(user?.id)
  const [form, setForm] = useState({
    matricule:    user?.matricule    || '',
    nom:          user?.nom          || '',
    prenom:       user?.prenom       || '',
    email:        user?.email        || '',
    telephone:    user?.telephone    || '',
    password:     '',
    role:         user?.role         || 'PERSONNEL',
    active:       user?.active       ?? true,
    customRoleIds: (user?.customRoles || []).map(r => r.id),
    sendActivationEmail: true,
  })
  const [showPwd, setShowPwd] = useState(false)

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const toggleCustomRole = (id) => {
    setForm(f => ({
      ...f,
      customRoleIds: f.customRoleIds.includes(id)
        ? f.customRoleIds.filter(r => r !== id)
        : [...f.customRoleIds, id],
    }))
  }

  const submit = (e) => {
    e.preventDefault()
    const payload = { ...form }
    if (isEdit) {
      // update doesn't need password or matricule
      delete payload.password
      delete payload.matricule
      delete payload.sendActivationEmail
    }
    onSave(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-900">
            {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Matricule — create only */}
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="um-matricule">Matricule</Label>
              <Input
                id="um-matricule"
                placeholder="Ex: EMP002"
                value={form.matricule}
                onChange={e => update('matricule', e.target.value)}
                required
              />
            </div>
          )}

          {/* Nom / Prénom */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="um-prenom">Prénom</Label>
              <Input
                id="um-prenom"
                value={form.prenom}
                onChange={e => update('prenom', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="um-nom">Nom</Label>
              <Input
                id="um-nom"
                value={form.nom}
                onChange={e => update('nom', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="um-email">Email</Label>
            <Input
              id="um-email"
              type="email"
              placeholder="agent@tunisietelecom.tn"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              disabled={isEdit}
              required
            />
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <Label htmlFor="um-tel">Téléphone</Label>
            <Input
              id="um-tel"
              placeholder="12345678"
              maxLength={8}
              value={form.telephone}
              onChange={e => update('telephone', e.target.value)}
            />
          </div>

          {/* Password — create only */}
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="um-pwd">Mot de passe temporaire</Label>
              <div className="relative">
                <Input
                  id="um-pwd"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Min. 8 caractères"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="um-role">Rôle système</Label>
            <select
              id="um-role"
              value={form.role}
              onChange={e => update('role', e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PERSONNEL">Personnel</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 bg-slate-50">
            <div>
              <p className="text-sm font-semibold text-slate-800">Compte actif</p>
              <p className="text-xs text-slate-400">L'utilisateur peut se connecter</p>
            </div>
            <button
              type="button"
              onClick={() => update('active', !form.active)}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${form.active ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${form.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Custom Roles */}
          {roles.length > 0 && (
            <div className="space-y-2">
              <Label>Rôles personnalisés</Label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50">
                {roles.map(r => (
                  <label key={r.id} className="flex items-center gap-2 text-xs cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.customRoleIds.includes(r.id)}
                      onChange={() => toggleCustomRole(r.id)}
                      className="accent-blue-600 w-3.5 h-3.5"
                    />
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: r.color || '#6366f1' }}
                    />
                    <span className="text-slate-700 font-medium truncate">{r.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Send email — create only */}
          {!isEdit && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.sendActivationEmail}
                onChange={e => update('sendActivationEmail', e.target.checked)}
                className="accent-blue-600 w-4 h-4"
              />
              <span className="text-slate-700">Envoyer les identifiants par email</span>
            </label>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Enregistrement...</>
                : isEdit ? 'Enregistrer' : 'Créer le compte'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────

function DeleteModal({ user, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-sm p-6 space-y-4">
        <h3 className="text-lg font-black text-slate-900">Supprimer l'utilisateur</h3>
        <p className="text-sm text-slate-500">
          Êtes-vous sûr de vouloir supprimer <strong>{user.prenom} {user.nom}</strong> ? Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">Annuler</Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function UsersAdmin() {
  const { t } = useTranslation()

  const [users, setUsers]       = useState([])
  const [roles, setRoles]       = useState([])
  const [page, setPage]         = useState(0)
  const [totalPages, setTotal]  = useState(0)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [modalUser, setModalUser]   = useState(null) // null = closed, {} = create, {...} = edit
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback((p = 0) => {
    setLoading(true)
    const params = { page: p, size: 15 }
    if (search.trim()) params.search = search.trim()
    adminUsersApi.list(params)
      .then(res => {
        setUsers(res.content || [])
        setTotal(res.totalPages || 0)
        setPage(res.number || 0)
      })
      .catch(() => toast.error(t('common_error')))
      .finally(() => setLoading(false))
  }, [search, t])

  useEffect(() => { load(0) }, [load])

  useEffect(() => {
    rolesApi.list().then(setRoles).catch(() => {})
  }, [])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modalUser?.id) {
        await adminUsersApi.update(modalUser.id, data)
        toast.success('Utilisateur modifié')
      } else {
        await adminUsersApi.create(data)
        toast.success('Compte créé')
      }
      setModalUser(null)
      load(page)
    } catch (err) {
      toast.error(err.response?.data?.message || t('common_error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await adminUsersApi.delete(deleteTarget.id)
      toast.success('Utilisateur supprimé')
      setDeleteTarget(null)
      load(page)
    } catch (err) {
      toast.error(err.response?.data?.message || t('common_error'))
    } finally {
      setDeleting(false)
    }
  }

  const handleToggle = async (u) => {
    try {
      await adminUsersApi.toggle(u.id, !u.active)
      toast.success(u.active ? 'Compte désactivé' : 'Compte activé')
      load(page)
    } catch (err) {
      toast.error(err.response?.data?.message || t('common_error'))
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des utilisateurs</h1>
            <p className="text-sm text-slate-500 mt-0.5">Créez et gérez les comptes agents</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => load(0)}>
            <RefreshCw className="w-4 h-4" /> Actualiser
          </Button>
          <Button onClick={() => setModalUser({})}>
            <Plus className="w-4 h-4" /> Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou matricule…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(0)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-400 text-sm gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Chargement…
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Users className="w-12 h-12 text-slate-200" />
            <p className="text-sm font-medium">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide font-bold">
                  <th className="px-6 py-4 text-left">Utilisateur</th>
                  <th className="px-4 py-4 text-left">Matricule</th>
                  <th className="px-4 py-4 text-left">Rôle</th>
                  <th className="px-4 py-4 text-left">Rôles personnalisés</th>
                  <th className="px-4 py-4 text-center">Statut</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Utilisateur */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                          {(u.prenom?.[0] || '') + (u.nom?.[0] || '')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.prenom} {u.nom}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Matricule */}
                    <td className="px-4 py-4 font-mono text-xs text-slate-600 font-semibold">
                      {u.matricule}
                    </td>

                    {/* Rôle système */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full
                        ${u.role === 'ADMIN'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-600'}`}>
                        {u.role === 'ADMIN' ? <ShieldCheck className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {u.role}
                      </span>
                    </td>

                    {/* Custom roles */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(u.customRoles || []).length === 0 ? (
                          <span className="text-xs text-slate-300">—</span>
                        ) : (u.customRoles || []).map(r => (
                          <span
                            key={r.id}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: r.color || '#6366f1' }}
                          >
                            {r.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full
                        ${u.active
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-red-100 text-red-700 border border-red-200'}`}>
                        {u.active ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                        {u.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Toggle active */}
                        <button
                          onClick={() => handleToggle(u)}
                          title={u.active ? 'Désactiver' : 'Activer'}
                          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all
                            ${u.active
                              ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'}`}
                        >
                          {u.active ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          {u.active ? 'Désactiver' : 'Activer'}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => setModalUser(u)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => load(page - 1)}
            disabled={page === 0}
            className="flex items-center gap-1 text-sm font-semibold text-slate-600 disabled:opacity-30 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-500">{page + 1} / {totalPages}</span>
          <button
            onClick={() => load(page + 1)}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 text-sm font-semibold text-slate-600 disabled:opacity-30 hover:text-slate-900 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      {modalUser !== null && (
        <UserModal
          user={modalUser?.id ? modalUser : null}
          roles={roles}
          onSave={handleSave}
          onClose={() => setModalUser(null)}
          saving={saving}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}