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

// Types
interface UserOption {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
}

type ViewMode = 'list' | 'create' | 'edit' | 'view' | 'assign-users'

export default function CompaniesAdminPage() {
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()
  const { success, error: showError, info } = useToast()

  const [companies, setCompanies] = useState<Company[]>([])
  const [partners, setPartners] = useState<UserOption[]>([])
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithUsers | null>(null)

  // Form state
  const [form, setForm] = useState({
    id: '',
    name: '',
    legal_name: '',
    tax_id: '',
    industry: '',
    website: '',
    address: { street: '', city: '', state: '', zip: '', country: '' },
    contact_info: { email: '', phone: '', mobile: '' },
    is_active: true
  })
  const [formErrors, setFormErrors] = useState<{ name?: string; tax_id?: string }>({})
  
  // User assignment state
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRoleInCompany, setSelectedRoleInCompany] = useState<'admin' | 'member' | 'viewer'>('member')
  
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

      // Obtener usuarios (partners) para asignación
      const r2 = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'list-users' })
      })
      const b2 = await r2.json()
      if (!r2.ok) throw new Error(b2.error || 'No se pudo obtener usuarios')
      
      // Filtrar solo partners activos
      const allUsers = b2.data || []
      const partnerUsers = allUsers.filter((u: any) => {
        const roleName = u.roles?.name || ''
        return roleName === 'partner' && u.is_active
      })
      setPartners(partnerUsers)
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

  const resetForm = () => {
    setForm({
      id: '',
      name: '',
      legal_name: '',
      tax_id: '',
      industry: '',
      website: '',
      address: { street: '', city: '', state: '', zip: '', country: '' },
      contact_info: { email: '', phone: '', mobile: '' },
      is_active: true
    })
    setFormErrors({})
  }

  const handleCreate = () => {
    resetForm()
    setViewMode('create')
  }

  const handleEdit = async (company: Company) => {
    const address = company.address || {}
    const contact_info = company.contact_info || {}
    
    setForm({
      id: company.id,
      name: company.name,
      legal_name: company.legal_name || '',
      tax_id: company.tax_id || '',
      industry: company.industry || '',
      website: company.website || '',
      address: { 
        street: address.street || '', 
        city: address.city || '', 
        state: address.state || '', 
        zip: address.zip || '', 
        country: address.country || '' 
      },
      contact_info: { 
        email: contact_info.email || '', 
        phone: contact_info.phone || '', 
        mobile: contact_info.mobile || '' 
      },
      is_active: company.is_active
    })
    setViewMode('edit')
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

  const handleAssignUsers = async (company: Company) => {
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
      setSelectedUserId('')
      setSelectedRoleInCompany('member')
      setViewMode('assign-users')
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: { name?: string; tax_id?: string } = {}
    
    if (!form.name.trim()) {
      errors.name = 'El nombre de la empresa es requerido'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      setBusy(true)
      const token = await getToken()
      const action = viewMode === 'create' ? 'create-company' : 'update-company'
      const payload: any = {
        action,
        name: form.name.trim(),
        legal_name: form.legal_name.trim() || null,
        tax_id: form.tax_id.trim() || null,
        industry: form.industry.trim() || null,
        website: form.website.trim() || null,
        address: form.address,
        contact_info: form.contact_info,
        is_active: form.is_active
      }
      
      if (viewMode === 'edit') {
        payload.companyId = form.id
      }

      const res = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Error al guardar empresa')

      success(viewMode === 'create' ? 'Empresa creada exitosamente' : 'Empresa actualizada exitosamente')
      setViewMode('list')
      resetForm()
      refresh()
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
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

  const handleAssignUser = async () => {
    if (!selectedCompany || !selectedUserId) return

    try {
      setBusy(true)
      const token = await getToken()
      const res = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          action: 'assign-user-to-company',
          companyId: selectedCompany.id,
          userId: selectedUserId,
          roleInCompany: selectedRoleInCompany
        })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Error al asignar usuario')

      success('Usuario asignado exitosamente')
      setSelectedUserId('')
      // Recargar detalles de la empresa
      handleAssignUsers(selectedCompany)
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleRemoveUser = async (assignmentId: string) => {
    if (!confirm('¿Está seguro de que desea remover este usuario de la empresa?')) return

    try {
      setBusy(true)
      const token = await getToken()
      const res = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'remove-user-from-company', assignmentId })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Error al remover usuario')

      success('Usuario removido exitosamente')
      // Recargar detalles de la empresa
      if (selectedCompany) {
        handleAssignUsers(selectedCompany)
      }
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

  const availablePartners = useMemo(() => {
    if (!selectedCompany) return partners
    const assignedUserIds = new Set(selectedCompany.company_users?.map(cu => cu.user_id) || [])
    return partners.filter(p => !assignedUserIds.has(p.id))
  }, [partners, selectedCompany])

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Empresas</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Administre las empresas y sus usuarios asignados</p>
          </div>
          {viewMode === 'list' && (
            <button
              onClick={handleCreate}
              disabled={busy}
              className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              <span className="sm:inline">Nueva Empresa</span>
            </button>
          )}
        </div>

        {/* Lista de empresas */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Buscar por nombre, razón social o RFC..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent"
              />
            </div>

            {busy && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando empresas...</p>
              </div>
            )}

            {!busy && filteredCompanies.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                {search ? 'No se encontraron empresas con ese criterio' : 'No hay empresas registradas'}
              </div>
            )}

            {!busy && filteredCompanies.length > 0 && (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-brand-dark">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Empresa
                        </th>
                        <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          RFC/Tax ID
                        </th>
                        <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Industria
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCompanies.map((company) => (
                        <tr key={company.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-4">
                            <div className="flex items-start sm:items-center">
                              <Building2 className="w-5 h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">{company.name}</div>
                                {company.legal_name && (
                                  <div className="text-sm text-gray-500 truncate">{company.legal_name}</div>
                                )}
                                {/* Mostrar RFC e Industria en móviles */}
                                <div className="md:hidden text-xs text-gray-500 mt-1 space-y-0.5">
                                  {company.tax_id && <div>RFC: {company.tax_id}</div>}
                                  {company.industry && <div>{company.industry}</div>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {company.tax_id || '-'}
                          </td>
                          <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {company.industry || '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              company.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {company.is_active ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <button
                                onClick={() => handleView(company)}
                                className="text-brand-dark hover:text-brand-accent transition-colors p-1"
                                title="Ver detalles"
                              >
                                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                              <button
                                onClick={() => handleEdit(company)}
                                className="text-brand-dark hover:text-brand-accent transition-colors p-1"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                              <button
                                onClick={() => handleAssignUsers(company)}
                                className="text-brand-dark hover:text-brand-accent transition-colors p-1"
                                title="Asignar usuarios"
                              >
                                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                              {isSuper && (
                                <button
                                  onClick={() => setShowDelete({ open: true, company })}
                                  className="text-red-600 hover:text-red-800 transition-colors p-1"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Formulario de creación/edición */}
        {(viewMode === 'create' || viewMode === 'edit') && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">
              {viewMode === 'create' ? 'Nueva Empresa' : 'Editar Empresa'}
            </h2>

            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Empresa <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`form-input ${formErrors.name ? 'border-red-500' : ''}`}
                    placeholder="Ej: Acme Corporation"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    value={form.legal_name}
                    onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
                    className="form-input"
                    placeholder="Ej: Acme Corporation S.A. de C.V."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RFC / Tax ID
                  </label>
                  <input
                    type="text"
                    value={form.tax_id}
                    onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                    className={`form-input ${formErrors.tax_id ? 'border-red-500' : ''}`}
                    placeholder="Ej: ACM123456ABC"
                  />
                  {formErrors.tax_id && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.tax_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industria
                  </label>
                  <input
                    type="text"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="form-input"
                    placeholder="Ej: Tecnología, Manufactura, Servicios"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="form-input"
                    placeholder="https://www.ejemplo.com"
                  />
                </div>
              </div>

              {/* Información de contacto */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Información de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.contact_info.email}
                      onChange={(e) => setForm({
                        ...form,
                        contact_info: { ...form.contact_info, email: e.target.value }
                      })}
                      className="form-input"
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={form.contact_info.phone}
                      onChange={(e) => setForm({
                        ...form,
                        contact_info: { ...form.contact_info, phone: e.target.value }
                      })}
                      className="form-input"
                      placeholder="+52 55 1234 5678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Móvil
                    </label>
                    <input
                      type="tel"
                      value={form.contact_info.mobile}
                      onChange={(e) => setForm({
                        ...form,
                        contact_info: { ...form.contact_info, mobile: e.target.value }
                      })}
                      className="form-input"
                      placeholder="+52 55 9876 5432"
                    />
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Dirección</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calle
                    </label>
                    <input
                      type="text"
                      value={form.address.street}
                      onChange={(e) => setForm({
                        ...form,
                        address: { ...form.address, street: e.target.value }
                      })}
                      className="form-input"
                      placeholder="Calle Principal #123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={form.address.city}
                      onChange={(e) => setForm({
                        ...form,
                        address: { ...form.address, city: e.target.value }
                      })}
                      className="form-input"
                      placeholder="Ciudad"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <input
                      type="text"
                      value={form.address.state}
                      onChange={(e) => setForm({
                        ...form,
                        address: { ...form.address, state: e.target.value }
                      })}
                      className="form-input"
                      placeholder="Estado"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={form.address.zip}
                      onChange={(e) => setForm({
                        ...form,
                        address: { ...form.address, zip: e.target.value }
                      })}
                      className="form-input"
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      País
                    </label>
                    <input
                      type="text"
                      value={form.address.country}
                      onChange={(e) => setForm({
                        ...form,
                        address: { ...form.address, country: e.target.value }
                      })}
                      className="form-input"
                      placeholder="México"
                    />
                  </div>
                </div>
              </div>

              {/* Estado */}
              {viewMode === 'edit' && (
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="rounded border-gray-300 text-brand-dark focus:ring-brand-accent"
                    />
                    <span className="ml-2 text-sm text-gray-700">Empresa activa</span>
                  </label>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setViewMode('list')
                    resetForm()
                  }}
                  disabled={busy}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={busy}
                  className="btn-primary"
                >
                  {busy ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
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

        {/* Asignación de usuarios */}
        {viewMode === 'assign-users' && selectedCompany && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold">Asignar Usuarios</h2>
                <p className="text-gray-600 mt-1">{selectedCompany.name}</p>
              </div>
              <button
                onClick={() => setViewMode('list')}
                className="text-brand-dark hover:text-brand-accent transition-colors font-medium"
              >
                Volver
              </button>
            </div>

            {/* Formulario de asignación */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Asignar Nuevo Usuario</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Seleccione un usuario</option>
                    {availablePartners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.first_name} {partner.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    value={selectedRoleInCompany}
                    onChange={(e) => setSelectedRoleInCompany(e.target.value as any)}
                    className="form-input"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleAssignUser}
                  disabled={!selectedUserId || busy}
                  className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Asignar Usuario
                </button>
              </div>
            </div>

            {/* Lista de usuarios asignados */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Usuarios Asignados</h3>
              {selectedCompany.company_users && selectedCompany.company_users.length > 0 ? (
                <div className="border rounded-lg overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-brand-dark">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-white uppercase">Usuario</th>
                        <th className="hidden sm:table-cell px-3 sm:px-4 py-2 text-left text-xs font-medium text-white uppercase">Teléfono</th>
                        <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-white uppercase">Rol</th>
                        <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-white uppercase">Estado</th>
                        <th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-white uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {selectedCompany.company_users.map((cu) => (
                        <tr key={cu.id}>
                          <td className="px-3 sm:px-4 py-2 text-sm text-gray-900">
                            <div>
                              <div>{cu.profiles?.first_name} {cu.profiles?.last_name}</div>
                              {/* Mostrar teléfono en móviles */}
                              <div className="sm:hidden text-xs text-gray-500 mt-0.5">
                                {cu.profiles?.phone || '-'}
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-3 sm:px-4 py-2 text-sm text-gray-900">
                            {cu.profiles?.phone || '-'}
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-sm text-gray-900 capitalize">{cu.role_in_company}</td>
                          <td className="px-3 sm:px-4 py-2 text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              cu.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {cu.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-right">
                            <button
                              onClick={() => handleRemoveUser(cu.id)}
                              className="text-red-600 hover:text-red-800 transition-colors p-1"
                              title="Remover usuario"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4">No hay usuarios asignados a esta empresa</p>
              )}
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
