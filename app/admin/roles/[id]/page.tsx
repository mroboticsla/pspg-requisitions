"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useSafeRouter } from '@/lib/useSafeRouter'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import ConfirmModal from '@/app/components/ConfirmModal'
import { useToast } from '@/lib/useToast'
import { MENU } from '@/app/components/navigation/menuConfig'
import { ArrowLeft, Save, Trash2, Shield, AlertTriangle } from 'lucide-react'

interface RoleData {
  id: string
  name: string
  permissions?: {
    description?: string
    can_do?: string[]
    modules?: Record<string, boolean>
  }
}

export default function RoleEditPage({ params }: { params: { id: string } }) {
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()
  const { success, error: showError } = useToast()

  const [role, setRole] = useState<RoleData | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadingRole, setLoadingRole] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Form state
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [roleModules, setRoleModules] = useState<Record<string, boolean>>({})
  const [roleCanDo, setRoleCanDo] = useState<string[]>([])
  const [customPerm, setCustomPerm] = useState('')
  const [formErrors, setFormErrors] = useState<{ name?: string }>({})

  const isSuper = (profile as any)?.roles?.name === 'superadmin'
  const isNew = params.id === 'new'

  // Roles protegidos que no se pueden eliminar ni renombrar
  const PROTECTED_ROLES = ['admin', 'superadmin', 'partner', 'candidate']

  // Módulos disponibles desde el menú
  const availableModules = useMemo(() => {
    return MENU.map(m => ({ id: m.id, label: m.label }))
  }, [])

  // Acciones sugeridas
  const suggested = [
    { key: 'manage_administrators', label: 'Gestionar administradores' },
    { key: 'manage_partners', label: 'Gestionar asociados' },
    { key: 'manage_users', label: 'Gestionar usuarios' },
    { key: 'manage_roles', label: 'Gestionar roles' },
    { key: 'approve_requisitions', label: 'Aprobar requisiciones' },
    { key: 'create_requisitions', label: 'Crear requisiciones' },
    { key: 'view_reports', label: 'Ver reportes' },
    { key: 'export_data', label: 'Exportar datos' },
  ]

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.replace('/auth')
    }
  }, [loading, user, profile, router])

  const getToken = async () => {
    const s = await supabase.auth.getSession()
    return (s as any).data?.session?.access_token ?? null
  }

  useEffect(() => {
    if (loading) return
    if (!user || !profile) return
    if (!isSuper) return
    
    const loadRole = async () => {
      if (isNew) {
        // Inicializar módulos para nuevo rol
        const defaultModules = Object.fromEntries(availableModules.map(m => [m.id, false]))
        setRoleModules(defaultModules)
        setLoadingRole(false)
        return
      }

      try {
        setLoadingRole(true)
        const s = await supabase.auth.getSession()
        const token = (s as any).data?.session?.access_token ?? null
        
        const res = await fetch('/api/admin/secure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'list-roles' })
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Error cargando rol')
        
        const roles = body.data || []
        const foundRole = roles.find((r: any) => r.id === params.id)
        
        if (!foundRole) {
          showError('Rol no encontrado')
          router.replace('/admin/roles')
          return
        }

        setRole(foundRole)
        setRoleName(foundRole.name)
        
        const p = foundRole.permissions || {}
        setRoleDescription(typeof p?.description === 'string' ? p.description : '')
        setRoleCanDo(Array.isArray(p?.can_do) ? p.can_do : [])
        
        const modulesObj = typeof p?.modules === 'object' && p.modules ? p.modules : {}
        const defaultModules = Object.fromEntries(availableModules.map(m => [m.id, false]))
        const mergedModules = { ...defaultModules }
        Object.keys(mergedModules).forEach(k => { mergedModules[k] = Boolean(modulesObj[k]) })
        setRoleModules(mergedModules)
        
      } catch (err: any) {
        showError(err.message || String(err))
        router.replace('/admin/roles')
      } finally {
        setLoadingRole(false)
      }
    }
    
    loadRole()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, profile, isSuper, params.id, isNew])

  const isRoleProtected = (roleName: string): boolean => {
    return PROTECTED_ROLES.includes(roleName.toLowerCase())
  }

  const isRoleInUse = async (roleId: string): Promise<boolean> => {
    try {
      const token = await getToken()
      const res = await fetch('/api/admin/secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'list-users' })
      })
      const body = await res.json()
      if (!res.ok) return false
      
      const users = body.data || []
      return users.some((u: any) => u.role_id === roleId)
    } catch {
      return false
    }
  }

  const handleSave = async () => {
    try {
      setBusy(true)
      
      const normalizedName = roleName.trim().toLowerCase()
      if (!normalizedName) {
        setFormErrors({ name: 'El nombre es requerido' })
        setBusy(false)
        return
      }
      
      if (normalizedName.length < 3 || normalizedName.length > 30) {
        setFormErrors({ name: 'El nombre debe tener entre 3 y 30 caracteres' })
        setBusy(false)
        return
      }
      
      if (!/^[a-z0-9_-]+$/.test(normalizedName)) {
        setFormErrors({ name: 'Solo se permiten letras minúsculas, números, guion y guion bajo' })
        setBusy(false)
        return
      }
      
      const permissions: any = {
        description: roleDescription?.trim() || undefined,
        can_do: roleCanDo,
        modules: Object.fromEntries(Object.entries(roleModules).filter(([, v]) => Boolean(v))),
      }
      
      const token = await getToken()
      
      if (isNew) {
        // Crear nuevo rol
        const res = await fetch('/api/admin/secure', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
          body: JSON.stringify({ action: 'create-role', name: normalizedName, permissions }) 
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Error creando rol')
        
        success('Rol creado exitosamente')
        router.replace('/admin/roles')
      } else {
        // Actualizar rol existente
        const res = await fetch('/api/admin/secure', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
          body: JSON.stringify({ action: 'update-role', id: params.id, name: normalizedName, permissions }) 
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Error actualizando rol')
        
        success('Rol actualizado exitosamente')
        router.replace('/admin/roles')
      }
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteRequest = async () => {
    if (!role) return
    
    if (isRoleProtected(role.name)) {
      showError(`El rol "${role.name}" es un rol del sistema y no puede ser eliminado`)
      return
    }

    const inUse = await isRoleInUse(role.id)
    if (inUse) {
      showError(`El rol "${role.name}" no puede ser eliminado porque hay usuarios asignados a este rol`)
      return
    }

    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!role) return
    
    try {
      setBusy(true)
      const token = await getToken()
      const res = await fetch('/api/admin/secure', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify({ action: 'delete-role', id: role.id }) 
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Error eliminando rol')
      
      success('Rol eliminado exitosamente')
      router.replace('/admin/roles')
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
      setShowDeleteModal(false)
    }
  }

  const toggleCanDo = (key: string) => {
    setRoleCanDo(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const toggleModule = (key: string) => {
    setRoleModules(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const addCustomPerm = () => {
    const k = customPerm.trim()
    if (!k) return
    if (roleCanDo.includes(k)) return
    setRoleCanDo(prev => [...prev, k])
    setCustomPerm('')
  }

  const removeCustomPerm = (k: string) => {
    setRoleCanDo(prev => prev.filter(x => x !== k))
  }

  if (loading || loadingRole) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando información del rol...</p>
      </div>
    </div>
  )

  const isProtected = role && isRoleProtected(role.name)

  return (
    <RequireRoleClient allow={['superadmin']}>
      <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.replace('/admin/roles')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={busy}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {isNew ? 'Crear Nuevo Rol' : `Editar Rol: ${role?.name}`}
              </h1>
              <p className="text-gray-600 mt-1">
                {isNew ? 'Configure el nuevo rol y sus permisos' : 'Modifique los permisos y configuración del rol'}
              </p>
            </div>
          </div>
        </div>

        {/* Advertencia para roles protegidos */}
        {isProtected && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900">Rol del Sistema</h3>
              <p className="text-sm text-purple-700 mt-1">
                Este es un rol protegido del sistema. El nombre no puede ser modificado y el rol no puede ser eliminado.
                Solo se pueden editar los permisos y módulos asignados.
              </p>
            </div>
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Información Básica
            </h2>

            {/* Nombre del Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Rol *
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => {
                  setRoleName(e.target.value)
                  setFormErrors({})
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                placeholder="ej: manager, supervisor, viewer"
                disabled={busy || Boolean(isProtected)}
              />
              {formErrors.name && (
                <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Solo letras minúsculas, números, guion y guion bajo. Entre 3 y 30 caracteres.
              </p>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                placeholder="Descripción del rol y sus responsabilidades..."
                rows={3}
                disabled={busy}
              />
            </div>
          </div>

          {/* Acceso a Módulos */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Acceso a Módulos
            </h2>
            <p className="text-sm text-gray-600">
              Seleccione los módulos a los que este rol tendrá acceso en el sistema
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableModules.map(module => (
                <label 
                  key={module.id} 
                  className={`
                    flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${roleModules[module.id] 
                      ? 'bg-brand-dark/5 border-brand-dark shadow-sm' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={roleModules[module.id] || false}
                    onChange={() => toggleModule(module.id)}
                    className="w-5 h-5 text-brand-accent focus:ring-brand-accent border-gray-300 rounded"
                    disabled={busy}
                  />
                  <span className="text-sm font-medium text-gray-700">{module.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Permisos */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Permisos del Sistema
            </h2>
            <p className="text-sm text-gray-600">
              Configure los permisos específicos que este rol tendrá en el sistema
            </p>

            {/* Permisos Sugeridos */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Permisos Comunes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {suggested.map(perm => (
                  <label 
                    key={perm.key} 
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${roleCanDo.includes(perm.key)
                        ? 'bg-emerald-50 border-emerald-300 shadow-sm' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={roleCanDo.includes(perm.key)}
                      onChange={() => toggleCanDo(perm.key)}
                      className="w-4 h-4 text-brand-accent focus:ring-brand-accent border-gray-300 rounded"
                      disabled={busy}
                    />
                    <span className="text-sm text-gray-700">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Permisos Personalizados */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Permisos Personalizados</h3>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={customPerm}
                  onChange={(e) => setCustomPerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomPerm())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent text-sm"
                  placeholder="nombre_del_permiso"
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={addCustomPerm}
                  disabled={busy || !customPerm.trim()}
                  className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accentDark disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  Agregar
                </button>
              </div>
              
              {roleCanDo.filter(p => !suggested.some(s => s.key === p)).length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {roleCanDo.filter(p => !suggested.some(s => s.key === p)).map(perm => (
                    <span
                      key={perm}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                    >
                      {perm}
                      <button
                        onClick={() => removeCustomPerm(perm)}
                        className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                        disabled={busy}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={busy}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
            >
              <Save className="w-5 h-5" />
              <span>{isNew ? 'Crear Rol' : 'Guardar Cambios'}</span>
            </button>

            {!isNew && !isProtected && (
              <button
                onClick={handleDeleteRequest}
                disabled={busy}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-brand-accent text-white hover:bg-brand-accentDark disabled:opacity-50 transition-colors font-medium shadow-sm"
              >
                <Trash2 className="w-5 h-5" />
                <span>Eliminar Rol</span>
              </button>
            )}

            <button
              onClick={() => router.replace('/admin/roles')}
              disabled={busy}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Eliminación */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Rol"
        message={
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">¡Advertencia!</p>
                <p className="text-sm text-red-700 mt-1">
                  Esta acción es permanente y no se puede deshacer.
                </p>
              </div>
            </div>
            <p className="text-gray-700">
              ¿Está seguro de que desea eliminar el rol <strong>&quot;{role?.name}&quot;</strong>?
            </p>
          </div>
        }
        confirmText="Eliminar Rol"
        type="danger"
      />
    </RequireRoleClient>
  )
}
