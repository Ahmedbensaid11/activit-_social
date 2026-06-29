import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarDays, MapPin, Search } from 'lucide-react'
import { activitiesApi } from '../api/activities'
import { activityTypesApi } from '../api/activityTypes'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'

const formatDate = (value) => {
  if (!value) return 'Date a definir'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function ActivitiesCatalog() {
  const [activities, setActivities] = useState([])
  const [activityTypes, setActivityTypes] = useState([])
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [activityData, typeData] = await Promise.all([
          activitiesApi.list(),
          activityTypesApi.list(),
        ])
        setActivities(activityData.filter((activity) => activity.status !== 'CANCELLED'))
        setActivityTypes(typeData.filter((type) => type.active))
      } catch (error) {
        toast.error(error.response?.data?.message || 'Chargement du catalogue impossible')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesType = typeFilter === 'ALL' || String(activity.activityType?.id) === typeFilter
      const text = `${activity.title} ${activity.description || ''} ${activity.location || ''}`.toLowerCase()
      return matchesType && text.includes(query.toLowerCase())
    })
  }, [activities, typeFilter, query])

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-700">Catalogue</p>
          <h1 className="text-2xl font-bold text-slate-950">Activites sociales disponibles</h1>
          <p className="mt-1 text-sm text-slate-600">Parcourez les activites ouvertes aux inscriptions.</p>
        </header>

        <section className="mb-6 grid gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-[220px_1fr]">
          <select
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="ALL">Tous les types</option>
            {activityTypes.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Rechercher par titre, description ou lieu"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </section>

        {loading ? (
          <div className="rounded-lg border bg-white p-6 text-sm text-slate-500">Chargement...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="rounded-lg border bg-white p-6 text-sm text-slate-500">Aucune activite ouverte ne correspond aux filtres.</div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredActivities.map((activity) => {
              const cover = activity.coverPhotoUrl || activity.galleryPhotoUrls?.[0]
              return (
                <Link key={activity.id} to={`/activities/${activity.id}`} className="overflow-hidden rounded-lg border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="aspect-[16/10] bg-slate-100">
                    {cover ? (
                      <img src={cover} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">Aucune photo</div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-slate-950">{activity.title}</h2>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{activity.description || 'Sans description'}</p>
                      </div>
                      <Badge>{activity.activityType?.name}</Badge>
                    </div>
                    <div className="grid gap-2 text-sm text-slate-600">
                      <span className="flex items-center gap-2"><CalendarDays className="size-4" />{formatDate(activity.startsAt)}</span>
                      <span className="flex items-center gap-2"><MapPin className="size-4" />{activity.location || 'Lieu a definir'}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3 text-sm">
                      <span className="text-slate-500">{activity.capacityMax || '-'} places</span>
                      <Badge variant={activity.status === 'OPEN' ? 'default' : 'secondary'}>{activity.status}</Badge>
                    </div>
                  </div>
                </Link>
              )
            })}
          </section>
        )}
      </div>
    </main>
  )
}
