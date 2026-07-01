import {
  useEffect,
  useState,
} from 'react'

import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUser,
} from '../api/adminUsersApi'

import UserForm from '../components/users/UserForm'

export default function UsersAdmin() {

  const [users, setUsers] =
    useState([])

  const [open, setOpen] =
    useState(false)

  const [editing, setEditing] =
    useState(null)

  const load = async () => {
    const res =
      await listUsers({
        page: 0,
        size: 20,
      })

    setUsers(
      res.data.content
    )
  }

  useEffect(() => {
    load()
  }, [])

  const save = async (
    data
  ) => {

    if (editing) {
      await updateUser(
        editing.id,
        data
      )
    } else {
      await createUser(
        data
      )
    }

    setOpen(false)

    load()
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between">

        <h1 className="text-3xl font-bold">
          Gestion utilisateurs
        </h1>

        <button
          onClick={() =>
            setOpen(true)
          }
        >
          Ajouter
        </button>

      </div>

      {open && (
        <UserForm
          initialValue={
            editing
          }
          onSubmit={
            save
          }
          onCancel={() =>
            setOpen(false)
          }
        />
      )}

      <table className="w-full">

        <thead>

        <tr>
          <th>Nom</th>
          <th>Email</th>
          <th>Role</th>
          <th>Actif</th>
          <th></th>
        </tr>

        </thead>

        <tbody>

        {users.map(
          (u) => (

          <tr
            key={u.id}
          >

            <td>
              {u.nom}{' '}
              {u.prenom}
            </td>

            <td>
              {u.email}
            </td>

            <td>
              {u.role}
            </td>

            <td>

              <input
                type="checkbox"
                checked={
                  u.active
                }
                onChange={() =>
                  toggleUser(
                    u.id,
                    !u.active
                  ).then(
                    load
                  )
                }
              />

            </td>

            <td>

              <button
                onClick={() => {
                  setEditing(
                    u
                  )

                  setOpen(
                    true
                  )
                }}
              >
                Edit
              </button>

              <button
                onClick={() =>
                  deleteUser(
                    u.id
                  ).then(
                    load
                  )
                }
              >
                Delete
              </button>

            </td>

          </tr>

        ))}

        </tbody>

      </table>

    </div>
  )
}