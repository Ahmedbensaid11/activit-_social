import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Users, UserPlus } from 'lucide-react'
import { activitiesApi } from '../api/activities'
import { registrationsApi } from '../api/registrations'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'

const formatDate = (value) => {
  if (!value) return 'A definir'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value))
}

export default function ActivityDetail() {
  const { id } = useParams()
  const [activity, setActivity] = useState(null)
  const [seats, setSeats] = useState(null) // { capacityMax, reservedSeats, availableSeats, unlimited }
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [seatCount, setSeatCount] = useState(1)

  const loadActivity = async () => {
    setLoading(true)
    try {
      const data = await activitiesApi.get(id)
      setActivity(data)
      // Fetch available seats separately
      try {
        const seatsData = await registrationsApi.availableSeats(id)
        setSeats(seatsData)
      } catch {
        // fallback: no seats info
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Activite introuvable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivity()
  }, [id])

  const photos = useMemo(() => {
    if (!activity) return []
    const urls = [activity.coverPhotoUrl, ...(activity.galleryPhotoUrls || [])].filter(Boolean)
    return [...new Set(urls)]
  }, [activity])

  const dynamicFields = useMemo(() => {
    if (!activity?.activityType?.customFieldsSchema) return []
    return Object.entries(activity.activityType.customFieldsSchema).map(([key, field]) => ({
      key,
      label: field.label,
      value: activity.customFieldValues?.[key],
    })).filter((field) => field.value !== undefined && field.value !== null && String(field.value).trim() !== '')
  }, [activity])

  if (loading) {
    return <main className="min-h-screen bg-slate-50 p-8 text-sm text-slate-500">Chargement...</main>
  }

  if (!activity) {
    return <main className="min-h-screen bg-slate-50 p-8 text-sm text-slate-500">Activite introuvable.</main>
  }

  const activePhoto = photos[activePhotoIndex]

  // Determine seats display
  const isUnlimited = seats?.unlimited === true
  const availableSeats = seats?.availableSeats ?? null
  const isFull = !isUnlimited && availableSeats !== null && availableSeats === 0
  const isOpen = activity.status === 'OPEN'
  const canRegister = isOpen && !isFull
  const maxSeatsAllowed = isUnlimited
    ? 10
    : Math.min(availableSeats ?? 1, 10)

  const register = async () => {
    if (seatCount < 1) {
      toast.error('Veuillez indiquer au moins 1 place.')
      return
    }
    if (!isUnlimited && availableSeats !== null && seatCount > availableSeats) {
      toast.error(`Seulement ${availableSeats} place(s) disponible(s).`)
      return
    }
    setRegistering(true)
    try {
      await registrationsApi.register(activity.id, {}, seatCount)
      toast.success('Inscription envoyee. Statut: en attente.')
      // Refresh seats after registration
      try {
        const seatsData = await registrationsApi.availableSeats(id)
        setSeats(seatsData)
      } catch { /* ignore */ }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Inscription impossible')
    } finally {
      setRegistering(false)
    }
  }

  const seatsLabel = isUnlimited
    ? 'Places illimitées'
    : availableSeats !== null
      ? `${availableSeats} place(s) disponible(s) sur ${seats?.capacityMax ?? '?'}`
      : activity.capacityMax
        ? `${activity.capacityMax} places max`
        : 'Places non limitées'

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link to="/activities" className="mb-4 inline-block text-sm text-blue-700 hover:underline">
          Retour au catalogue
        </Link>

        <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="relative aspect-[16/7] bg-slate-100">
            {activePhoto ? (
              <img src={activePhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">Aucune photo</div>
            )}
            {photos.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90"
                  onClick={() => setActivePhotoIndex((current) => (current === 0 ? photos.length - 1 : current - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90"
                  onClick={() => setActivePhotoIndex((current) => (current + 1) % photos.length)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </>
            )}
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge>{activity.activityType?.name}</Badge>
                <Badge variant={activity.status === 'OPEN' ? 'default' : 'secondary'}>{activity.status}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-slate-950">{activity.title}</h1>
              <p className="mt-3 text-slate-600">{activity.description || 'Sans description'}</p>

              {dynamicFields.length > 0 && (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {dynamicFields.map((field) => (
                    <div key={field.key} className="rounded-lg border bg-slate-50 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{field.label}</div>
                      <div className="mt-1 text-sm font-medium text-slate-900">{String(field.value)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <aside className="rounded-lg border bg-slate-50 p-4 space-y-4">
              <div className="grid gap-3 text-sm text-slate-700">
                <span className="flex gap-2"><CalendarDays className="size-4 text-blue-700 shrink-0" />Debut: {formatDate(activity.startsAt)}</span>
                <span className="flex gap-2"><CalendarDays className="size-4 text-blue-700 shrink-0" />Fin: {formatDate(activity.endsAt)}</span>
                <span className="flex gap-2"><MapPin className="size-4 text-blue-700 shrink-0" />{activity.location || 'Lieu a definir'}</span>

                {/* Real-time seats display */}
                <div className="flex items-start gap-2">
                  <Users className="size-4 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-slate-700'}`}>
                      {seatsLabel}
                    </span>
                    {!isUnlimited && seats && (
                      <div className="mt-1 w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-blue-600'}`}
                          style={{
                            width: `${Math.min(100, ((seats.reservedSeats ?? 0) / (seats.capacityMax ?? 1)) * 100)}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Seat count selector */}
              {isOpen && !isFull && (
                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <UserPlus className="size-4 text-blue-600" />
                    Nombre de places
                  </label>
                  <p className="text-xs text-slate-500">
                    Vous + membres de votre famille. Chaque place compte dans la capacité totale.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSeatCount(Math.max(1, seatCount - 1))}
                      className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold transition-colors"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-lg font-bold text-slate-900">{seatCount}</span>
                    <button
                      type="button"
                      onClick={() => setSeatCount(Math.min(maxSeatsAllowed, seatCount + 1))}
                      className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold transition-colors"
                      disabled={seatCount >= maxSeatsAllowed}
                    >
                      +
                    </button>
                    {maxSeatsAllowed > 1 && (
                      <span className="text-xs text-slate-400">max {maxSeatsAllowed}</span>
                    )}
                  </div>
                </div>
              )}

              {isFull && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 font-medium">
                  Capacité maximale atteinte — inscriptions fermées.
                </div>
              )}

              <Button
                className="w-full"
                disabled={!canRegister || registering}
                onClick={register}
              >
                {registering
                  ? 'Inscription...'
                  : isFull
                    ? 'Complet'
                    : !isOpen
                      ? 'Inscriptions fermées'
                      : seatCount > 1
                        ? `S'inscrire (${seatCount} places)`
                        : "S'inscrire"}
              </Button>
              <p className="text-xs text-slate-500">Votre demande sera traitee par un administrateur.</p>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}