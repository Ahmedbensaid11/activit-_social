import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import api from '../../api/client'
import logoTT from '../../assets/tt.png'

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères')
    .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetPasswordSchema)
  })

  const onSubmit = async (data) => {
    if (!token) {
      setError('Le jeton de sécurité est manquant ou invalide.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { token, newPassword: data.password })
      toast.success('Mot de passe mis à jour avec succès !')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Le lien a expiré ou est invalide.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-slate-50">

      {/* ── Left Column : Brand & Identity ───────────────────────────── */}
      <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-[#0066cc] via-[#0052a3] to-[#003d7a] p-12 flex-col justify-between text-white relative overflow-hidden">

        {/* Background radial glow */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-white via-transparent to-transparent z-0" />

        {/* Large centered logo watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none z-0">
          <img
            src={logoTT}
            alt=""
            className="w-[420px] h-[420px] object-contain select-none"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* Secondary logo accent — bottom right */}
        <div className="absolute -bottom-16 -right-16 opacity-[0.06] pointer-events-none z-0">
          <img
            src={logoTT}
            alt=""
            className="w-64 h-64 object-contain select-none"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* Top: Logo + Brand name */}
        <div className="flex items-center gap-3 z-10">
          <div className="bg-white p-2 w-12 h-12 rounded-full flex items-center justify-center shadow-md">
            <img src={logoTT} alt="Tunisie Telecom" className="w-8 h-8 object-contain" />
          </div>
          <div className="h-8 w-[1px] bg-white/30" />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Tunisie Telecom</span>
            <span className="text-[10px] text-blue-300">Direction Régionale Nabeul</span>
          </div>
        </div>

        {/* Middle: Headline & Description */}
        <div className="z-10 space-y-4">
          <span className="bg-white/10 text-blue-100 text-xs font-medium px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/10">
            Sécurité Intranet
          </span>
          <h1 className="text-3xl font-bold tracking-tight leading-tight pt-2">
            Mise à jour <br />
            de sécurité
          </h1>
          <p className="text-blue-100/80 text-sm font-light max-w-sm leading-relaxed">
            Veuillez définir votre nouveau mot de passe pour rétablir en toute sécurité vos accès personnels aux activités sociales.
          </p>
        </div>

        {/* Bottom: Footer */}
        <div className="z-10 flex flex-col gap-1 border-t border-white/10 pt-4">
          <p className="text-[11px] text-blue-200/70">Département Gestion des Ressources Humaines (GRH)</p>
          <p className="text-[10px] text-blue-300/50">© 2026 Tunisie Telecom. Usage interne uniquement.</p>
        </div>
      </div>

      {/* ── Right Column : Form ───────────────────────────────────────── */}
      <div className="col-span-1 md:col-span-7 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Nouveau mot de passe</h2>
            <p className="text-sm text-slate-500">Choisissez un mot de passe robuste combinant chiffres et lettres.</p>
          </div>

          {error && (
            <Alert variant="destructive" className="animate-in fade-in duration-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11 border-slate-200 focus-visible:ring-blue-600"
                disabled={loading}
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="h-11 border-slate-200 focus-visible:ring-blue-600"
                disabled={loading}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all shadow-sm shadow-blue-200"
              disabled={loading}
            >
              {loading ? 'Modification...' : 'Enregistrer le nouveau mot de passe'}
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-sm text-blue-600 hover:underline font-semibold">
                Retourner à la connexion
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}