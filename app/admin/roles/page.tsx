"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useSafeRouter } from '@/lib/useSafeRouter'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import ConfirmModal from '@/app/components/ConfirmModal'
import { useToast } from '@/lib/useToast'
import { MENU } from '@/app/components/navigation/menuConfig'
import { Eye, Trash2, Plus } from 'lucide-react'

// Types
interface RoleRow { id: string; name: string; permissions?: any }

type FormState = {
  id?: string
  name: string
  description: string
  modules: Record<string, boolean>
  canDo: string[]
  extras: Record<string, any> // claves adicionales para conservar compatibilidad
}

type ViewMode = 'list' | 'create' | 'edit'

export default function RolesAdminPage() {
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()
  const { success, error: showError, info } = useToast()

  const [roles, setRoles] = useState<RoleRow[]>([])
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  // Derivar módulos disponibles desde el menú principal para evitar duplicación
  const availableModules = useMemo(() => {
    // Tomamos todos los ids de primer nivel
    return MENU.map(m => ({ id: m.id, label: m.label }))
  }, [])

  const defaultModulesMap = useMemo(() => Object.fromEntries(availableModules.map(m => [m.id, false])) as Record<string, boolean>, [availableModules])

  const [form, setForm] = useState<FormState>({ name: '', description: '', modules: defaultModulesMap, canDo: [], extras: {} })
  const [formErrors, setFormErrors] = useState<{ name?: string; description?: string }>({})
  const [showDelete, setShowDelete] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })

  const isSuper = (profile as any)?.roles?.name === 'superadmin'

  // Roles que no se pueden eliminar
  const PROTECTED_ROLES = ['admin', 'superadmin', 'partner', 'candidate']

  // Verificar si un rol está protegido
  const isRoleProtected = (roleName: string): boolean => {
    return PROTECTED_ROLES.includes(roleName.toLowerCase())
  }

  // Verificar si un rol está en uso
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
      const r1 = await fetch('/api/admin/secure', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify({ action: 'list-roles' }) 
      })
      const b1 = await r1.json(); if (!r1.ok) throw new Error(b1.error || 'No se pudo obtener roles')
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
    return roles.filter(r => r.name.toLowerCase().includes(s))
  }, [roles, search])

  const beginCreate = () => {
    setForm({ id: undefined, name: '', description: '', modules: defaultModulesMap, canDo: [], extras: {} })
    setFormErrors({})
    setViewMode('create')
  }

  const beginEdit = (r: RoleRow) => {
    const p = r.permissions || {}
    const desc = typeof p?.description === 'string' ? p.description : ''
    const canDo = Array.isArray(p?.can_do) ? (p.can_do as string[]) : []
    const modulesObj = typeof p?.modules === 'object' && p.modules ? p.modules as Record<string, boolean> : {}
    const mergedModules: Record<string, boolean> = { ...defaultModulesMap }
    Object.keys(mergedModules).forEach(k => { mergedModules[k] = Boolean(modulesObj[k]) })
    // extras: conservar cualquier otra clave
    const { description, can_do, modules, ...rest } = (p || {})
    setForm({ id: r.id, name: r.name, description: desc, modules: mergedModules, canDo, extras: rest })
    setFormErrors({})
    setViewMode('edit')
  }

  const cancelEdit = () => {
    setForm({ id: undefined, name: '', description: '', modules: defaultModulesMap, canDo: [], extras: {} })
    setFormErrors({})
    setViewMode('list')
  }

  const save = async () => {
    try {
      setBusy(true)
      
      const normalizedName = form.name.trim().toLowerCase()
      if (!normalizedName) {
        setFormErrors(errs => ({ ...errs, name: 'El nombre es requerido' }))
        return
      }
      
      // Validar roles protegidos
      if (form.id && isRoleProtected(normalizedName)) {
        showError('Los roles del sistema no pueden ser modificados')
        return
      }
      
      if (normalizedName.length < 3 || normalizedName.length > 30) {
        setFormErrors(errs => ({ ...errs, name: 'El nombre debe tener entre 3 y 30 caracteres' }))
        return
      }
      if (!/^[a-z0-9_-]+$/.test(normalizedName)) {
        setFormErrors(errs => ({ ...errs, name: 'Solo a-z, 0-9, guion y guion bajo' }))
        return
      }
      
      // construir objeto de permisos desde la UI
      const permissions: any = {
        description: form.description?.trim() || undefined,
        can_do: form.canDo,
        modules: Object.fromEntries(Object.entries(form.modules).filter(([, v]) => Boolean(v))),
        ...form.extras,
      }
      
      const token = await getToken()
      if (form.id) {
        const res = await fetch('/api/admin/secure', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ action: 'update-role', id: form.id, name: normalizedName, permissions }) })
        const body = await res.json(); if (!res.ok) throw new Error(body.error || 'Error actualizando rol')
        success('Rol actualizado')
      } else {
        const res = await fetch('/api/admin/secure', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ action: 'create-role', name: normalizedName, permissions }) })
        const body = await res.json(); if (!res.ok) throw new Error(body.error || 'Error creando rol')
        success('Rol creado')
      }
      setForm({ id: undefined, name: '', description: '', modules: defaultModulesMap, canDo: [], extras: {} })
      setFormErrors({})
      setViewMode('list')
      await refresh()
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  // Acciones sugeridas
  const suggested = [
    { key: 'manage_users', label: 'Gestionar usuarios' },
    { key: 'manage_roles', label: 'Gestionar roles' },
    { key: 'approve_requisitions', label: 'Aprobar requisiciones' },
    { key: 'create_requisitions', label: 'Crear requisiciones' },
  ]

  const toggleCanDo = (key: string) => {
    setForm(f => {
      const has = f.canDo.includes(key)
      return { ...f, canDo: has ? f.canDo.filter(k => k !== key) : [...f.canDo, key] }
    })
  }

  const setModule = (key: string, value: boolean) => {
    setForm(f => ({ ...f, modules: { ...f.modules, [key]: value } }))
  }

  const [customPerm, setCustomPerm] = useState('')
  const addCustomPerm = () => {
    const k = customPerm.trim()
    if (!k) return
    if (form.canDo.includes(k)) return
    setForm(f => ({ ...f, canDo: [...f.canDo, k] }))
    setCustomPerm('')
  }
  const removeCustomPerm = (k: string) => setForm(f => ({ ...f, canDo: f.canDo.filter(x => x !== k) }))

  const requestDelete = async (r: RoleRow) => {
    // Validar si el rol está protegido
    if (isRoleProtected(r.name)) {
      showError(`El rol "${r.name}" es un rol del sistema y no puede ser eliminado`)
      return
    }

    // Verificar si el rol está en uso
    const inUse = await isRoleInUse(r.id)
    if (inUse) {
      showError(`El rol "${r.name}" no puede ser eliminado porque hay usuarios asignados a este rol`)
      return
    }

    setShowDelete({ open: true, id: r.id, name: r.name })
  }

  const doDelete = async () => {
    if (!showDelete.id) return
    try {
      setBusy(true)
      const token = await getToken()
      const res = await fetch('/api/admin/secure', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ action: 'delete-role', id: showDelete.id }) })
      const body = await res.json(); if (!res.ok) throw new Error(body.error || 'Error eliminando rol')
      success('Rol eliminado')
      setShowDelete({ open: false })
      await refresh()
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  // Renderizado de la vista de lista de roles
  const renderListView = () => (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Header compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-admin-text-primary">Administración de roles</h1>
        <button 
          onClick={beginCreate} 
          disabled={busy}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-admin-success text-white hover:bg-admin-successHover disabled:opacity-50 transition-colors w-full sm:w-auto shadow-sm text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Crear nuevo rol</span>
        </button>
      </div>

      {/* Búsqueda compacta */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Buscar roles..." 
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-admin-accent focus:border-admin-accent text-sm" 
        />
      </div>

      {/* Listado de roles - diseño compacto */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredRoles.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              {search.trim() ? 'No se encontraron roles con ese criterio de búsqueda' : 'No hay roles creados aún'}
            </div>
          )}
          {filteredRoles.map(r => {
            const p = r.permissions || {}
            const desc = p?.description || ''
            const modules = Object.entries(p?.modules || {}).filter(([, v]) => Boolean(v)).map(([k]) => k)
            const canDo = Array.isArray(p?.can_do) ? (p.can_do as string[]) : []
            const isProtected = isRoleProtected(r.name)
            
            return (
              <div 
                key={r.id} 
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Layout compacto: info a la izquierda, badges y botones a la derecha en desktop */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  {/* Información del rol */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base text-gray-900">{r.name}</h3>
                      {isProtected && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium border border-amber-200" title="Rol del sistema protegido">
                          🔒 Protegido
                        </span>
                      )}
                      {modules.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                          {modules.length} {modules.length === 1 ? 'módulo' : 'módulos'}
                        </span>
                      )}
                      {canDo.length > 0 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                          {canDo.length} {canDo.length === 1 ? 'permiso' : 'permisos'}
                        </span>
                      )}
                    </div>
                    {desc && <p className="text-sm text-gray-600 line-clamp-1">{desc}</p>}
                    
                    {/* Módulos inline en desktop para ahorrar espacio */}
                    {modules.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {modules.slice(0, 5).map(m => (
                          <span 
                            key={m} 
                            className="inline-block text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded"
                          >
                            {m}
                          </span>
                        ))}
                        {modules.length > 5 && (
                          <span className="text-xs text-gray-500 px-2 py-0.5">
                            +{modules.length - 5} más
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Botones de acción - compactos en desktop, full width en móvil */}
                  <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                    <button 
                      disabled={busy} 
                      onClick={(e) => { e.stopPropagation(); beginEdit(r); }} 
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white transition-colors text-sm font-medium w-full sm:w-auto disabled:opacity-50"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver detalles</span>
                    </button>
                    <button 
                      disabled={busy || isProtected} 
                      onClick={(e) => { e.stopPropagation(); requestDelete(r); }} 
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      title={isProtected ? "Este rol está protegido y no puede ser eliminado" : "Eliminar rol"}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  // Renderizado de la vista de creación/edición
  const renderFormView = () => {
    const isEditingProtectedRole = form.id && isRoleProtected(form.name)
    
    return (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Header compacto con navegación */}
      <div className="flex items-center gap-3">
        <button
          onClick={cancelEdit}
          disabled={busy}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
          title="Volver a la lista"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {viewMode === 'create' ? 'Crear nuevo rol' : `Editar: ${form.name}`}
          </h1>
          {isEditingProtectedRole && (
            <p className="text-sm text-amber-700 mt-1 flex items-center gap-1">
              <span>🔒</span>
              <span>Este es un rol del sistema. Solo puedes modificar permisos y módulos.</span>
            </p>
          )}
        </div>
      </div>

      {/* Layout más compacto: sidebar colapsable en móvil */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Columna principal - 3/4 en desktop */}
        <div className="lg:col-span-3 space-y-4">
          {/* Información básica */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-base font-semibold mb-3 text-gray-900">Información básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                  Nombre del rol <span className="text-red-600">*</span>
                </label>
                <input 
                  disabled={busy || viewMode === 'edit'} 
                  value={form.name} 
                  onChange={e => { 
                    setForm(f => ({ ...f, name: e.target.value })); 
                    setFormErrors(errs => ({ ...errs, name: undefined })) 
                  }} 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent disabled:bg-gray-100 disabled:text-gray-500" 
                  placeholder="p. ej. partner" 
                />
                {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
                {viewMode === 'edit' && (
                  <p className="text-xs text-gray-500 mt-1">El nombre del rol no se puede modificar</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Descripción</label>
                <textarea 
                  disabled={busy} 
                  value={form.description} 
                  onChange={e => { 
                    setForm(f => ({ ...f, description: e.target.value })); 
                    setFormErrors(errs => ({ ...errs, description: undefined })) 
                  }} 
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent resize-none" 
                  placeholder="Describe el alcance y responsabilidades de este rol" 
                />
              </div>
            </div>
          </div>

          {/* Permisos y acciones en grid */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-base font-semibold mb-1 text-gray-900">Permisos y acciones</h2>
            <p className="text-xs text-gray-600 mb-3">
              Define las acciones específicas que pueden realizar los usuarios con este rol
            </p>
            
            {/* Permisos en grid compacto */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2 text-gray-700">Acciones comunes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggested.map(s => (
                  <label 
                    key={s.key} 
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors text-sm"
                  >
                    <input 
                      type="checkbox" 
                      disabled={busy} 
                      checked={form.canDo.includes(s.key)} 
                      onChange={() => toggleCanDo(s.key)} 
                      className="rounded text-brand-accent focus:ring-2 focus:ring-brand-accent flex-shrink-0"
                    />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Permisos personalizados compactos */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700">Permisos personalizados</h3>
              <div className="flex gap-2 mb-2">
                <input 
                  value={customPerm} 
                  onChange={e => setCustomPerm(e.target.value)} 
                  onKeyPress={e => e.key === 'Enter' && addCustomPerm()}
                  placeholder="ej. export_reports" 
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent" 
                />
                <button 
                  type="button" 
                  onClick={addCustomPerm} 
                  disabled={busy || !customPerm.trim()}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white disabled:opacity-50 transition-colors font-medium"
                >
                  Agregar
                </button>
              </div>
              {form.canDo.filter(k => !suggested.some(s => s.key === k)).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.canDo.filter(k => !suggested.some(s => s.key === k)).map(k => (
                    <span 
                      key={k} 
                      className="inline-flex items-center gap-1.5 text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      <code className="text-xs">{k}</code>
                      <button 
                        onClick={() => removeCustomPerm(k)} 
                        className="text-gray-500 hover:text-red-600 transition-colors text-base leading-none"
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              disabled={busy || !form.name.trim()} 
              onClick={save} 
              className="px-4 py-2 rounded-lg bg-brand-accent text-white hover:bg-brand-accentDark disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm w-full sm:w-auto"
            >
              {busy ? 'Guardando...' : (viewMode === 'create' ? 'Crear rol' : 'Guardar cambios')}
            </button>
            <button 
              disabled={busy} 
              onClick={cancelEdit} 
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium text-sm w-full sm:w-auto"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Sidebar compacto - 1/4 en desktop */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4 lg:sticky lg:top-4">
            <h2 className="text-sm font-semibold mb-2 text-gray-900">Módulos del menú</h2>
            <p className="text-xs text-gray-600 mb-3">
              Selecciona módulos disponibles
            </p>
            <div className="space-y-1.5">
              {availableModules.map(m => (
                <label 
                  key={m.id} 
                  className="flex items-center gap-2 p-2 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input 
                    type="checkbox" 
                    disabled={busy} 
                    checked={Boolean(form.modules[m.id])} 
                    onChange={e => setModule(m.id, e.target.checked)} 
                    className="rounded text-brand-accent focus:ring-2 focus:ring-brand-accent flex-shrink-0"
                  />
                  <span className="text-xs font-medium text-gray-700">{m.label}</span>
                </label>
              ))}
            </div>
            
            {/* Resumen compacto */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-1.5">Resumen</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Módulos:</span>
                  <span className="font-semibold text-gray-900">
                    {Object.values(form.modules).filter(Boolean).length}/{availableModules.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Permisos:</span>
                  <span className="font-semibold text-gray-900">{form.canDo.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  }

  const content = viewMode === 'list' ? renderListView() : renderFormView()

  // Loading general del provider
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-accent mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">Cargando...</p>
      </div>
    </div>
  )

  // Fallback si no superadmin
  if (!isSuper) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-medium text-sm">Acceso restringido. No tiene permisos suficientes.</p>
      </div>
    </div>
  )

  return (
    <RequireRoleClient allow={["superadmin"]} fallback={
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
        title="Eliminar rol"
        message={`¿Seguro que deseas eliminar el rol "${showDelete.name}"? Esta acción no se puede deshacer.`}
        type="danger"
        confirmText="Eliminar"
        onConfirm={doDelete}
        onCancel={() => setShowDelete({ open: false })}
      />
    </RequireRoleClient>
  )
}
