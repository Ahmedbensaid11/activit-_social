import React from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Checkbox } from '../ui/checkbox'

const fieldEntries = (schema = {}) => Object.entries(schema || {})

export default function DynamicFormRenderer({ schema, values = {}, onChange = () => {}, disabled = false }) {
  const fields = fieldEntries(schema)

  if (!fields.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        Aucun champ configure.
      </div>
    )
  }

  const updateValue = (key, value) => {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="grid gap-4">
      {fields.map(([key, field]) => (
        <div key={key} className="space-y-2">
          <Label htmlFor={`dynamic-${key}`} className="text-slate-700">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </Label>

          {field.type === 'textarea' && (
            <Textarea
              id={`dynamic-${key}`}
              placeholder={field.placeholder}
              value={values[key] || ''}
              disabled={disabled}
              onChange={(event) => updateValue(key, event.target.value)}
            />
          )}

          {(field.type === 'text' || field.type === 'date' || field.type === 'number') && (
            <Input
              id={`dynamic-${key}`}
              type={field.type}
              min={field.min}
              max={field.max}
              placeholder={field.placeholder}
              value={values[key] || ''}
              disabled={disabled}
              onChange={(event) => updateValue(key, event.target.value)}
            />
          )}

          {(field.type === 'select' || field.type === 'radio') && (
            <select
              id={`dynamic-${key}`}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={values[key] || ''}
              disabled={disabled}
              onChange={(event) => updateValue(key, event.target.value)}
            >
              <option value="">Selectionner...</option>
              {(field.options || []).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          )}

          {field.type === 'checkbox' && (
            <div className="flex h-8 items-center gap-2">
              <Checkbox
                id={`dynamic-${key}`}
                checked={Boolean(values[key])}
                disabled={disabled}
                onCheckedChange={(checked) => updateValue(key, Boolean(checked))}
              />
              <span className="text-sm text-slate-500">{field.placeholder || 'Oui / Non'}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
