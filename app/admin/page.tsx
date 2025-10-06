"use client"

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../providers/AuthProvider'

type ProfileRow = { id: string, first_name?: string, last_name?: string, is_active?: boolean, roles?: any }
type RoleRow = { id: string, name: string, permissions?: any }

export default function AdminPage() {
  const { user, profile, loading } = useAuth()
  const [users, setUsers] = useState<ProfileRow[]>([])
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(false)

  const isAllowed = () => {
    const roleName = (profile as any)?.role?.name
    return ['admin', 'superadmin'].includes(roleName)
  }

  useEffect(() => {
    if (!user || !profile) return
    if (!isAllowed()) return
    fetchData()
  }, [user, profile])

  const getToken = async () => {
    const s = await supabase.auth.getSession()
    return (s as any).data?.session?.access_token ?? null
  }

  const fetchData = async () => {
    setLoadingData(true)
    setError(null)
    try {
      const token = await getToken()
      const resUsers = await fetch('/api/admin/secure', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ action: 'list-users' }) })
      const bodyUsers = await resUsers.json()
      if (!resUsers.ok) throw new Error(bodyUsers.error || 'Failed fetching users')
      setUsers(bodyUsers.data || [])

      const resRoles = await fetch('/api/admin/secure', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ action: 'list-roles' }) })
      const bodyRoles = await resRoles.json()
      if (!resRoles.ok) throw new Error(bodyRoles.error || 'Failed fetching roles')
      setRoles(bodyRoles.data || [])
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoadingData(false)
    }
  }

  if (loading) return <div>Verificando sesión...</div>
  if (!user || !profile) return <div>No autorizado</div>
  if (!isAllowed()) return <div>Acceso restringido</div>

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Panel de administración</h1>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Usuarios</h2>
            {loadingData ? <p>Cargando...</p> : (
              <ul className="space-y-2">
                {users.map(u => (
                  <li key={u.id} className="p-2 border rounded flex justify-between items-center">
                    <div>
                      <div className="font-medium">{u.first_name} {u.last_name}</div>
                      <div className="text-xs text-gray-500">{u.id} {u.roles && `- ${Array.isArray(u.roles) ? u.roles[0]?.name : u.roles?.name}`}</div>
                    </div>
                    <div className="space-x-2">
                      {/* Permitiremos asignar roles si el role del admin lo permite (handled server-side) */}
                      <button onClick={() => {/* implement assign UI later */}} className="px-2 py-1 bg-gray-100 rounded">Acciones</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Roles</h2>
            {loadingData ? <p>Cargando...</p> : (
              <ul className="space-y-2">
                {roles.map(r => (
                  <li key={r.id} className="p-2 border rounded flex justify-between items-center">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-gray-500">{JSON.stringify(r.permissions)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
