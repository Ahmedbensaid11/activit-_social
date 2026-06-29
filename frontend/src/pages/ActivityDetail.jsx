import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        setActivity(await activitiesApi.get(id))
      } catch (error) {
        toast.error(error.response?.data?.message || 'Activite introuvable')
      } finally {
        setLoading(false)
      }
    }

    load()
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

  const register = async () => {
    setRegistering(true)
    try {
      await registrationsApi.register(activity.id)
      toast.success('Inscription envoyee. Statut: en attente.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Inscription impossible')
    } finally {
      setRegistering(false)
    }
  }

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

            <aside className="rounded-lg border bg-slate-50 p-4">
              <div className="grid gap-3 text-sm text-slate-700">
                <span className="flex gap-2"><CalendarDays className="size-4 text-blue-700" />Debut: {formatDate(activity.startsAt)}</span>
                <span className="flex gap-2"><CalendarDays className="size-4 text-blue-700" />Fin: {formatDate(activity.endsAt)}</span>
                <span className="flex gap-2"><MapPin className="size-4 text-blue-700" />{activity.location || 'Lieu a definir'}</span>
                <span className="flex gap-2"><Users className="size-4 text-blue-700" />{activity.capacityMax || '-'} places restantes</span>
              </div>
              <Button className="mt-5 w-full" disabled={activity.status !== 'OPEN' || registering} onClick={register}>
                {registering ? 'Inscription...' : "S'inscrire"}
              </Button>
              <p className="mt-2 text-xs text-slate-500">Votre demande sera traitee par un administrateur.</p>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}
