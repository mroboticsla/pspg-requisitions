"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useSafeRouter } from '@/lib/useSafeRouter'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import ConfirmModal from '@/app/components/ConfirmModal'
import { useToast } from '@/lib/useToast'
import { Trash2, Plus, Building2, Users, Edit } from 'lucide-react'
import { Company } from '@/lib/types/company'

export default function CompaniesAdminPage() {
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()
  const { success, error: showError, info } = useToast()

  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  
  const [showDelete, setShowDelete] = useState<{ open: boolean; company?: Company }>({ open: false })

  const isSuper = (profile as any)?.roles?.name === 'superadmin'
  const isAdmin = (profile as any)?.roles?.name === 'admin'

  // Seguridad adicional: redirigir si no autenticado tras cargar
  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.replace('/auth')
    }
  }, [loading, user, profile, router])

  const getToken = async () => {
    const s = await supabase.auth.getSession()
    return (s as any).data?.session?.access_token ?? null
  }

  const refresh = useCallback(async () => {
    try {
      setBusy(true)
      const token = await getToken()
      
      // Obtener empresas
      const r1 = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'list-companies' })
      })
      const b1 = await r1.json()
      if (!r1.ok) throw new Error(b1.error || 'No se pudo obtener empresas')
      setCompanies(b1.data || [])
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }, [showError])

  useEffect(() => {
    if (!loading && user && profile) {
      refresh()
    }
  }, [loading, user, profile, refresh])



  const handleCreate = () => {
    router.push('/admin/companies/new')
  }

  const handleEdit = async (company: Company) => {
    router.push(`/admin/companies/${company.id}`)
  }

  const handleAssignUsers = (company: Company) => {
    router.push(`/admin/companies/${company.id}/users`)
  }



  const handleDeleteConfirm = async () => {
    if (!showDelete.company) return

    try {
      setBusy(true)
      const token = await getToken()
      const res = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete-company', companyId: showDelete.company.id })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Error al eliminar empresa')

      success('Empresa eliminada exitosamente')
      setShowDelete({ open: false })
      refresh()
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }



  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return companies
    const s = search.toLowerCase()
    return companies.filter(c =>
      c.name.toLowerCase().includes(s) ||
      (c.legal_name && c.legal_name.toLowerCase().includes(s)) ||
      (c.tax_id && c.tax_id.toLowerCase().includes(s))
    )
  }, [companies, search])



  // Estadísticas rápidas
  const stats = useMemo(() => {
    const total = companies.length
    const active = companies.filter(c => c.is_active).length
    const inactive = total - active
    
    return { total, active, inactive }
  }, [companies])

  // Mostrar loading mientras se verifica la sesión
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Verificando sesión...</p>
      </div>
    </div>
  )

  // Renderizar contenido según el rol
  return (
    <RequireRoleClient allow={['superadmin', 'admin']}>
      <div className="space-y-6">
        {/* Lista de empresas */}
        <div className="space-y-4 p-4 sm:p-6">
            {/* Header compacto */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Empresas</h1>
                <p className="text-gray-600 mt-1">Administre las empresas y sus usuarios asignados</p>
              </div>
              <button 
                onClick={handleCreate}
                disabled={busy}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-accent text-white hover:bg-brand-accentDark disabled:opacity-50 transition-colors w-full sm:w-auto shadow-sm text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Empresa</span>
              </button>
            </div>

            {/* Estadísticas - Carrusel en mobile, Grid en desktop */}
            
            {/* Mobile: Carrusel horizontal con scroll */}
            <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-3 pb-2">
                {/* Total Empresas */}
                <div className="bg-gradient-to-br from-brand-dark to-[#003d66] rounded-lg shadow-md p-5 text-white flex-shrink-0 w-[280px]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-gray-100 text-sm font-medium">Total Empresas</p>
                      <p className="text-4xl font-bold mt-2">{stats.total}</p>
                    </div>
                    <Building2 className="w-16 h-16 text-gray-200 opacity-40" />
                  </div>
                  <div className="flex items-center text-gray-100 text-xs border-t border-white/20 pt-3">
                    <Building2 className="w-4 h-4 mr-1.5" />
                    <span>Registradas</span>
                  </div>
                </div>

                {/* Empresas Activas */}
                <div className="bg-gradient-to-br from-brand-accent to-brand-accentDark rounded-lg shadow-md p-5 text-white flex-shrink-0 w-[280px]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-pink-100 text-sm font-medium">Empresas Activas</p>
                      <p className="text-4xl font-bold mt-2">{stats.active}</p>
                    </div>
                    <Building2 className="w-16 h-16 text-pink-100 opacity-40" />
                  </div>
                  <div className="flex items-center text-pink-100 text-xs border-t border-white/20 pt-3">
                    <Building2 className="w-4 h-4 mr-1.5" />
                    <span>Operativas</span>
                  </div>
                </div>

                {/* Inactivas */}
                <div className="bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-lg shadow-md p-5 text-white flex-shrink-0 w-[280px]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-gray-100 text-sm font-medium">Inactivas</p>
                      <p className="text-4xl font-bold mt-2">{stats.inactive}</p>
                    </div>
                    <Building2 className="w-16 h-16 text-gray-200 opacity-40" />
                  </div>
                  <div className="flex items-center text-gray-100 text-xs border-t border-white/20 pt-3">
                    <Building2 className="w-4 h-4 mr-1.5" />
                    <span>Suspendidas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: Grid tradicional */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-4">
              {/* Total Empresas */}
              <div className="bg-gradient-to-br from-brand-dark to-[#003d66] rounded-lg shadow-md p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-100 text-sm font-medium">Total Empresas</p>
                    <p className="text-3xl font-bold mt-2">{stats.total}</p>
                  </div>
                  <Building2 className="w-12 h-12 text-gray-200 opacity-80" />
                </div>
                <div className="mt-4 flex items-center text-gray-100 text-sm">
                  <Building2 className="w-4 h-4 mr-1" />
                  Registradas
                </div>
              </div>

              {/* Empresas Activas */}
              <div className="bg-gradient-to-br from-brand-accent to-brand-accentDark rounded-lg shadow-md p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-100 text-sm font-medium">Empresas Activas</p>
                    <p className="text-3xl font-bold mt-2">{stats.active}</p>
                  </div>
                  <Building2 className="w-12 h-12 text-pink-100 opacity-80" />
                </div>
                <div className="mt-4 flex items-center text-pink-100 text-sm">
                  <Building2 className="w-4 h-4 mr-1" />
                  Operativas
                </div>
              </div>

              {/* Inactivas */}
              <div className="bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-lg shadow-md p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-100 text-sm font-medium">Inactivas</p>
                    <p className="text-3xl font-bold mt-2">{stats.inactive}</p>
                  </div>
                  <Building2 className="w-12 h-12 text-gray-200 opacity-80" />
                </div>
                <div className="mt-4 flex items-center text-gray-100 text-sm">
                  <Building2 className="w-4 h-4 mr-1" />
                  Suspendidas
                </div>
              </div>
            </div>

            {/* Búsqueda */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, razón social o RFC..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
              />
            </div>

            {/* Listado de empresas - diseño compacto */}
            {busy && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando empresas...</p>
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
                    <div className="flex-1 min-w-[200px]">
                      <span className="text-xs font-semibold uppercase tracking-wide">Empresa</span>
                    </div>
                    <div className="w-36 flex-shrink-0">
                      <span className="text-xs font-semibold uppercase tracking-wide">RFC</span>
                    </div>
                    <div className="w-36 flex-shrink-0">
                      <span className="text-xs font-semibold uppercase tracking-wide">Industria</span>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs font-semibold uppercase tracking-wide">Acciones</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  {filteredCompanies.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm bg-white">
                      {search.trim()
                        ? 'No se encontraron empresas con los criterios de búsqueda'
                        : 'No hay empresas registradas aún'}
                    </div>
                  )}
                  {filteredCompanies.map((company, index) => {
                    // Efecto striped: alternar entre blanco y gris claro
                    const isEven = index % 2 === 0
                    const bgColor = isEven ? 'bg-white' : 'bg-gray-100'
                    const hoverColor = isEven ? 'hover:bg-gray-50' : 'hover:bg-gray-200'
                    
                    return (
                      <div
                        key={company.id}
                        className={`p-3 sm:p-4 ${bgColor} ${hoverColor} transition-colors border-b border-gray-200 last:border-b-0`}
                      >
                        {/* Mobile: Layout compacto vertical */}
                        <div className="flex flex-col gap-2 lg:hidden">
                          {/* Header con nombre y estado */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <Building2 className="w-4 h-4 text-brand-dark flex-shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-sm text-gray-900 leading-tight">{company.name}</h3>
                                {company.legal_name && (
                                  <p className="text-xs text-gray-600 leading-tight mt-0.5">{company.legal_name}</p>
                                )}
                              </div>
                            </div>
                            <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded font-medium ${
                              company.is_active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {company.is_active ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>
                          
                          {/* Info condensada en una línea */}
                          <div className="flex items-center gap-3 text-xs text-gray-600 ml-6">
                            {company.tax_id && (
                              <span className="truncate">
                                <span className="font-medium">RFC:</span> {company.tax_id}
                              </span>
                            )}
                            {company.industry && (
                              <span className="truncate">
                                <span className="font-medium">•</span> {company.industry}
                              </span>
                            )}
                          </div>

                          {/* Botones - grid flexible según permisos */}
                          <div className={`grid gap-2 mt-1 ${isSuper ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            <button
                              disabled={busy}
                              onClick={() => handleEdit(company)}
                              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-medium disabled:opacity-50"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>

                            <button
                              disabled={busy}
                              onClick={() => handleAssignUsers(company)}
                              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-xs font-medium disabled:opacity-50"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Usuarios</span>
                            </button>

                            {isSuper && (
                              <button
                                disabled={busy}
                                onClick={() => setShowDelete({ open: true, company })}
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
                              company.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-300'
                            }`}>
                              {company.is_active ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>

                          {/* Columna 2: Nombre y razón social (flex-1, min 200px) */}
                          <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-brand-dark flex-shrink-0" />
                              <div className="min-w-0">
                                <h3 className="font-semibold text-sm text-gray-900 truncate">{company.name}</h3>
                                {company.legal_name && (
                                  <p className="text-xs text-gray-600 truncate">{company.legal_name}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Columna 3: RFC (150px) */}
                          <div className="w-36 flex-shrink-0">
                            <p className="text-xs text-gray-600 truncate">
                              {company.tax_id ? (
                                <>
                                  <span className="font-medium">RFC:</span> {company.tax_id}
                                </>
                              ) : (
                                <span className="text-gray-400">Sin RFC</span>
                              )}
                            </p>
                          </div>

                          {/* Columna 4: Industria (150px) */}
                          <div className="w-36 flex-shrink-0">
                            <p className="text-xs text-gray-600 truncate">
                              {company.industry || <span className="text-gray-400">Sin industria</span>}
                            </p>
                          </div>

                          {/* Columna 5: Acciones */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              disabled={busy}
                              onClick={() => handleEdit(company)}
                              className="p-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              disabled={busy}
                              onClick={() => handleAssignUsers(company)}
                              className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                              title="Asignar usuarios"
                            >
                              <Users className="w-4 h-4" />
                            </button>

                            {isSuper && (
                              <button
                                disabled={busy}
                                onClick={() => setShowDelete({ open: true, company })}
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
          title="Eliminar Empresa"
          message={`¿Está seguro de que desea eliminar la empresa "${showDelete.company?.name}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          type="danger"
        />
      </div>
    </RequireRoleClient>
  )
}
