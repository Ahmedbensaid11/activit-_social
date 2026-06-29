import React, { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import DynamicFormRenderer from './DynamicFormRenderer'

const FIELD_TYPES = ['text', 'number', 'date', 'select', 'radio', 'checkbox', 'textarea']

const emptyField = () => ({
  key: '',
  label: '',
  type: 'text',
  required: false,
  placeholder: '',
  optionsText: '',
})

const schemaToFields = (schema = {}) =>
  Object.entries(schema || {}).map(([key, field]) => ({
    key,
    label: field.label || '',
    type: field.type || 'text',
    required: Boolean(field.required),
    placeholder: field.placeholder || '',
    optionsText: (field.options || []).join(', '),
    min: field.min ?? '',
    max: field.max ?? '',
  }))

const fieldsToSchema = (fields) => {
  const schema = {}
  fields.forEach((field) => {
    const key = field.key.trim()
    if (!key) return
    schema[key] = {
      label: field.label.trim(),
      type: field.type,
      required: Boolean(field.required),
    }
    if (field.placeholder?.trim()) {
      schema[key].placeholder = field.placeholder.trim()
    }
    if (field.optionsText?.trim() && ['select', 'radio'].includes(field.type)) {
      schema[key].options = field.optionsText
        .split(',')
        .map((option) => option.trim())
        .filter(Boolean)
    }
    if (field.min !== '' && field.type === 'number') {
      schema[key].min = Number(field.min)
    }
    if (field.max !== '' && field.type === 'number') {
      schema[key].max = Number(field.max)
    }
  })
  return schema
}

export default function ActivityTypeForm({ initialValue, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(() => ({
    name: initialValue?.name || '',
    code: initialValue?.code || '',
    description: initialValue?.description || '',
    icon: initialValue?.icon || '',
    active: initialValue?.active ?? true,
  }))
  const [fields, setFields] = useState(() => {
    const existing = schemaToFields(initialValue?.customFieldsSchema)
    return existing.length ? existing : [emptyField()]
  })

  const schema = useMemo(() => fieldsToSchema(fields), [fields])

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const updateField = (index, key, value) => {
    setFields((current) => current.map((field, fieldIndex) => (
      fieldIndex === index ? { ...field, [key]: value } : field
    )))
  }

  const removeField = (index) => {
    setFields((current) => current.filter((_, fieldIndex) => fieldIndex !== index))
  }

  const submit = (event) => {
    event.preventDefault()
    onSubmit({
      ...form,
      code: form.code.trim().toUpperCase(),
      customFieldsSchema: schema,
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Type d'activite</h2>
            <p className="text-sm text-slate-500">Configuration generale visible dans le catalogue.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" value={form.name} onChange={(event) => updateForm('name', event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(event) => updateForm('code', event.target.value.toUpperCase())}
                placeholder="EXCURSION"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icone lucide</Label>
              <Input id="icon" value={form.icon} onChange={(event) => updateForm('icon', event.target.value)} placeholder="MapPinned" />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <Label>Actif</Label>
                <p className="text-xs text-slate-500">Visible pour les prochaines activites.</p>
              </div>
              <Switch checked={form.active} onCheckedChange={(checked) => updateForm('active', checked)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                rows={3}
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Champs dynamiques</h2>
              <p className="text-sm text-slate-500">Ces champs generent automatiquement les formulaires de creation et d'inscription.</p>
            </div>
            <Button type="button" variant="outline" onClick={() => setFields((current) => [...current, emptyField()])}>
              <Plus className="size-4" />
              Champ
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={index} className="rounded-lg border border-slate-200 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_90px_36px]">
                  <div className="space-y-2">
                    <Label>Cle</Label>
                    <Input
                      value={field.key}
                      onChange={(event) => updateField(index, 'key', event.target.value.toLowerCase().replaceAll(' ', '_'))}
                      placeholder="destination"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Libelle</Label>
                    <Input value={field.label} onChange={(event) => updateField(index, 'label', event.target.value)} placeholder="Destination" />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                      value={field.type}
                      onChange={(event) => updateField(index, 'type', event.target.value)}
                    >
                      {FIELD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end gap-2 pb-1">
                    <Switch checked={field.required} onCheckedChange={(checked) => updateField(index, 'required', checked)} />
                    <span className="text-sm text-slate-600">Requis</span>
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeField(index)} disabled={fields.length === 1}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Placeholder</Label>
                    <Input value={field.placeholder} onChange={(event) => updateField(index, 'placeholder', event.target.value)} />
                  </div>
                  {['select', 'radio'].includes(field.type) && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Options separees par virgule</Label>
                      <Input
                        value={field.optionsText}
                        onChange={(event) => updateField(index, 'optionsText', event.target.value)}
                        placeholder="SIMPLE, DOUBLE, TRIPLE"
                      />
                    </div>
                  )}
                  {field.type === 'number' && (
                    <>
                      <div className="space-y-2">
                        <Label>Min</Label>
                        <Input type="number" value={field.min} onChange={(event) => updateField(index, 'min', event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Max</Label>
                        <Input type="number" value={field.max} onChange={(event) => updateField(index, 'max', event.target.value)} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
        </div>
      </div>

      <aside className="space-y-4">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Apercu formulaire</h2>
          <p className="mb-4 text-sm text-slate-500">Rendu automatique depuis le schema JSON.</p>
          <DynamicFormRenderer schema={schema} disabled />
        </section>
        <section className="rounded-lg border bg-slate-950 p-4 text-xs text-slate-100 shadow-sm">
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap">{JSON.stringify(schema, null, 2)}</pre>
        </section>
      </aside>
    </form>
  )
}
