"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import { useToast } from '@/lib/useToast'
import { ArrowLeft, UserPlus, UserMinus, Users, Building2, UserCheck, UserX } from 'lucide-react'
import ConfirmModal from '@/app/components/ConfirmModal'

interface CompanyUser {
  id: string
  user_id: string
  company_id: string
  role_in_company: 'admin' | 'member' | 'viewer'
  is_active: boolean
  profiles?: {
    first_name: string | null
    last_name: string | null
    phone: string | null
  } | null
}

interface CompanyData {
  id: string
  name: string
  legal_name: string | null
  company_users: CompanyUser[]
}

interface PartnerUser {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
}

export default function CompanyUsersPage() {
  const params = useParams()
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const { success, error: showError } = useToast()

  const companyId = params.id as string

  const [company, setCompany] = useState<CompanyData | null>(null)
  const [partners, setPartners] = useState<PartnerUser[]>([])
  const [busy, setBusy] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  
  // Form state
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRoleInCompany, setSelectedRoleInCompany] = useState<'admin' | 'member' | 'viewer'>('member')
  
  // Modal state
  const [showRemove, setShowRemove] = useState<{ open: boolean; assignment?: CompanyUser }>({ open: false })

  const isSuper = (profile as any)?.roles?.name === 'superadmin'
  const isAdmin = (profile as any)?.roles?.name === 'admin'
  const canManage = isSuper || isAdmin

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.replace('/auth')
    }
  }, [loading, user, profile, router])

  const getToken = async () => {
    const s = await supabase.auth.getSession()
    return (s as any).data?.session?.access_token ?? null
  }

  // Load company data and partners
  const loadData = useCallback(async () => {
    try {
      setLoadingData(true)
      const token = await getToken()

      // Load company with users
      const r1 = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'get-company', companyId })
      })
      const b1 = await r1.json()
      if (!r1.ok) throw new Error(b1.error || 'Error loading company')
      setCompany(b1.data)

      // Load all partners
      const r2 = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'list-users' })
      })
      const b2 = await r2.json()
      if (!r2.ok) throw new Error(b2.error || 'Error loading users')
      
      const allUsers = b2.data || []
      const partnerUsers = allUsers.filter((u: any) => {
        const roleName = u.roles?.name || ''
        return roleName === 'partner' && u.is_active
      })
      setPartners(partnerUsers)
    } catch (err: any) {
      showError(err.message || 'Error loading data')
      router.push('/admin/companies')
    } finally {
      setLoadingData(false)
    }
  }, [companyId, showError, router])

  useEffect(() => {
    if (!user || !canManage) return
    loadData()
  }, [user, canManage, loadData])

  // Available partners (not already assigned)
  const availablePartners = useMemo(() => {
    if (!company) return partners
    const assignedUserIds = new Set(company.company_users?.map(cu => cu.user_id) || [])
    return partners.filter(p => !assignedUserIds.has(p.id))
  }, [partners, company])

  const handleAssignUser = async () => {
    if (!selectedUserId) return

    try {
      setBusy(true)
      const token = await getToken()
      const res = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          action: 'assign-user-to-company',
          companyId,
          userId: selectedUserId,
          roleInCompany: selectedRoleInCompany
        })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Error al asignar usuario')

      success('Usuario asignado exitosamente')
      setSelectedUserId('')
      setSelectedRoleInCompany('member')
      await loadData()
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleRemoveUser = async () => {
    if (!showRemove.assignment) return

    try {
      setBusy(true)
      const token = await getToken()
      const res = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'remove-user-from-company', assignmentId: showRemove.assignment.id })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Error al remover usuario')

      success('Usuario removido exitosamente')
      setShowRemove({ open: false })
      await loadData()
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  // Loading state
  if (loading || loadingData) {
    return (
      <RequireRoleClient allow={['superadmin', 'admin']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </RequireRoleClient>
    )
  }

  if (!company) return null

  return (
    <RequireRoleClient allow={['superadmin', 'admin']}>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/companies')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-brand-dark" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{company.name}</h1>
            </div>
            <p className="text-gray-600 mt-1">Gestione los usuarios asignados a esta empresa</p>
            {company.legal_name && (
              <p className="text-sm text-gray-500 mt-0.5">{company.legal_name}</p>
            )}
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-brand-dark to-[#003d66] rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-100 text-sm font-medium">Total Usuarios</p>
                <p className="text-3xl font-bold mt-2">{company.company_users?.length || 0}</p>
              </div>
              <Users className="w-12 h-12 text-gray-200 opacity-80" />
            </div>
            <div className="mt-4 flex items-center text-gray-100 text-sm">
              <Users className="w-4 h-4 mr-1" />
              Asignados
            </div>
          </div>
          <div className="bg-gradient-to-br from-brand-accent to-brand-accentDark rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm font-medium">Activos</p>
                <p className="text-3xl font-bold mt-2">
                  {company.company_users?.filter(cu => cu.is_active).length || 0}
                </p>
              </div>
              <UserCheck className="w-12 h-12 text-pink-100 opacity-80" />
            </div>
            <div className="mt-4 flex items-center text-pink-100 text-sm">
              <UserCheck className="w-4 h-4 mr-1" />
              Operativos
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Disponibles</p>
                <p className="text-3xl font-bold mt-2">{availablePartners.length}</p>
              </div>
              <UserPlus className="w-12 h-12 text-emerald-100 opacity-80" />
            </div>
            <div className="mt-4 flex items-center text-emerald-100 text-sm">
              <UserPlus className="w-4 h-4 mr-1" />
              Para asignar
            </div>
          </div>
        </div>

        {/* Formulario de asignación */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Asignar Nuevo Usuario
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seleccionar Usuario
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="form-input"
                disabled={busy || availablePartners.length === 0}
              >
                <option value="">
                  {availablePartners.length === 0 
                    ? 'No hay usuarios disponibles' 
                    : 'Seleccione un usuario'}
                </option>
                {availablePartners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.first_name} {partner.last_name} {partner.phone ? `- ${partner.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol en la Empresa
              </label>
              <select
                value={selectedRoleInCompany}
                onChange={(e) => setSelectedRoleInCompany(e.target.value as any)}
                className="form-input"
                disabled={busy}
              >
                <option value="viewer">Viewer - Solo lectura</option>
                <option value="member">Member - Usuario estándar</option>
                <option value="admin">Admin - Administrador</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAssignUser}
              disabled={!selectedUserId || busy}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {busy ? 'Asignando...' : 'Asignar Usuario'}
            </button>
            {availablePartners.length === 0 && company.company_users?.length > 0 && (
              <p className="text-sm text-gray-500 flex items-center">
                Todos los usuarios partners disponibles ya están asignados
              </p>
            )}
          </div>
        </div>

        {/* Lista de usuarios asignados */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuarios Asignados ({company.company_users?.length || 0})
            </h2>
          </div>
          
          {!company.company_users || company.company_users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay usuarios asignados a esta empresa</p>
              <p className="text-sm mt-1">Use el formulario de arriba para asignar usuarios</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {company.company_users.map((cu) => {
                const fullName = cu.profiles
                  ? `${cu.profiles.first_name || ''} ${cu.profiles.last_name || ''}`.trim()
                  : 'Usuario sin nombre'

                return (
                  <div
                    key={cu.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      {/* Información del usuario */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base text-gray-900">{fullName}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            cu.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-300'
                          }`}>
                            {cu.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-0.5">
                          {cu.profiles?.phone && (
                            <p>📱 {cu.profiles.phone}</p>
                          )}
                          <p>
                            <span className="font-medium">Rol:</span>{' '}
                            <span className="capitalize">{cu.role_in_company}</span>
                            {cu.role_in_company === 'admin' && ' - Administrador'}
                            {cu.role_in_company === 'member' && ' - Usuario estándar'}
                            {cu.role_in_company === 'viewer' && ' - Solo lectura'}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          ID: {cu.user_id.substring(0, 8)}...
                        </p>
                      </div>

                      {/* Botón de acción */}
                      <div className="flex gap-2 lg:flex-shrink-0">
                        <button
                          disabled={busy}
                          onClick={() => setShowRemove({ open: true, assignment: cu })}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium w-full sm:w-auto disabled:opacity-50"
                          title="Remover usuario"
                        >
                          <UserMinus className="w-4 h-4" />
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal de confirmación */}
        <ConfirmModal
          isOpen={showRemove.open}
          onCancel={() => setShowRemove({ open: false })}
          onConfirm={handleRemoveUser}
          title="Remover Usuario"
          message={`¿Está seguro de que desea remover a ${
            showRemove.assignment?.profiles
              ? `${showRemove.assignment.profiles.first_name} ${showRemove.assignment.profiles.last_name}`
              : 'este usuario'
          } de la empresa?`}
          confirmText="Remover"
          type="danger"
        />
      </div>
    </RequireRoleClient>
  )
}
