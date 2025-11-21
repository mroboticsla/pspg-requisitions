"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useSafeRouter } from '@/lib/useSafeRouter'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import { useToast } from '@/lib/useToast'
import { Plus, Shield, Edit, UserCheck, TrendingUp } from 'lucide-react'

// Types
interface RoleRow { 
  id: string
  name: string
  permissions?: any
}

export default function RolesAdminPage() {
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()
  const { error: showError } = useToast()

  const [roles, setRoles] = useState<RoleRow[]>([])
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

  const isSuper = (profile as any)?.roles?.name === 'superadmin'

  // Roles protegidos que no se pueden eliminar
  const PROTECTED_ROLES = useMemo(() => ['admin', 'superadmin', 'partner', 'candidate'], [])

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
      
      const r1 = await fetch('/api/admin/secure', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify({ action: 'list-roles' }) 
      })
      const b1 = await r1.json()
      if (!r1.ok) throw new Error(b1.error || 'No se pudo obtener roles')
      
      setRoles(b1.data || [])
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

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles
    const s = search.toLowerCase()
    return roles.filter(r => {
      const desc = r.permissions?.description || ''
      return r.name.toLowerCase().includes(s) || desc.toLowerCase().includes(s)
    })
  }, [roles, search])

  const handleCreate = () => {
    router.push('/admin/roles/new')
  }

  const handleEdit = (roleId: string) => {
    router.push(`/admin/roles/${roleId}`)
  }

  const stats = useMemo(() => {
    const total = roles.length
    const system = roles.filter(r => PROTECTED_ROLES.includes(r.name.toLowerCase())).length
    const custom = total - system
    
    return { total, system, custom }
  }, [roles, PROTECTED_ROLES])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Verificando sesión...</p>
      </div>
    </div>
  )

  return (
    <RequireRoleClient permission="manage_roles">
      <div className="space-y-6">
        <div className="space-y-4 p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Roles</h1>
              <p className="text-gray-600 mt-1">Administre los roles y permisos del sistema</p>
            </div>
            <button 
              onClick={handleCreate}
              disabled={busy}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-accent text-white hover:bg-brand-accentDark disabled:opacity-50 transition-colors w-full sm:w-auto shadow-sm text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Rol</span>
            </button>
          </div>

          {/* Estadísticas - Carrusel en mobile, Grid en desktop */}
          <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3 pb-2">
              <div className="bg-gradient-to-br from-brand-dark to-[#003d66] rounded-lg shadow-md p-5 text-white flex-shrink-0 w-[280px]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-gray-100 text-sm font-medium">Total Roles</p>
                    <p className="text-4xl font-bold mt-2">{stats.total}</p>
                  </div>
                  <Shield className="w-16 h-16 text-gray-200 opacity-40" />
                </div>
                <div className="flex items-center text-gray-100 text-xs border-t border-white/20 pt-3">
                  <TrendingUp className="w-4 h-4 mr-1.5" />
                  <span>Configurados</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg shadow-md p-5 text-white flex-shrink-0 w-[280px]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Roles de Sistema</p>
                    <p className="text-4xl font-bold mt-2">{stats.system}</p>
                  </div>
                  <Shield className="w-16 h-16 text-purple-100 opacity-40" />
                </div>
                <div className="flex items-center text-purple-100 text-xs border-t border-white/20 pt-3">
                  <Shield className="w-4 h-4 mr-1.5" />
                  <span>Protegidos</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg shadow-md p-5 text-white flex-shrink-0 w-[280px]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Roles Personalizados</p>
                    <p className="text-4xl font-bold mt-2">{stats.custom}</p>
                  </div>
                  <UserCheck className="w-16 h-16 text-emerald-100 opacity-40" />
                </div>
                <div className="flex items-center text-emerald-100 text-xs border-t border-white/20 pt-3">
                  <Edit className="w-4 h-4 mr-1.5" />
                  <span>Editables</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Grid tradicional */}
          <div className="hidden sm:grid sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-brand-dark to-[#003d66] rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm font-medium">Total Roles</p>
                  <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <Shield className="w-12 h-12 text-gray-200 opacity-80" />
              </div>
              <div className="mt-4 flex items-center text-gray-100 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                Configurados
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Roles de Sistema</p>
                  <p className="text-3xl font-bold mt-2">{stats.system}</p>
                </div>
                <Shield className="w-12 h-12 text-purple-100 opacity-80" />
              </div>
              <div className="mt-4 flex items-center text-purple-100 text-sm">
                <Shield className="w-4 h-4 mr-1" />
                Protegidos
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Roles Personalizados</p>
                  <p className="text-3xl font-bold mt-2">{stats.custom}</p>
                </div>
                <UserCheck className="w-12 h-12 text-emerald-100 opacity-80" />
              </div>
              <div className="mt-4 flex items-center text-emerald-100 text-sm">
                <Edit className="w-4 h-4 mr-1" />
                Editables
              </div>
            </div>
          </div>

          {/* Búsqueda */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
            />
          </div>

          {/* Listado */}
          {busy && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando roles...</p>
            </div>
          )}

          {!busy && (
            <div className="rounded-lg shadow-sm overflow-hidden border border-gray-200">
              {/* Header de tabla solo en desktop */}
              <div className="hidden lg:block bg-gradient-to-r from-brand-dark to-[#003d66] text-white px-4 py-2.5 border-b border-gray-300">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-[150px]">
                    <span className="text-xs font-semibold uppercase tracking-wide">Rol</span>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <span className="text-xs font-semibold uppercase tracking-wide">Descripción</span>
                  </div>
                  <div className="w-32 flex-shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wide">Módulos</span>
                  </div>
                  <div className="w-32 flex-shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wide">Permisos</span>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs font-semibold uppercase tracking-wide">Acciones</span>
                  </div>
                </div>
              </div>
              
              <div>
                {filteredRoles.length === 0 && (
                  <div className="p-8 text-center text-gray-500 text-sm bg-white">
                    {search.trim()
                      ? 'No se encontraron roles con los criterios de búsqueda'
                      : 'No hay roles registrados aún'}
                  </div>
                )}
                {filteredRoles.map((role, index) => {
                  const isProtected = PROTECTED_ROLES.includes(role.name.toLowerCase())
                  const description = role.permissions?.description || 'Sin descripción'
                  const modules = role.permissions?.modules || {}
                  const canDo = role.permissions?.can_do || []
                  const moduleCount = Object.keys(modules).filter(k => modules[k]).length
                  const permCount = canDo.length
                  const isEven = index % 2 === 0
                  const bgColor = isEven ? 'bg-white' : 'bg-gray-100'
                  const hoverColor = isEven ? 'hover:bg-gray-50' : 'hover:bg-gray-200'
                  
                  return (
                    <div
                      key={role.id}
                      className={`p-3 sm:p-4 ${bgColor} ${hoverColor} transition-colors border-b border-gray-200 last:border-b-0`}
                    >
                      {/* Mobile */}
                      <div className="flex flex-col gap-2 lg:hidden">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <Shield className="w-4 h-4 text-brand-dark flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm text-gray-900 leading-tight">{role.name}</h3>
                                {isProtected && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium border border-purple-200">
                                    Sistema
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 leading-tight mt-0.5">{description}</p>
                              <div className="flex gap-2 mt-1">
                                <span className="text-xs text-blue-600">📦 {moduleCount} módulos</span>
                                <span className="text-xs text-green-600">✓ {permCount} permisos</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-2 mt-1 grid-cols-2">
                          <button
                            disabled={busy}
                            onClick={() => handleEdit(role.id)}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-medium disabled:opacity-50"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                        </div>
                      </div>

                      {/* Desktop */}
                      <div className="hidden lg:flex lg:items-center lg:gap-4">
                        <div className="flex-1 min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-brand-dark flex-shrink-0" />
                            <h3 className="font-semibold text-sm text-gray-900 truncate">{role.name}</h3>
                            {isProtected && (
                              <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium border border-purple-200 flex-shrink-0">
                                Sistema
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                          <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
                        </div>

                        <div className="w-32 flex-shrink-0">
                          <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium">
                            {moduleCount} módulos
                          </span>
                        </div>

                        <div className="w-32 flex-shrink-0">
                          <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 font-medium">
                            {permCount} permisos
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            disabled={busy}
                            onClick={() => handleEdit(role.id)}
                            className="p-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </RequireRoleClient>
  )
}
