"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useSafeRouter } from '@/lib/useSafeRouter'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import ConfirmModal from '@/app/components/ConfirmModal'
import { useToast } from '@/lib/useToast'
import { Eye, Trash2, Plus, UserCheck, UserX, Shield, Users, TrendingUp, Activity, Clock, Briefcase } from 'lucide-react'

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

type ViewMode = 'list' | 'view'

export default function PartnersPage() {
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()
  const { success, error: showError } = useToast()

  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [showDelete, setShowDelete] = useState<{ open: boolean; user?: UserRow }>({ open: false })
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

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
      
      // Filtrar solo partners
      const allUsers = b1.data || []
      const partnerUsers = allUsers.filter((u: UserRow) => {
        const roleName = typeof u.roles === 'object' && u.roles ? u.roles.name : ''
        return roleName === 'partner'
      })
      setUsers(partnerUsers)
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
        return fullName.includes(s) || phone.includes(s)
      })
    }

    // Filtro de estado
    if (statusFilter === 'active') {
      filtered = filtered.filter(u => u.is_active)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(u => !u.is_active)
    }

    return filtered
  }, [users, search, statusFilter])

  const beginView = (u: UserRow) => {
    setSelectedUser(u)
    setViewMode('view')
  }

  const cancelView = () => {
    setSelectedUser(null)
    setViewMode('list')
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
      
      success(`Asociado ${newStatus ? 'activado' : 'desactivado'} correctamente`)
      await refresh()
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  const requestDelete = (u: UserRow) => {
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
      if (!res.ok) throw new Error(body.error || 'Error eliminando asociado')
      
      success('Asociado eliminado correctamente')
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
    
    return { total, active, inactive }
  }, [users])

  // Renderizado de la vista de lista de asociados
  const renderListView = () => (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Header compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Asociados (Partners)</h1>
          <p className="text-gray-600 mt-1">Gestiona los usuarios asociados del sistema</p>
        </div>
        <button 
          onClick={() => router.push('/register?type=partner')}
          disabled={busy}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-accent text-white hover:bg-brand-accentDark disabled:opacity-50 transition-colors w-full sm:w-auto shadow-sm text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Asociado</span>
        </button>
      </div>

      {/* Estadísticas compactas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-brand-dark to-[#003d66] rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm font-medium">Total Asociados</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <Briefcase className="w-12 h-12 text-gray-200 opacity-80" />
          </div>
          <div className="mt-4 flex items-center text-gray-100 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            Registrados
          </div>
        </div>
        <div className="bg-gradient-to-br from-brand-accent to-brand-accentDark rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Asociados Activos</p>
              <p className="text-3xl font-bold mt-2">{stats.active}</p>
            </div>
            <UserCheck className="w-12 h-12 text-pink-100 opacity-80" />
          </div>
          <div className="mt-4 flex items-center text-pink-100 text-sm">
            <Activity className="w-4 h-4 mr-1" />
            Operativos
          </div>
        </div>
        <div className="bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm font-medium">Inactivos</p>
              <p className="text-3xl font-bold mt-2">{stats.inactive}</p>
            </div>
            <UserX className="w-12 h-12 text-gray-200 opacity-80" />
          </div>
          <div className="mt-4 flex items-center text-gray-100 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            Suspendidos
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda compactos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
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
        </div>
      </div>

      {/* Listado de asociados - diseño compacto */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="divide-y divide-gray-200">
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              {search.trim() || statusFilter !== 'all'
                ? 'No se encontraron asociados con los criterios de búsqueda'
                : 'No hay asociados registrados aún'}
            </div>
          )}
          {filteredUsers.map(u => {
            const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Sin nombre'

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
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium flex items-center gap-1 border border-blue-200">
                        <Briefcase className="w-3 h-3" />
                        Asociado
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
                      onClick={(e) => { e.stopPropagation(); toggleUserStatus(u); }}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-sm font-medium w-full sm:w-auto disabled:opacity-50 ${
                        u.is_active
                          ? 'bg-neutral-600 text-white hover:bg-neutral-700'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                      title={u.is_active ? "Desactivar asociado" : "Activar asociado"}
                    >
                      {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      <span>{u.is_active ? 'Desactivar' : 'Activar'}</span>
                    </button>

                    {(isSuper || isAdmin) && (
                      <button
                        disabled={busy}
                        onClick={(e) => { e.stopPropagation(); requestDelete(u); }}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-accent text-white hover:bg-brand-accentDark transition-colors text-sm font-medium w-full sm:w-auto disabled:opacity-50"
                        title="Eliminar asociado"
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

  // Renderizado de la vista de detalles del asociado
  const renderViewMode = () => {
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Detalles del Asociado</h1>
          </div>
        </div>

        {/* Información del asociado */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold">
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
              <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Usuario</label>
              <div className="flex items-center gap-2">
                <span className="text-sm px-3 py-1 rounded font-medium flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200">
                  <Briefcase className="w-4 h-4" />
                  Asociado (Partner)
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
            onClick={cancelView}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium text-sm w-full sm:w-auto"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    )
  }

  // Determinar qué contenido mostrar
  const content = viewMode === 'list' ? renderListView() : renderViewMode()

  // Loading general del provider
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-accent mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">Cargando...</p>
      </div>
    </div>
  )

  // Fallback si no admin ni superadmin
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
        title="Eliminar Asociado"
        message={`¿Seguro que deseas eliminar al asociado "${showDelete.user ? `${showDelete.user.first_name || ''} ${showDelete.user.last_name || ''}`.trim() : ''}"? Esta acción eliminará su perfil y no se puede deshacer.`}
        type="danger"
        confirmText="Eliminar"
        onConfirm={doDelete}
        onCancel={() => setShowDelete({ open: false })}
      />
    </RequireRoleClient>
  )
}
