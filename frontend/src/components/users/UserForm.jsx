import { useState } from 'react'

export default function UserForm({
  initialValue,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState({
    matricule: initialValue?.matricule || '',
    nom: initialValue?.nom || '',
    prenom: initialValue?.prenom || '',
    email: initialValue?.email || '',
    telephone: initialValue?.telephone || '',
    password: '',
    role: initialValue?.role || 'PERSONNEL',
    active: initialValue?.active ?? true,
  })

  const update = (key, value) =>
    setForm({
      ...form,
      [key]: value,
    })

  const submit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4"
    >

      <input
        className="w-full border p-2"
        placeholder="Matricule"
        value={form.matricule}
        onChange={(e) =>
          update(
            'matricule',
            e.target.value
          )
        }
      />

      <input
        className="w-full border p-2"
        placeholder="Nom"
        value={form.nom}
        onChange={(e) =>
          update(
            'nom',
            e.target.value
          )
        }
      />

      <input
        className="w-full border p-2"
        placeholder="Prénom"
        value={form.prenom}
        onChange={(e) =>
          update(
            'prenom',
            e.target.value
          )
        }
      />

      <input
        className="w-full border p-2"
        placeholder="Email"
        value={form.email}
        onChange={(e) =>
          update(
            'email',
            e.target.value
          )
        }
      />

      <input
        className="w-full border p-2"
        placeholder="Téléphone"
        value={form.telephone}
        onChange={(e) =>
          update(
            'telephone',
            e.target.value
          )
        }
      />

      {!initialValue && (
        <input
          className="w-full border p-2"
          type="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={(e) =>
            update(
              'password',
              e.target.value
            )
          }
        />
      )}

      <select
        className="w-full border p-2"
        value={form.role}
        onChange={(e) =>
          update(
            'role',
            e.target.value
          )
        }
      >
        <option value="ADMIN">
          ADMIN
        </option>

        <option value="PERSONNEL">
          PERSONNEL
        </option>
      </select>

      <div className="flex gap-3">

        <button
          type="button"
          onClick={onCancel}
        >
          Annuler
        </button>

        <button type="submit">
          Enregistrer
        </button>

      </div>

    </form>
  )
}