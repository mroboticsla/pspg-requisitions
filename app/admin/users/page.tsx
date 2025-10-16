"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useSafeRouter } from '@/lib/useSafeRouter'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import ConfirmModal from '@/app/components/ConfirmModal'
import { useToast } from '@/lib/useToast'
import { Eye, Trash2, Plus, UserCheck, UserX, Shield, Users, TrendingUp, Activity, Clock } from 'lucide-react'

// Types
interface UserRow {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  is_active: boolean
  role_id: string | null
  roles?: {
    id: string
    name: string
  } | null
}

interface RoleOption {
  id: string
  name: string
}

type ViewMode = 'list' | 'view' | 'assign-role'

export default function UsersAdminPage() {
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()
  const { success, error: showError, info } = useToast()

  const [users, setUsers] = useState<UserRow[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [showDelete, setShowDelete] = useState<{ open: boolean; user?: UserRow }>({ open: false })
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const isSuper = (profile as any)?.roles?.name === 'superadmin'
  const isAdmin = (profile as any)?.roles?.name === 'admin'

  // Seguridad adicional: redirigir si no autenticado tras cargar
  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.replace('/auth')
    }
  }, [loading, user, profile, router])

  const refresh = useCallback(async () => {
    try {
      setBusy(true)
      const s = await supabase.auth.getSession()
      const token = (s as any).data?.session?.access_token ?? null
      
      // Obtener usuarios
      const r1 = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'list-users' })
      })
      const b1 = await r1.json()
      if (!r1.ok) throw new Error(b1.error || 'No se pudo obtener usuarios')
      setUsers(b1.data || [])

      // Obtener roles
      const r2 = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'list-roles' })
      })
      const b2 = await r2.json()
      if (!r2.ok) throw new Error(b2.error || 'No se pudo obtener roles')
      setRoles(b2.data || [])
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }, [showError])

  useEffect(() => {
    if (loading) return
    if (!user || !profile) return
    if (!isSuper && !isAdmin) return
    refresh()
  }, [loading, user, profile, isSuper, isAdmin, refresh])

  const getToken = async () => {
    const s = await supabase.auth.getSession()
    return (s as any).data?.session?.access_token ?? null
  }

  const filteredUsers = useMemo(() => {
    let filtered = users

    // Filtro de búsqueda
    if (search.trim()) {
      const s = search.toLowerCase()
      filtered = filtered.filter(u => {
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase()
        const phone = u.phone || ''
        const roleName = typeof u.roles === 'object' && u.roles ? u.roles.name : ''
        return fullName.includes(s) || phone.includes(s) || roleName.toLowerCase().includes(s)
      })
    }

    // Filtro de estado
    if (statusFilter === 'active') {
      filtered = filtered.filter(u => u.is_active)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(u => !u.is_active)
    }

    // Filtro de rol
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role_id === roleFilter)
    }

    return filtered
  }, [users, search, statusFilter, roleFilter])

  const beginView = (u: UserRow) => {
    setSelectedUser(u)
    setViewMode('view')
  }

  const beginAssignRole = (u: UserRow) => {
    setSelectedUser(u)
    setSelectedRoleId(u.role_id || '')
    setViewMode('assign-role')
  }

  const cancelView = () => {
    setSelectedUser(null)
    setSelectedRoleId('')
    setViewMode('list')
  }

  const assignRole = async () => {
    if (!selectedUser || !selectedRoleId) return
    
    try {
      setBusy(true)
      const selectedRole = roles.find(r => r.id === selectedRoleId)
      if (!selectedRole) {
        showError('Rol no encontrado')
        return
      }

      const token = await getToken()
      const res = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          action: 'assign-role',
          userId: selectedUser.id,
          roleName: selectedRole.name
        })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Error asignando rol')
      
      success(`Rol "${selectedRole.name}" asignado correctamente`)
      setSelectedUser(null)
      setSelectedRoleId('')
      setViewMode('list')
      await refresh()
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  const toggleUserStatus = async (u: UserRow) => {
    try {
      setBusy(true)
      const newStatus = !u.is_active
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', u.id)
      
      if (error) throw error
      
      success(`Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente`)
      await refresh()
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  const requestDelete = (u: UserRow) => {
    // Verificar que no sea el usuario actual
    if (u.id === user?.id) {
      showError('No puedes eliminar tu propio usuario')
      return
    }
    
    setShowDelete({ open: true, user: u })
  }

  const doDelete = async () => {
    if (!showDelete.user) return
    
    try {
      setBusy(true)
      const token = await getToken()
      const res = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete-profile', userId: showDelete.user.id })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Error eliminando usuario')
      
      success('Usuario eliminado correctamente')
      setShowDelete({ open: false })
      await refresh()
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter(u => u.is_active).length
    const inactive = total - active
    const withRole = users.filter(u => u.role_id).length
    const withoutRole = total - withRole
    
    return { total, active, inactive, withRole, withoutRole }
  }, [users])

  // Renderizado de la vista de lista de usuarios
  const renderListView = () => (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Header compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Administración de usuarios</h1>
          <p className="text-gray-600 mt-1">Gestiona los usuarios y sus roles en el sistema</p>
        </div>
      </div>

      {/* Estadísticas compactas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-brand-dark to-[#003d66] rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm font-medium">Total Usuarios</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <Users className="w-12 h-12 text-gray-200 opacity-80" />
          </div>
          <div className="mt-4 flex items-center text-gray-100 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            Registrados
          </div>
        </div>
        <div className="bg-gradient-to-br from-brand-accent to-brand-accentDark rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Usuarios Activos</p>
              <p className="text-3xl font-bold mt-2">{stats.active}</p>
            </div>
            <UserCheck className="w-12 h-12 text-pink-100 opacity-80" />
          </div>
          <div className="mt-4 flex items-center text-pink-100 text-sm">
            <Activity className="w-4 h-4 mr-1" />
            En el sistema
          </div>
        </div>
        <div className="bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm font-medium">Usuarios Inactivos</p>
              <p className="text-3xl font-bold mt-2">{stats.inactive}</p>
            </div>
            <UserX className="w-12 h-12 text-gray-200 opacity-80" />
          </div>
          <div className="mt-4 flex items-center text-gray-100 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            Desactivados
          </div>
        </div>
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Con Rol Asignado</p>
              <p className="text-3xl font-bold mt-2">{stats.withRole}</p>
            </div>
            <Shield className="w-12 h-12 text-teal-100 opacity-80" />
          </div>
          <div className="mt-4 flex items-center text-teal-100 text-sm">
            <Activity className="w-4 h-4 mr-1" />
            Configurados
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda compactos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono o rol..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
          />
          
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Solo activos</option>
            <option value="inactive">Solo inactivos</option>
          </select>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
          >
            <option value="all">Todos los roles</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Listado de usuarios - diseño compacto */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              {search.trim() || statusFilter !== 'all' || roleFilter !== 'all'
                ? 'No se encontraron usuarios con los criterios de búsqueda'
                : 'No hay usuarios registrados aún'}
            </div>
          )}
          {filteredUsers.map(u => {
            const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Sin nombre'
            const roleName = typeof u.roles === 'object' && u.roles ? u.roles.name : 'Sin rol'
            const isCurrentUser = u.id === user?.id

            return (
              <div
                key={u.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Layout compacto: info a la izquierda, badges y botones a la derecha en desktop */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  {/* Información del usuario */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base text-gray-900">{fullName}</h3>
                      {isCurrentUser && (
                        <span className="text-xs bg-brand-dark text-white px-2 py-0.5 rounded font-medium">
                          Tú
                        </span>
                      )}
                      {u.is_active ? (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium flex items-center gap-1 border border-emerald-200">
                          <UserCheck className="w-3 h-3" />
                          Activo
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium flex items-center gap-1 border border-gray-300">
                          <UserX className="w-3 h-3" />
                          Inactivo
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                        u.role_id 
                          ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {roleName}
                      </span>
                    </div>
                    {u.phone && (
                      <p className="text-sm text-gray-600">
                        📱 {u.phone}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {u.id.substring(0, 8)}...
                    </p>
                  </div>

                  {/* Botones de acción - compactos en desktop, full width en móvil */}
                  <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                    <button
                      disabled={busy}
                      onClick={(e) => { e.stopPropagation(); beginView(u); }}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white transition-colors text-sm font-medium w-full sm:w-auto disabled:opacity-50"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver detalles</span>
                    </button>
                    
                    <button
                      disabled={busy}
                      onClick={(e) => { e.stopPropagation(); beginAssignRole(u); }}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors text-sm font-medium w-full sm:w-auto disabled:opacity-50"
                      title="Asignar rol"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Asignar rol</span>
                    </button>

                    <button
                      disabled={busy || isCurrentUser}
                      onClick={(e) => { e.stopPropagation(); toggleUserStatus(u); }}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-sm font-medium w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed ${
                        u.is_active
                          ? 'bg-neutral-600 text-white hover:bg-neutral-700'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                      title={isCurrentUser ? "No puedes desactivar tu propio usuario" : (u.is_active ? "Desactivar usuario" : "Activar usuario")}
                    >
                      {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      <span>{u.is_active ? 'Desactivar' : 'Activar'}</span>
                    </button>

                    {isSuper && (
                      <button
                        disabled={busy || isCurrentUser}
                        onClick={(e) => { e.stopPropagation(); requestDelete(u); }}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-accent text-white hover:bg-brand-accentDark transition-colors text-sm font-medium w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isCurrentUser ? "No puedes eliminar tu propio usuario" : "Eliminar usuario"}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  // Renderizado de la vista de detalles del usuario
  const renderViewMode = () => {
    if (!selectedUser) return null

    const fullName = `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || 'Sin nombre'
    const roleName = typeof selectedUser.roles === 'object' && selectedUser.roles ? selectedUser.roles.name : 'Sin rol'

    return (
      <div className="space-y-4 p-4 sm:p-6">
        {/* Header compacto con navegación */}
        <div className="flex items-center gap-3">
          <button
            onClick={cancelView}
            disabled={busy}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Volver a la lista"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Detalles del usuario</h1>
          </div>
        </div>

        {/* Información del usuario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-dark to-brand-accent flex items-center justify-center text-white text-2xl font-bold">
              {(selectedUser.first_name?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{fullName}</h2>
              <div className="flex items-center gap-2 mt-1">
                {selectedUser.is_active ? (
                  <span className="text-sm bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium flex items-center gap-1 border border-emerald-200">
                    <UserCheck className="w-4 h-4" />
                    Activo
                  </span>
                ) : (
                  <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium flex items-center gap-1 border border-gray-300">
                    <UserX className="w-4 h-4" />
                    Inactivo
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
              <p className="text-base text-gray-900">{selectedUser.first_name || 'No especificado'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Apellido</label>
              <p className="text-base text-gray-900">{selectedUser.last_name || 'No especificado'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Teléfono</label>
              <p className="text-base text-gray-900">{selectedUser.phone || 'No especificado'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Rol</label>
              <div className="flex items-center gap-2">
                <span className={`text-sm px-3 py-1 rounded font-medium flex items-center gap-1 ${
                  selectedUser.role_id
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <Shield className="w-4 h-4" />
                  {roleName}
                </span>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">ID de usuario</label>
              <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border border-gray-200">
                {selectedUser.id}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            disabled={busy}
            onClick={() => beginAssignRole(selectedUser)}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors font-medium text-sm w-full sm:w-auto"
          >
            Asignar rol
          </button>
          <button
            disabled={busy}
            onClick={cancelView}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium text-sm w-full sm:w-auto"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    )
  }

  // Renderizado de la vista de asignación de rol
  const renderAssignRoleMode = () => {
    if (!selectedUser) return null

    const fullName = `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || 'Sin nombre'

    return (
      <div className="space-y-4 p-4 sm:p-6">
        {/* Header compacto con navegación */}
        <div className="flex items-center gap-3">
          <button
            onClick={cancelView}
            disabled={busy}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Volver a la lista"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Asignar rol</h1>
            <p className="text-sm text-gray-600 mt-1">Usuario: {fullName}</p>
          </div>
        </div>

        {/* Selección de rol */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold mb-3 text-gray-900">Seleccionar rol</h2>
          <p className="text-sm text-gray-600 mb-4">
            Elige el rol que deseas asignar a este usuario
          </p>

          <div className="space-y-2">
            {roles.map(r => (
              <label
                key={r.id}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedRoleId === r.id
                    ? 'border-brand-accent bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.id}
                  checked={selectedRoleId === r.id}
                  onChange={e => setSelectedRoleId(e.target.value)}
                  className="w-4 h-4 text-brand-accent focus:ring-2 focus:ring-brand-accent"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-600" />
                    <span className="font-medium text-gray-900">{r.name}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            disabled={busy || !selectedRoleId}
            onClick={assignRole}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm w-full sm:w-auto"
          >
            {busy ? 'Asignando...' : 'Asignar rol'}
          </button>
          <button
            disabled={busy}
            onClick={cancelView}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium text-sm w-full sm:w-auto"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  // Determinar qué contenido mostrar
  const content = viewMode === 'list' 
    ? renderListView() 
    : viewMode === 'view'
      ? renderViewMode()
      : renderAssignRoleMode()

  // Loading general del provider
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-accent mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">Cargando...</p>
      </div>
    </div>
  )

  // Fallback si no superadmin ni admin
  if (!isSuper && !isAdmin) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-medium text-sm">Acceso restringido. No tiene permisos suficientes.</p>
      </div>
    </div>
  )

  return (
    <RequireRoleClient allow={["superadmin", "admin"]} fallback={
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium text-sm">Acceso restringido. No tiene permisos suficientes.</p>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-gray-50">
        {content}
      </div>
      <ConfirmModal
        isOpen={showDelete.open}
        title="Eliminar usuario"
        message={`¿Seguro que deseas eliminar al usuario "${showDelete.user ? `${showDelete.user.first_name || ''} ${showDelete.user.last_name || ''}`.trim() : ''}"? Esta acción eliminará su perfil y no se puede deshacer.`}
        type="danger"
        confirmText="Eliminar"
        onConfirm={doDelete}
        onCancel={() => setShowDelete({ open: false })}
      />
    </RequireRoleClient>
  )
}
