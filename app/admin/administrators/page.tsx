"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useSafeRouter } from '@/lib/useSafeRouter'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import ConfirmModal from '@/app/components/ConfirmModal'
import { useToast } from '@/lib/useToast'
import { Trash2, Plus, UserCheck, UserX, Shield, Users, Edit } from 'lucide-react'
import { COUNTRY_CODES } from '@/app/components/PhoneInput'

// Types
interface UserRow {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  email?: string | null
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

// Función para formatear teléfono con bandera y formato correcto
const formatPhoneDisplay = (phone: string | null): { countryCode: string; formatted: string; raw: string } => {
  if (!phone) return { countryCode: '', formatted: 'Sin teléfono', raw: '' }
  
  // Buscar el país correspondiente
  const matchedCountry = COUNTRY_CODES.find(c => phone.startsWith(c.code))
  
  if (!matchedCountry) {
    return { countryCode: '', formatted: phone, raw: phone }
  }
  
  // Extraer el número sin código de país
  const number = phone.slice(matchedCountry.code.length)
  
  // Formatear según el país
  let formattedNumber = ''
  
  switch (matchedCountry.country) {
    case 'MX': // México
      if (number.length === 10) {
        formattedNumber = `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`
      } else {
        formattedNumber = number
      }
      break
      
    case 'US': // USA
    case 'CA': // Canadá
      if (number.length === 10) {
        formattedNumber = `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`
      } else {
        formattedNumber = number
      }
      break
      
    case 'SV': // El Salvador
    case 'GT': // Guatemala
    case 'HN': // Honduras
    case 'NI': // Nicaragua
    case 'CR': // Costa Rica
    case 'PA': // Panamá
      if (number.length === 8) {
        formattedNumber = `${number.slice(0, 4)}-${number.slice(4)}`
      } else {
        formattedNumber = number
      }
      break
      
    case 'ES': // España
      if (number.length === 9) {
        formattedNumber = `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`
      } else {
        formattedNumber = number
      }
      break
      
    default:
      // Para otros países, agrupar en bloques de 4 dígitos
      const parts = number.match(/.{1,4}/g) || [number]
      formattedNumber = parts.join(' ')
  }
  
  return {
    countryCode: matchedCountry.country.toLowerCase(),
    formatted: `${matchedCountry.code} ${formattedNumber}`,
    raw: phone
  }
}

// Componente para mostrar teléfono con bandera
const PhoneDisplay = ({ phone }: { phone: string | null }) => {
  const { countryCode, formatted } = formatPhoneDisplay(phone)
  
  if (!phone || formatted === 'Sin teléfono') {
    return <span className="text-gray-400">Sin teléfono</span>
  }
  
  return (
    <div className="flex items-center gap-1.5">
      {countryCode && (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={`https://flagcdn.com/w40/${countryCode}.png`}
          alt={`Bandera`}
          className="w-5 h-3.5 object-cover rounded-sm shadow-sm flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      )}
      <span className="truncate">{formatted}</span>
    </div>
  )
}

// Roles de administradores del sistema
const ADMIN_ROLES = ['superadmin', 'admin']

export default function AdministratorsPage() {
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()
  const { success, error: showError } = useToast()

  const [users, setUsers] = useState<UserRow[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [showDelete, setShowDelete] = useState<{ open: boolean; user?: UserRow }>({ open: false })

  const isSuper = (profile as any)?.roles?.name === 'superadmin'

  // Seguridad adicional: redirigir si no autenticado tras cargar
  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.replace('/admin/login?reason=unauthenticated')
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
      
      // Filtrar solo administradores (superadmin y admin)
      const allUsers = b1.data || []
      const adminUsers = allUsers.filter((u: UserRow) => {
        const roleName = typeof u.roles === 'object' && u.roles ? u.roles.name : ''
        return ADMIN_ROLES.includes(roleName)
      })

      // Cargar emails para cada usuario
      const usersWithEmails = await Promise.all(
        adminUsers.map(async (u: UserRow) => {
          try {
            const emailRes = await fetch('/api/admin/secure', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ action: 'get-user-email', userId: u.id })
            })
            const emailBody = await emailRes.json()
            return {
              ...u,
              email: emailRes.ok && emailBody.data?.email ? emailBody.data.email : null
            }
          } catch {
            return { ...u, email: null }
          }
        })
      )
      
      setUsers(usersWithEmails)

      // Obtener solo roles de administrador
      const r2 = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'list-roles' })
      })
      const b2 = await r2.json()
      if (!r2.ok) throw new Error(b2.error || 'No se pudo obtener roles')
      
      const allRoles = b2.data || []
      const adminRoles = allRoles.filter((r: RoleOption) => ADMIN_ROLES.includes(r.name))
      setRoles(adminRoles)
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }, [showError])

  useEffect(() => {
    if (loading) return
    if (!user || !profile) return
    if (!isSuper) return
    refresh()
  }, [loading, user, profile, isSuper, refresh])

  const getToken = async () => {
    const s = await supabase.auth.getSession()
    return (s as any).data?.session?.access_token ?? null
  }

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const s = search.toLowerCase()
    return users.filter(u => {
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase()
      const phone = u.phone || ''
      const email = u.email || ''
      const roleName = typeof u.roles === 'object' && u.roles ? u.roles.name : ''
      return fullName.includes(s) || phone.includes(s) || email.toLowerCase().includes(s) || roleName.toLowerCase().includes(s)
    })
  }, [users, search])

  const handleCreate = () => {
    router.push('/admin/administrators/new')
  }

  const handleEdit = (u: UserRow) => {
    router.push(`/admin/administrators/${u.id}`)
  }

  const handleDeleteConfirm = async () => {
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
      if (!res.ok) throw new Error(body.error || 'Error eliminando administrador')
      
      success('Administrador eliminado exitosamente')
      setShowDelete({ open: false })
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
      
      success(`Administrador ${newStatus ? 'activado' : 'desactivado'} exitosamente`)
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
    const superadmins = users.filter(u => {
      const roleName = typeof u.roles === 'object' && u.roles ? u.roles.name : ''
      return roleName === 'superadmin'
    }).length
    
    return { total, active, inactive, superadmins }
  }, [users])

  // Mostrar loading mientras se verifica la sesión
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Verificando sesión...</p>
      </div>
    </div>
  )

  // Fallback si no superadmin
  if (!isSuper) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-medium text-sm">Acceso restringido. Solo superadministradores pueden gestionar administradores.</p>
      </div>
    </div>
  )

  // Renderizar contenido según el rol
  return (
    <RequireRoleClient permission="manage_administrators">
      <div className="space-y-6">
        {/* Lista de administradores */}
        <div className="space-y-4 p-4 sm:p-6">
          {/* Header compacto */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Administradores</h1>
              <p className="text-gray-600 mt-1">Administre los usuarios con privilegios de administración del sistema</p>
            </div>
            <button 
              onClick={handleCreate}
              disabled={busy}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-accent text-white hover:bg-brand-accentDark disabled:opacity-50 transition-colors w-full sm:w-auto shadow-sm text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Administrador</span>
            </button>
          </div>

          {/* Estadísticas - Carrusel en mobile, Grid en desktop */}
          
          {/* Mobile: Carrusel horizontal con scroll */}
          <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3 pb-2">
              {/* Total Administradores */}
              <div className="bg-gradient-to-br from-brand-dark to-[#003d66] rounded-lg shadow-md p-5 text-white flex-shrink-0 w-[280px]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-gray-100 text-sm font-medium">Total Administradores</p>
                    <p className="text-4xl font-bold mt-2">{stats.total}</p>
                  </div>
                  <Shield className="w-16 h-16 text-gray-200 opacity-40" />
                </div>
                <div className="flex items-center text-gray-100 text-xs border-t border-white/20 pt-3">
                  <Shield className="w-4 h-4 mr-1.5" />
                  <span>Registrados</span>
                </div>
              </div>

              {/* Superadministradores */}
              <div className="bg-gradient-to-br from-brand-accent to-brand-accentDark rounded-lg shadow-md p-5 text-white flex-shrink-0 w-[280px]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-pink-100 text-sm font-medium">Superadministradores</p>
                    <p className="text-4xl font-bold mt-2">{stats.superadmins}</p>
                  </div>
                  <Shield className="w-16 h-16 text-pink-100 opacity-40" />
                </div>
                <div className="flex items-center text-pink-100 text-xs border-t border-white/20 pt-3">
                  <Shield className="w-4 h-4 mr-1.5" />
                  <span>Acceso Total</span>
                </div>
              </div>

              {/* Activos */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg shadow-md p-5 text-white flex-shrink-0 w-[280px]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Activos</p>
                    <p className="text-4xl font-bold mt-2">{stats.active}</p>
                  </div>
                  <UserCheck className="w-16 h-16 text-emerald-100 opacity-40" />
                </div>
                <div className="flex items-center text-emerald-100 text-xs border-t border-white/20 pt-3">
                  <UserCheck className="w-4 h-4 mr-1.5" />
                  <span>Operativos</span>
                </div>
              </div>

              {/* Inactivos */}
              <div className="bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-lg shadow-md p-5 text-white flex-shrink-0 w-[280px]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-gray-100 text-sm font-medium">Inactivos</p>
                    <p className="text-4xl font-bold mt-2">{stats.inactive}</p>
                  </div>
                  <UserX className="w-16 h-16 text-gray-200 opacity-40" />
                </div>
                <div className="flex items-center text-gray-100 text-xs border-t border-white/20 pt-3">
                  <UserX className="w-4 h-4 mr-1.5" />
                  <span>Suspendidos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Grid tradicional */}
          <div className="hidden sm:grid sm:grid-cols-4 gap-4">
            {/* Total Administradores */}
            <div className="bg-gradient-to-br from-brand-dark to-[#003d66] rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm font-medium">Total Administradores</p>
                  <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <Shield className="w-12 h-12 text-gray-200 opacity-80" />
              </div>
              <div className="mt-4 flex items-center text-gray-100 text-sm">
                <Shield className="w-4 h-4 mr-1" />
                Registrados
              </div>
            </div>

            {/* Superadministradores */}
            <div className="bg-gradient-to-br from-brand-accent to-brand-accentDark rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm font-medium">Superadministradores</p>
                  <p className="text-3xl font-bold mt-2">{stats.superadmins}</p>
                </div>
                <Shield className="w-12 h-12 text-pink-100 opacity-80" />
              </div>
              <div className="mt-4 flex items-center text-pink-100 text-sm">
                <Shield className="w-4 h-4 mr-1" />
                Acceso Total
              </div>
            </div>

            {/* Activos */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Activos</p>
                  <p className="text-3xl font-bold mt-2">{stats.active}</p>
                </div>
                <UserCheck className="w-12 h-12 text-emerald-100 opacity-80" />
              </div>
              <div className="mt-4 flex items-center text-emerald-100 text-sm">
                <UserCheck className="w-4 h-4 mr-1" />
                Operativos
              </div>
            </div>

            {/* Inactivos */}
            <div className="bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm font-medium">Inactivos</p>
                  <p className="text-3xl font-bold mt-2">{stats.inactive}</p>
                </div>
                <UserX className="w-12 h-12 text-gray-200 opacity-80" />
              </div>
              <div className="mt-4 flex items-center text-gray-100 text-sm">
                <UserX className="w-4 h-4 mr-1" />
                Suspendidos
              </div>
            </div>
          </div>

          {/* Búsqueda */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, correo, teléfono o rol..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
            />
          </div>

          {/* Listado de administradores - diseño compacto */}
          {busy && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando administradores...</p>
            </div>
          )}

          {!busy && (
            <div className="rounded-lg shadow-sm overflow-hidden border border-gray-200">
              {/* Header de tabla solo en desktop */}
              <div className="hidden lg:block bg-gradient-to-r from-brand-dark to-[#003d66] text-white px-4 py-2.5 border-b border-gray-300">
                <div className="flex items-center gap-4">
                  <div className="w-20 flex-shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wide">Estado</span>
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <span className="text-xs font-semibold uppercase tracking-wide">Administrador</span>
                  </div>
                  <div className="w-48 flex-shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wide">Correo</span>
                  </div>
                  <div className="w-36 flex-shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wide">Teléfono</span>
                  </div>
                  <div className="w-32 flex-shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wide">Rol</span>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wide">Acciones</span>
                  </div>
                </div>
              </div>
              
              <div>
                {filteredUsers.length === 0 && (
                  <div className="p-8 text-center text-gray-500 text-sm bg-white">
                    {search.trim()
                      ? 'No se encontraron administradores con los criterios de búsqueda'
                      : 'No hay administradores registrados aún'}
                  </div>
                )}
                {filteredUsers.map((admin, index) => {
                  const fullName = `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'Sin nombre'
                  const roleName = typeof admin.roles === 'object' && admin.roles ? admin.roles.name : 'Sin rol'
                  const isCurrentUser = admin.id === user?.id
                  const isSuperAdmin = roleName === 'superadmin'
                  
                  // Efecto striped: alternar entre blanco y gris claro
                  const isEven = index % 2 === 0
                  const bgColor = isEven ? 'bg-white' : 'bg-gray-100'
                  const hoverColor = isEven ? 'hover:bg-gray-50' : 'hover:bg-gray-200'
                  
                  return (
                    <div
                      key={admin.id}
                      className={`p-3 sm:p-4 ${bgColor} ${hoverColor} transition-colors border-b border-gray-200 last:border-b-0`}
                    >
                      {/* Mobile: Layout compacto vertical */}
                      <div className="flex flex-col gap-2 lg:hidden">
                        {/* Header con nombre y estado */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <Shield className="w-4 h-4 text-brand-dark flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-sm text-gray-900 leading-tight">{fullName}</h3>
                                {isCurrentUser && (
                                  <span className="text-xs bg-brand-dark text-white px-2 py-0.5 rounded font-medium">
                                    Tú
                                  </span>
                                )}
                              </div>
                              {admin.email && (
                                <p className="text-xs text-gray-600 leading-tight mt-0.5">📧 {admin.email}</p>
                              )}
                              {admin.phone && (
                                <div className="text-xs text-gray-600 leading-tight mt-0.5 flex items-center gap-1">
                                  <span>📱</span>
                                  <PhoneDisplay phone={admin.phone} />
                                </div>
                              )}
                            </div>
                          </div>
                          <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded font-medium ${
                            admin.is_active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {admin.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        
                        {/* Info condensada */}
                        <div className="flex items-center gap-2 text-xs ml-6">
                          <span className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                            isSuperAdmin
                              ? 'bg-red-50 text-red-700 border border-red-200' 
                              : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}>
                            <Shield className="w-3 h-3" />
                            {roleName}
                          </span>
                        </div>

                        {/* Botones - grid flexible según permisos */}
                        <div className={`grid gap-2 mt-1 ${isCurrentUser ? 'grid-cols-2' : 'grid-cols-3'}`}>
                          <button
                            disabled={busy}
                            onClick={() => handleEdit(admin)}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-medium disabled:opacity-50"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            disabled={busy || isCurrentUser}
                            onClick={() => toggleUserStatus(admin)}
                            className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded transition-colors text-xs font-medium disabled:opacity-50 ${
                              admin.is_active
                                ? 'bg-neutral-600 text-white hover:bg-neutral-700'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                            title={isCurrentUser ? "No puedes modificar tu propio estado" : undefined}
                          >
                            {admin.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            <span>{admin.is_active ? 'Desactivar' : 'Activar'}</span>
                          </button>

                          {!isCurrentUser && (
                            <button
                              disabled={busy}
                              onClick={() => setShowDelete({ open: true, user: admin })}
                              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-brand-accent text-white hover:bg-brand-accentDark transition-colors text-xs font-medium disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Eliminar</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Desktop: Layout horizontal tipo tabla */}
                      <div className="hidden lg:flex lg:items-center lg:gap-4">
                        {/* Columna 1: Estado (80px) */}
                        <div className="w-20 flex-shrink-0">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            admin.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-300'
                          }`}>
                            {admin.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>

                        {/* Columna 2: Nombre (flex-1, min 180px) */}
                        <div className="flex-1 min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-brand-dark flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm text-gray-900 truncate">{fullName}</h3>
                                {isCurrentUser && (
                                  <span className="text-xs bg-brand-dark text-white px-2 py-0.5 rounded font-medium flex-shrink-0">
                                    Tú
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Columna 3: Correo (190px) */}
                        <div className="w-48 flex-shrink-0">
                          <p className="text-xs text-gray-600 truncate" title={admin.email || 'Sin correo'}>
                            {admin.email || <span className="text-gray-400">Sin correo</span>}
                          </p>
                        </div>

                        {/* Columna 4: Teléfono (145px) */}
                        <div className="w-36 flex-shrink-0">
                          <div className="text-xs text-gray-600">
                            <PhoneDisplay phone={admin.phone} />
                          </div>
                        </div>

                        {/* Columna 5: Rol (130px) */}
                        <div className="w-32 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            isSuperAdmin
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}>
                            <Shield className="w-3 h-3" />
                            {roleName}
                          </span>
                        </div>

                        {/* Columna 6: Acciones */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            disabled={busy}
                            onClick={() => handleEdit(admin)}
                            className="p-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            disabled={busy || isCurrentUser}
                            onClick={() => toggleUserStatus(admin)}
                            className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                              admin.is_active
                                ? 'bg-neutral-600 text-white hover:bg-neutral-700'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                            title={isCurrentUser ? "No puedes modificar tu propio estado" : (admin.is_active ? "Desactivar" : "Activar")}
                          >
                            {admin.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>

                          {!isCurrentUser && (
                            <button
                              disabled={busy}
                              onClick={() => setShowDelete({ open: true, user: admin })}
                              className="p-1.5 rounded bg-brand-accent text-white hover:bg-brand-accentDark transition-colors disabled:opacity-50"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal de confirmación de eliminación */}
        <ConfirmModal
          isOpen={showDelete.open}
          onCancel={() => setShowDelete({ open: false })}
          onConfirm={handleDeleteConfirm}
          title="Eliminar Administrador"
          message={`¿Está seguro de que desea eliminar al administrador "${showDelete.user ? `${showDelete.user.first_name || ''} ${showDelete.user.last_name || ''}`.trim() : ''}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          type="danger"
        />
      </div>
    </RequireRoleClient>
  )
}
