import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import api from '../../api/client'
import logoTT from '../../assets/tt.png'

const registerSchema = z.object({
  matricule: z.string().min(4, 'Matricule doit contenir au moins 4 caractères'),
  nom: z.string().min(2, 'Nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Prénom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  telephone: z.string().min(8, 'Numéro de téléphone invalide'),
  password: z.string().min(8, 'Mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    try {
      const { confirmPassword: _confirmPassword, ...userData } = data
      await api.post('/auth/register', userData)
      setSuccess(true)
      toast.success('Inscription réussie !')
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-emerald-600 bg-white">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 text-2xl font-bold">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Demande Enregistrée</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Un email d'activation a été envoyé à votre adresse professionnelle. Veuillez valider votre compte avant de vous connecter.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all">
              Retourner à l'écran de connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
            Espace Personnel Intranet
          </span>
          <h1 className="text-3xl font-bold tracking-tight leading-tight pt-2">
            Créer un compte <br />
            Agent TT
          </h1>
          <p className="text-blue-100/80 text-sm font-light max-w-sm leading-relaxed">
            Rejoignez la plateforme interne réservée aux agents. Remplissez ce formulaire pour soumettre votre demande d'adhésion aux activités sociales.
          </p>
        </div>

        {/* Bottom: Footer */}
        <div className="z-10 flex flex-col gap-1 border-t border-white/10 pt-4">
          <p className="text-[11px] text-blue-200/70">Département Gestion des Ressources Humaines (GRH)</p>
          <p className="text-[10px] text-blue-300/50">© 2026 Tunisie Telecom. Usage interne uniquement.</p>
        </div>
      </div>

      {/* ── Right Column : Register Form ──────────────────────────────── */}
      <div className="col-span-1 md:col-span-7 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Adhésion</h2>
            <p className="text-sm text-slate-500">Renseignez vos informations professionnelles pour vous inscrire.</p>
          </div>

          {error && (
            <Alert variant="destructive" className="animate-in fade-in duration-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricule" className="text-slate-700 font-medium">Matricule Agent</Label>
                <Input
                  id="matricule"
                  placeholder="Ex: TT12345"
                  className="h-11 border-slate-200 focus-visible:ring-blue-600"
                  disabled={loading}
                  {...register('matricule')}
                />
                {errors.matricule && <p className="text-xs text-red-500 mt-1">{errors.matricule.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telephone" className="text-slate-700 font-medium">Téléphone</Label>
                <Input
                  id="telephone"
                  placeholder="Ex: 99123456"
                  className="h-11 border-slate-200 focus-visible:ring-blue-600"
                  disabled={loading}
                  {...register('telephone')}
                />
                {errors.telephone && <p className="text-xs text-red-500 mt-1">{errors.telephone.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom" className="text-slate-700 font-medium">Nom</Label>
                <Input
                  id="nom"
                  placeholder="Nom"
                  className="h-11 border-slate-200 focus-visible:ring-blue-600"
                  disabled={loading}
                  {...register('nom')}
                />
                {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prenom" className="text-slate-700 font-medium">Prénom</Label>
                <Input
                  id="prenom"
                  placeholder="Prénom"
                  className="h-11 border-slate-200 focus-visible:ring-blue-600"
                  disabled={loading}
                  {...register('prenom')}
                />
                {errors.prenom && <p className="text-xs text-red-500 mt-1">{errors.prenom.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email Professionnel</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@tunisietelecom.tn"
                className="h-11 border-slate-200 focus-visible:ring-blue-600"
                disabled={loading}
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
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
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
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
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all shadow-sm shadow-blue-200 mt-2"
              disabled={loading}
            >
              {loading ? 'Traitement...' : "Demander l'inscription"}
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm text-slate-600">
                Déjà un compte ?{' '}
                <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                  Se connecter
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}