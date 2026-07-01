import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import api, { buildUserFromAuthResponse, fetchAndAttachPermissions } from '../../api/client'
import { authStore } from '../../stores/authStore'
import logoTT from '../../assets/tt.png'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/auth/login', data)
      const user = buildUserFromAuthResponse(response)
      authStore.getState().setSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user,
      })

      // Fetch custom-role permissions for non-admin users
      if (user.role !== 'ADMIN') {
        await fetchAndAttachPermissions(user.id, response.accessToken)
      }

      toast.success('Ravi de vous revoir !')
      navigate(user.role === 'ADMIN' ? '/dashboard' : '/')
    } catch (error) {
      setError(error.response?.data?.message || 'Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-slate-50">

      {/* ── Left Column : Brand & Identity ───────────────────────────── */}
      <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-[#0066cc] via-[#0052a3] to-[#003d7a] p-12 flex-col justify-between text-white relative overflow-hidden">

        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-white via-transparent to-transparent z-0" />

        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none z-0">
          <img src={logoTT} alt="" className="w-[420px] h-[420px] object-contain select-none"
            style={{ filter: 'brightness(0) invert(1)' }} />
        </div>

        <div className="absolute -bottom-16 -right-16 opacity-[0.06] pointer-events-none z-0">
          <img src={logoTT} alt="" className="w-64 h-64 object-contain select-none"
            style={{ filter: 'brightness(0) invert(1)' }} />
        </div>

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

        <div className="z-10 space-y-4">
          <span className="bg-white/10 text-blue-100 text-xs font-medium px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/10">
            Espace Personnel Intranet
          </span>
          <h1 className="text-3xl font-bold tracking-tight leading-tight pt-2">
            Gestion des <br />
            Activités Sociales
          </h1>
          <p className="text-blue-100/80 text-sm font-light max-w-sm leading-relaxed">
            Plateforme interne réservée aux agents de Tunisie Telecom. Connectez-vous pour soumettre vos demandes de tickets de restauration, consulter le catalogue sportif ou réserver vos excursions familiales.
          </p>
        </div>

        <div className="z-10 flex flex-col gap-1 border-t border-white/10 pt-4">
          <p className="text-[11px] text-blue-200/70">Département Gestion des Ressources Humaines (GRH)</p>
          <p className="text-[10px] text-blue-300/50">© 2026 Tunisie Telecom. Usage interne uniquement.</p>
        </div>
      </div>

      {/* ── Right Column : Login Form ─────────────────────────────────── */}
      <div className="col-span-1 md:col-span-7 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Connexion</h2>
            <p className="text-sm text-slate-500">Saisissez vos identifiants professionnels pour accéder à votre espace.</p>
          </div>

          {error && (
            <Alert variant="destructive" className="animate-in fade-in duration-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@tunisietelecom.tn"
                className="h-11 border-slate-200 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                disabled={loading}
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-slate-700 font-medium">Mot de passe</Label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline font-medium">
                  Mot de passe oublié ?
                </Link>
              </div>
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

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all shadow-sm shadow-blue-200"
              disabled={loading}
            >
              {loading ? 'Vérification en cours...' : 'Se connecter'}
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm text-slate-600">
                Nouveau sur la plateforme ?{' '}
                <Link to="/register" className="text-blue-600 hover:underline font-semibold">
                  Créer un compte
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

    </div>
  )
}