import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
  User, Camera, Trash2, Lock, Mail, Phone, BadgeCheck, CalendarDays, Loader2,
  Shield, Eye, EyeOff, Upload, KeyRound, Sparkles, CheckCircle2,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { usersApi } from '../api/users'
import { authStore } from '../stores/authStore'

const profileSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire').max(50),
  prenom: z.string().min(1, 'Le prénom est obligatoire').max(50),
  telephone: z.string().max(20, 'Maximum 20 caractères'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères')
    .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

const fmtDate = (v) =>
  v ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(v)) : '—'

function SectionHeader({ icon: Icon, title, description, gradient }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${gradient}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  )
}

function InfoTile({ icon: Icon, label, value, accent = 'blue' }) {
  const accents = {
    blue: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900',
    violet: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900',
  }
  return (
    <div className={`rounded-2xl border p-4 transition-all hover:shadow-md ${accents[accent]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 opacity-80" />
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</p>
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate" title={value}>
        {value}
      </p>
    </div>
  )
}

function PasswordField({ id, label, register, error, disabled, show, onToggle }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-slate-700 dark:text-slate-300 font-medium">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder="••••••••"
          className="h-11 pr-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 focus-visible:ring-blue-500"
          {...register(id)}
          disabled={disabled}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
      <div className="h-52 rounded-3xl bg-slate-200 dark:bg-slate-700" />
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-3 space-y-4">
          <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const { t } = useTranslation()
  const setUser = authStore((state) => state.setUser)
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { nom: '', prenom: '', telephone: '' },
  })

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const newPasswordValue = passwordForm.watch('newPassword') || ''

  const syncUserStore = (data) => {
    setUser({
      id: data.id,
      matricule: data.matricule,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      role: data.role,
      photoUrl: data.photoUrl,
    })
  }

  const loadProfile = () => {
    setLoading(true)
    usersApi.getProfile()
      .then((data) => {
        setProfile(data)
        profileForm.reset({
          nom: data.nom || '',
          prenom: data.prenom || '',
          telephone: data.telephone || '',
        })
        syncUserStore(data)
      })
      .catch(() => toast.error(t('profile_load_error')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProfile() }, [])

  const fullName = profile ? `${profile.prenom || ''} ${profile.nom || ''}`.trim() : ''
  const initials = profile
    ? `${profile.prenom?.[0] || ''}${profile.nom?.[0] || ''}`.toUpperCase()
    : '?'
  const isAdmin = profile?.role === 'ADMIN'

  const handlePhotoFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile_photo_invalid'))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('profile_photo_too_large'))
      return
    }
    setUploadingPhoto(true)
    try {
      const updated = await usersApi.uploadPhoto(file)
      setProfile(updated)
      syncUserStore(updated)
      toast.success(t('profile_photo_updated'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('common_error'))
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onPhotoSelect = (e) => handlePhotoFile(e.target.files?.[0])

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handlePhotoFile(e.dataTransfer.files?.[0])
  }

  const onDeletePhoto = async () => {
    setUploadingPhoto(true)
    try {
      const updated = await usersApi.deletePhoto()
      setProfile(updated)
      syncUserStore(updated)
      toast.success(t('profile_photo_removed'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('common_error'))
    } finally {
      setUploadingPhoto(false)
    }
  }

  const onSaveProfile = async (data) => {
    setSavingProfile(true)
    try {
      const updated = await usersApi.updateProfile(data)
      setProfile(updated)
      syncUserStore(updated)
      toast.success(t('profile_saved'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('common_error'))
    } finally {
      setSavingProfile(false)
    }
  }

  const onChangePassword = async (data) => {
    setSavingPassword(true)
    try {
      await usersApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      passwordForm.reset()
      setShowCurrent(false)
      setShowNew(false)
      setShowConfirm(false)
      toast.success(t('profile_password_changed'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('common_error'))
    } finally {
      setSavingPassword(false)
    }
  }

  const passwordRules = [
    { ok: newPasswordValue.length >= 8, label: t('profile_rule_length') },
    { ok: /[A-Z]/.test(newPasswordValue), label: t('profile_rule_upper') },
    { ok: /[a-z]/.test(newPasswordValue), label: t('profile_rule_lower') },
    { ok: /[0-9]/.test(newPasswordValue), label: t('profile_rule_digit') },
  ]

  if (loading) return <ProfileSkeleton />

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-8">

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0066cc] via-[#0052a3] to-[#312e81] shadow-xl shadow-blue-900/20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-blue-300/20 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.15)_100%)]" />
        </div>

        <div className="relative px-6 pt-8 pb-6 sm:px-10 sm:pt-10 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            {/* Avatar */}
            <div className="relative shrink-0 mx-auto sm:mx-0">
              <div className="p-1 rounded-full bg-gradient-to-br from-white/80 to-white/30 shadow-2xl">
                <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-white/90 shadow-inner">
                  <AvatarImage src={profile?.photoUrl || undefined} alt={initials} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-600 text-white text-3xl font-black">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              {profile?.photoUrl && (
                <span className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </span>
              )}
            </div>

            {/* Identity */}
            <div className="flex-1 text-center sm:text-left pb-1">
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-3">
                <Sparkles className="w-3 h-3 text-blue-200" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100">
                  {t('profile_label')}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{fullName}</h1>
              <p className="text-blue-200/90 text-sm mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {profile?.email}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide
                  ${isAdmin
                    ? 'bg-indigo-500/30 text-indigo-100 border border-indigo-400/30'
                    : 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/30'}`}>
                  <Shield className="w-3 h-3" />
                  {t(isAdmin ? 'role_admin' : 'role_employee')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-white/10 text-blue-100 border border-white/15">
                  <CalendarDays className="w-3 h-3" />
                  {t('profile_member_since')} {fmtDate(profile?.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Photo upload card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <SectionHeader
              icon={Camera}
              title={t('profile_photo_section')}
              description={t('profile_photo_hint')}
              gradient="bg-gradient-to-br from-blue-500 to-blue-700"
            />

            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all
                ${dragOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.01]'
                  : 'border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onPhotoSelect}
              />
              {uploadingPhoto ? (
                <div className="py-6 flex flex-col items-center gap-2 text-blue-600">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-sm font-medium">{t('profile_uploading')}</p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {t('profile_drop_photo')}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{t('profile_photo_hint')}</p>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                type="button"
                size="sm"
                disabled={uploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200 dark:shadow-none"
              >
                <Camera className="w-4 h-4 mr-1.5" />
                {t('profile_change_photo')}
              </Button>
              {profile?.photoUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingPhoto}
                  onClick={onDeletePhoto}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Read-only info tiles */}
          <div className="grid grid-cols-2 gap-3">
            <InfoTile icon={BadgeCheck} label={t('profile_matricule')} value={profile?.matricule} accent="blue" />
            <InfoTile icon={Mail} label={t('profile_email')} value={profile?.email} accent="indigo" />
            <InfoTile
              icon={Shield}
              label={t('profile_role')}
              value={t(isAdmin ? 'role_admin' : 'role_employee')}
              accent="emerald"
            />
            <InfoTile icon={Phone} label={t('profile_telephone')} value={profile?.telephone || '—'} accent="violet" />
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-3 space-y-4">

          {/* Edit profile */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
            <SectionHeader
              icon={User}
              title={t('profile_info_section')}
              description={t('profile_edit_hint')}
              gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
            />

            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom" className="text-slate-700 dark:text-slate-300 font-medium">
                    {t('profile_prenom')}
                  </Label>
                  <Input
                    id="prenom"
                    className="h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                    {...profileForm.register('prenom')}
                    disabled={savingProfile}
                  />
                  {profileForm.formState.errors.prenom && (
                    <p className="text-xs text-red-500">{profileForm.formState.errors.prenom.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom" className="text-slate-700 dark:text-slate-300 font-medium">
                    {t('profile_nom')}
                  </Label>
                  <Input
                    id="nom"
                    className="h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                    {...profileForm.register('nom')}
                    disabled={savingProfile}
                  />
                  {profileForm.formState.errors.nom && (
                    <p className="text-xs text-red-500">{profileForm.formState.errors.nom.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone" className="text-slate-700 dark:text-slate-300 font-medium">
                  {t('profile_telephone')}
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="telephone"
                    className="h-11 pl-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                    placeholder="12345678"
                    maxLength={20}
                    {...profileForm.register('telephone')}
                    disabled={savingProfile}
                  />
                </div>
                {profileForm.formState.errors.telephone && (
                  <p className="text-xs text-red-500">{profileForm.formState.errors.telephone.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 dark:shadow-none font-semibold"
                >
                  {savingProfile
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t('profile_saving')}</>
                    : t('common_save')}
                </Button>
              </div>
            </form>
          </div>

          {/* Password */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
            <SectionHeader
              icon={KeyRound}
              title={t('profile_password_section')}
              description={t('profile_password_hint')}
              gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            />

            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
              <PasswordField
                id="currentPassword"
                label={t('profile_current_password')}
                register={passwordForm.register}
                error={passwordForm.formState.errors.currentPassword}
                disabled={savingPassword}
                show={showCurrent}
                onToggle={() => setShowCurrent((v) => !v)}
              />
              <PasswordField
                id="newPassword"
                label={t('profile_new_password')}
                register={passwordForm.register}
                error={passwordForm.formState.errors.newPassword}
                disabled={savingPassword}
                show={showNew}
                onToggle={() => setShowNew((v) => !v)}
              />
              <PasswordField
                id="confirmPassword"
                label={t('profile_confirm_password')}
                register={passwordForm.register}
                error={passwordForm.formState.errors.confirmPassword}
                disabled={savingPassword}
                show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
              />

              {/* Password strength hints */}
              {newPasswordValue.length > 0 && (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('profile_password_rules')}</p>
                  {passwordRules.map((rule) => (
                    <div key={rule.label} className="flex items-center gap-2 text-xs">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0
                        ${rule.ok ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
                        {rule.ok && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <span className={rule.ok ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500'}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-400">
                  {t('profile_forgot_hint')}{' '}
                  <Link to="/forgot-password" className="text-blue-600 hover:underline font-semibold">
                    {t('profile_forgot_link')}
                  </Link>
                </p>
                <Button
                  type="submit"
                  disabled={savingPassword}
                  className="h-11 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-orange-200 dark:shadow-none font-semibold shrink-0"
                >
                  {savingPassword
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t('profile_changing_password')}</>
                    : <><Lock className="w-4 h-4 mr-2" />{t('profile_change_password')}</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
