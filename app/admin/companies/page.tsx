"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useSafeRouter } from '@/lib/useSafeRouter'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import ConfirmModal from '@/app/components/ConfirmModal'
import { useToast } from '@/lib/useToast'
import { Eye, Trash2, Plus, Building2, Users, Edit, UserPlus, UserMinus } from 'lucide-react'
import { Company, CompanyWithUsers } from '@/lib/types/company'

type ViewMode = 'list' | 'view'

export default function CompaniesAdminPage() {
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()
  const { success, error: showError, info } = useToast()

  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithUsers | null>(null)
  
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

  const handleView = async (company: Company) => {
    try {
      setBusy(true)
      const token = await getToken()
      const res = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'get-company', companyId: company.id })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'No se pudo obtener detalles de la empresa')
      setSelectedCompany(body.data)
      setViewMode('view')
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
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
        {viewMode === 'list' && (
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

            {/* Estadísticas compactas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <div className="divide-y divide-gray-200">
                  {filteredCompanies.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      {search.trim()
                        ? 'No se encontraron empresas con los criterios de búsqueda'
                        : 'No hay empresas registradas aún'}
                    </div>
                  )}
                  {filteredCompanies.map((company) => {
                    return (
                      <div
                        key={company.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        {/* Layout compacto: info a la izquierda, badges y botones a la derecha en desktop */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                          {/* Información de la empresa */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base text-gray-900 break-words">{company.name}</h3>
                                {company.legal_name && (
                                  <p className="text-sm text-gray-600 break-words">{company.legal_name}</p>
                                )}
                              </div>
                              <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                                company.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-600 border border-gray-300'
                              }`}>
                                {company.is_active ? 'Activa' : 'Inactiva'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-0.5 ml-7">
                              {company.tax_id && (
                                <p>
                                  <span className="font-medium">RFC:</span> {company.tax_id}
                                </p>
                              )}
                              {company.industry && (
                                <p>
                                  <span className="font-medium">Industria:</span> {company.industry}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 ml-7">
                              ID: {company.id.substring(0, 8)}...
                            </p>
                          </div>

                          {/* Botones de acción - compactos en desktop, full width en móvil */}
                          <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                            <button
                              disabled={busy}
                              onClick={() => handleView(company)}
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white transition-colors text-sm font-medium w-full sm:w-auto disabled:opacity-50"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Ver detalles</span>
                            </button>

                            <button
                              disabled={busy}
                              onClick={() => handleEdit(company)}
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium w-full sm:w-auto disabled:opacity-50"
                              title="Editar empresa"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Editar</span>
                            </button>

                            <button
                              disabled={busy}
                              onClick={() => handleAssignUsers(company)}
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium w-full sm:w-auto disabled:opacity-50"
                              title="Asignar usuarios"
                            >
                              <Users className="w-4 h-4" />
                              <span>Asignar usuarios</span>
                            </button>

                            {isSuper && (
                              <button
                                disabled={busy}
                                onClick={() => setShowDelete({ open: true, company })}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-accent text-white hover:bg-brand-accentDark transition-colors text-sm font-medium w-full sm:w-auto disabled:opacity-50"
                                title="Eliminar empresa"
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
            )}
          </div>
        )}



        {/* Vista de detalles */}
        {viewMode === 'view' && selectedCompany && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold">Detalles de la Empresa</h2>
              <button
                onClick={() => setViewMode('list')}
                className="text-brand-dark hover:text-brand-accent transition-colors font-medium"
              >
                Volver
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nombre</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCompany.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Razón Social</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCompany.legal_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">RFC / Tax ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCompany.tax_id || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Industria</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCompany.industry || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Sitio Web</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCompany.website ? (
                      <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:text-brand-accentDark hover:underline">
                        {selectedCompany.website}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Estado</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedCompany.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedCompany.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Usuarios asignados */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Usuarios Asignados</h3>
                {selectedCompany.company_users && selectedCompany.company_users.length > 0 ? (
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-brand-dark">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-white uppercase">Usuario</th>
                          <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-white uppercase">Rol</th>
                          <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-white uppercase">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {selectedCompany.company_users.map((cu) => (
                          <tr key={cu.id}>
                            <td className="px-3 sm:px-4 py-2 text-sm text-gray-900">
                              {cu.profiles?.first_name} {cu.profiles?.last_name}
                            </td>
                            <td className="px-3 sm:px-4 py-2 text-sm text-gray-900 capitalize">{cu.role_in_company}</td>
                            <td className="px-3 sm:px-4 py-2 text-sm">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                cu.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {cu.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay usuarios asignados a esta empresa</p>
                )}
              </div>
            </div>
          </div>
        )}



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
