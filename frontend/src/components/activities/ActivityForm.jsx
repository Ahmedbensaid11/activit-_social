import React, { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Star, Trash2, Upload } from 'lucide-react'
import { activitiesApi } from '../../api/activities'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import DynamicFormRenderer from '../activityTypes/DynamicFormRenderer'

const STATUSES = ['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED']

const toInputDateTime = (value) => {
  if (!value) return ''
  return value.slice(0, 16)
}

const toApiDateTime = (value) => {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

export default function ActivityForm({ activityTypes, initialValue, saving, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({
    activityTypeId: initialValue?.activityType?.id || activityTypes[0]?.id || '',
    title: initialValue?.title || '',
    description: initialValue?.description || '',
    location: initialValue?.location || '',
    startsAt: toInputDateTime(initialValue?.startsAt),
    endsAt: toInputDateTime(initialValue?.endsAt),
    registrationDeadline: toInputDateTime(initialValue?.registrationDeadline),
    capacityMax: initialValue?.capacityMax || '',
    coverPhotoUrl: initialValue?.coverPhotoUrl || '',
    status: initialValue?.status || 'OPEN',
  }))
  const [customValues, setCustomValues] = useState(initialValue?.customFieldValues || {})
  const [galleryUrls, setGalleryUrls] = useState(initialValue?.galleryPhotoUrls || [])
  const [uploading, setUploading] = useState(false)

  const selectedType = useMemo(
    () => activityTypes.find((type) => String(type.id) === String(form.activityTypeId)),
    [activityTypes, form.activityTypeId]
  )

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const uploadPhotos = async (files) => {
    const selectedFiles = Array.from(files || [])
    if (!selectedFiles.length) return

    setUploading(true)
    try {
      const uploaded = []
      for (const file of selectedFiles) {
        const response = await activitiesApi.uploadPhoto(file)
        uploaded.push(response.url)
      }
      setGalleryUrls((current) => [...current, ...uploaded])
      if (!form.coverPhotoUrl && uploaded[0]) {
        updateForm('coverPhotoUrl', uploaded[0])
      }
      toast.success(uploaded.length > 1 ? 'Photos ajoutees' : 'Photo ajoutee')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload impossible')
    } finally {
      setUploading(false)
    }
  }

  const submit = (event) => {
    event.preventDefault()
    onSubmit({
      activityTypeId: Number(form.activityTypeId),
      title: form.title,
      description: form.description,
      location: form.location,
      startsAt: toApiDateTime(form.startsAt),
      endsAt: toApiDateTime(form.endsAt),
      registrationDeadline: toApiDateTime(form.registrationDeadline),
      capacityMax: form.capacityMax ? Number(form.capacityMax) : null,
      coverPhotoUrl: form.coverPhotoUrl || galleryUrls[0] || null,
      status: form.status,
      customFieldValues: customValues,
      galleryPhotoUrls: galleryUrls.map((url) => url.trim()).filter(Boolean),
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Informations activite</h2>
            <p className="text-sm text-slate-500">Base commune a tous les types: sport, excursion, hotel, cinema.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                value={form.activityTypeId}
                onChange={(event) => {
                  updateForm('activityTypeId', event.target.value)
                  setCustomValues({})
                }}
                required
              >
                {activityTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                value={form.status}
                onChange={(event) => updateForm('status', event.target.value)}
              >
                {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Titre</Label>
              <Input value={form.title} onChange={(event) => updateForm('title', event.target.value)} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(event) => updateForm('description', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input value={form.location} onChange={(event) => updateForm('location', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Capacite maximale</Label>
              <Input type="number" min="1" value={form.capacityMax} onChange={(event) => updateForm('capacityMax', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date debut</Label>
              <Input type="datetime-local" value={form.startsAt} onChange={(event) => updateForm('startsAt', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input type="datetime-local" value={form.endsAt} onChange={(event) => updateForm('endsAt', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Limite inscription</Label>
              <Input type="datetime-local" value={form.registrationDeadline} onChange={(event) => updateForm('registrationDeadline', event.target.value)} />
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Champs specifiques</h2>
            <p className="text-sm text-slate-500">Formulaire genere depuis le schema du type selectionne.</p>
          </div>
          <DynamicFormRenderer
            schema={selectedType?.customFieldsSchema}
            values={customValues}
            onChange={setCustomValues}
          />
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Galerie photos</h2>
              <p className="text-sm text-slate-500">Choisissez des images. Elles seront enregistrees par le backend.</p>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
            <Label htmlFor="activity-photos" className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center">
              {uploading ? (
                <Loader2 className="size-7 animate-spin text-blue-700" />
              ) : (
                <Upload className="size-7 text-blue-700" />
              )}
              <span className="text-sm font-medium text-slate-800">
                {uploading ? 'Upload en cours...' : 'Cliquer pour ajouter des photos'}
              </span>
              <span className="text-xs text-slate-500">JPG, PNG, WEBP ou GIF - max 5 Mo par fichier</span>
            </Label>
            <Input
              id="activity-photos"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(event) => {
                uploadPhotos(event.target.files)
                event.target.value = ''
              }}
            />
          </div>

          {galleryUrls.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {galleryUrls.map((url, index) => (
                <div key={url} className="group relative overflow-hidden rounded-lg border bg-white">
                  <img src={url} alt="" className="aspect-video w-full object-cover" />
                  {form.coverPhotoUrl === url && (
                    <span className="absolute left-2 top-2 rounded-md bg-blue-700 px-2 py-1 text-xs font-medium text-white">
                      Cover
                    </span>
                  )}
                  <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => updateForm('coverPhotoUrl', url)}
                    >
                      <Star className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={index === 0}
                      onClick={() => setGalleryUrls((current) => {
                        const next = [...current]
                        const previous = next[index - 1]
                        next[index - 1] = next[index]
                        next[index] = previous
                        return next
                      })}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={index === galleryUrls.length - 1}
                      onClick={() => setGalleryUrls((current) => {
                        const next = [...current]
                        const following = next[index + 1]
                        next[index + 1] = next[index]
                        next[index] = following
                        return next
                      })}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => {
                        setGalleryUrls((current) => current.filter((currentUrl) => currentUrl !== url))
                        if (form.coverPhotoUrl === url) {
                          updateForm('coverPhotoUrl', galleryUrls.find((currentUrl) => currentUrl !== url) || '')
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
        </div>
      </div>

      <aside className="space-y-4">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ImagePlus className="size-5 text-blue-700" />
            <h2 className="text-lg font-semibold text-slate-900">Apercu galerie</h2>
          </div>
          <div className="grid gap-3">
            {galleryUrls.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-slate-50 p-4 text-sm text-slate-500">Aucune photo ajoutee.</div>
            ) : galleryUrls.map((url) => (
              <div key={url} className="relative">
                <img src={url} alt="" className="aspect-video w-full rounded-lg border object-cover" />
                {form.coverPhotoUrl === url && (
                  <span className="absolute left-2 top-2 rounded-md bg-blue-700 px-2 py-1 text-xs font-medium text-white">
                    Cover
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </aside>
    </form>
  )
}
