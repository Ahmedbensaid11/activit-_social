import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../ui/button'
import api from '../../api/client'
import logoTT from '../../assets/tt.png'

export default function ActivateAccount() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'

  useEffect(() => {
    const activate = async () => {
      if (!token) {
        setStatus('error')
        return
      }
      try {
        await api.get(`/auth/activate?token=${token}`)
        setStatus('success')
      } catch {
        setStatus('error')
      }
    }
    activate()
  }, [token])

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
            Validation Système
          </span>
          <h1 className="text-3xl font-bold tracking-tight leading-tight pt-2">
            Vérification de <br />
            votre profil
          </h1>
          <p className="text-blue-100/80 text-sm font-light max-w-sm leading-relaxed">
            Étape de sécurisation finale visant à confirmer l'authenticité de votre boîte aux lettres professionnelle @tunisietelecom.tn.
          </p>
        </div>

        {/* Bottom: Footer */}
        <div className="z-10 flex flex-col gap-1 border-t border-white/10 pt-4">
          <p className="text-[11px] text-blue-200/70">Département Gestion des Ressources Humaines (GRH)</p>
          <p className="text-[10px] text-blue-300/50">© 2026 Tunisie Telecom. Usage interne uniquement.</p>
        </div>
      </div>

      {/* ── Right Column : Status ─────────────────────────────────────── */}
      <div className="col-span-1 md:col-span-7 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6 text-center">

          {status === 'loading' && (
            <div className="space-y-4 animate-pulse">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <h2 className="text-2xl font-bold text-slate-800">Traitement en cours</h2>
              <p className="text-sm text-slate-500">Validation de votre jeton d'accès intranet...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 text-3xl font-bold shadow-sm">
                ✓
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">E-mail Validé !</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Votre adresse e-mail a été authentifiée. Votre demande est maintenant accessible au département GRH pour activation finale de vos droits.
                </p>
              </div>
              <Button onClick={() => navigate('/login')} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all shadow-sm">
                Se connecter à l'intranet
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-2xl font-bold shadow-sm">
                ✕
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Lien expiré ou invalide</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Ce jeton de validation est expiré ou corrompu. Si le problème persiste, veuillez vous rapprocher de la cellule RH de Nabeul.
                </p>
              </div>
              <Button onClick={() => navigate('/login')} className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white font-medium shadow-sm">
                Retour à la page de connexion
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}