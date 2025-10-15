"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useSafeRouter } from '@/lib/useSafeRouter'
import { supabase } from '@/lib/supabaseClient'
import { RequireRoleClient } from '@/app/components/RequireRole'
import ConfirmModal from '@/app/components/ConfirmModal'
import { useToast } from '@/lib/useToast'
import { MENU } from '@/app/components/navigation/menuConfig'

// Types
interface RoleRow { id: string; name: string; permissions?: any }
interface ProfileRow { id: string; first_name?: string | null; last_name?: string | null; roles?: { id: string; name: string } | null }

type FormState = {
  id?: string
  name: string
  description: string
  modules: Record<string, boolean>
  canDo: string[]
  extras: Record<string, any> // claves adicionales para conservar compatibilidad
}

export default function RolesAdminPage() {
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()
  const { success, error: showError, info } = useToast()

  const [roles, setRoles] = useState<RoleRow[]>([])
  const [users, setUsers] = useState<ProfileRow[]>([])
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

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
      const [r1, r2] = await Promise.all([
        fetch('/api/admin/secure', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ action: 'list-roles' }) }),
        fetch('/api/admin/secure', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ action: 'list-users' }) }),
      ])
      const b1 = await r1.json(); if (!r1.ok) throw new Error(b1.error || 'No se pudo obtener roles')
      const b2 = await r2.json(); if (!r2.ok) throw new Error(b2.error || 'No se pudo obtener usuarios')
      setRoles(b1.data || [])
      setUsers(b2.data || [])
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
  }

  const save = async () => {
    try {
      setBusy(true)
      // construir objeto de permisos desde la UI
      const permissions: any = {
        description: form.description?.trim() || undefined,
        can_do: form.canDo,
        modules: Object.fromEntries(Object.entries(form.modules).filter(([, v]) => Boolean(v))),
        ...form.extras,
      }
      const normalizedName = form.name.trim().toLowerCase()
      if (!normalizedName) {
        setFormErrors(errs => ({ ...errs, name: 'El nombre es requerido' }))
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

  const requestDelete = (r: RoleRow) => setShowDelete({ open: true, id: r.id, name: r.name })

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

  const assignRole = async (userId: string, roleName: string) => {
    try {
      setBusy(true)
      const token = await getToken()
      const res = await fetch('/api/admin/secure', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ action: 'assign-role', userId, roleName }) })
      const body = await res.json(); if (!res.ok) throw new Error(body.error || 'Error asignando rol')
      success('Rol asignado')
      await refresh()
    } catch (err: any) {
      showError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Administración de roles</h1>
        <div className="text-sm text-gray-500">Solo super administradores</div>
      </div>

      {/* Crear / Editar */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold mb-3">{form.id ? 'Editar rol' : 'Nuevo rol'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input disabled={busy} value={form.name} onChange={e=>{ setForm(f=>({ ...f, name: e.target.value })); setFormErrors(errs => ({ ...errs, name: undefined })) }} className="w-full rounded border px-3 py-2" placeholder="p. ej. partner" />
            {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <input disabled={busy} value={form.description} onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setFormErrors(errs => ({ ...errs, description: undefined })) }} className="w-full rounded border px-3 py-2" placeholder="Describe brevemente el alcance del rol" />
          </div>
          <div className="md:col-span-2">
            <div>
              <div className="text-sm font-medium mb-2">Módulos del menú</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableModules.map(m => (
                  <label key={m.id} className="inline-flex items-center gap-2 text-sm p-2 rounded border">
                    <input type="checkbox" disabled={busy} checked={Boolean(form.modules[m.id])} onChange={e => setModule(m.id, e.target.checked)} />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Estos toggles controlan qué módulos aparecen en la navegación para usuarios con este rol.</p>
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Acciones</div>
              <div className="flex flex-wrap gap-3">
                {suggested.map(s => (
                  <label key={s.key} className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" disabled={busy} checked={form.canDo.includes(s.key)} onChange={() => toggleCanDo(s.key)} />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input value={customPerm} onChange={e => setCustomPerm(e.target.value)} placeholder="Agregar permiso personalizado (ej. export_reports)" className="flex-1 rounded border px-3 py-2 text-sm" />
                <button type="button" onClick={addCustomPerm} className="px-3 py-2 text-sm rounded border">Agregar</button>
              </div>
              {form.canDo.filter(k => !suggested.some(s => s.key === k)).length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Permisos personalizados</div>
                  <div className="flex flex-wrap gap-2">
                    {form.canDo.filter(k => !suggested.some(s => s.key === k)).map(k => (
                      <span key={k} className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                        {k}
                        <button onClick={() => removeCustomPerm(k)} className="text-gray-500 hover:text-gray-700">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button disabled={busy || !form.name.trim()} onClick={save} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">{form.id ? 'Guardar cambios' : 'Crear rol'}</button>
          {form.id && (
            <button disabled={busy} onClick={beginCreate} className="px-4 py-2 rounded border">Cancelar</button>
          )}
        </div>
      </div>

      {/* Listado y búsqueda */}
      <div className="bg-white rounded shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Roles</h2>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="rounded border px-3 py-2" />
        </div>
        <div className="divide-y">
          {filteredRoles.map(r => {
            const p = r.permissions || {}
            const desc = p?.description || ''
            const modules = Object.entries(p?.modules || {}).filter(([, v]) => Boolean(v)).map(([k]) => k)
            const canDo = Array.isArray(p?.can_do) ? (p.can_do as string[]) : []
            return (
              <div key={r.id} className="py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium">{r.name}</div>
                  {desc && <div className="text-sm text-gray-600 mt-0.5">{desc}</div>}
                  <div className="mt-1 flex flex-wrap gap-2">
                    {modules.map(m => (
                      <span key={m} className="inline-block text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">{m}</span>
                    ))}
                    {canDo.length > 0 && (
                      <span className="inline-block text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2 py-0.5 rounded">{canDo.length} permisos</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button disabled={busy} onClick={()=>beginEdit(r)} className="px-3 py-1 rounded border">Editar</button>
                  <button disabled={busy} onClick={()=>requestDelete(r)} className="px-3 py-1 rounded bg-red-600 text-white">Eliminar</button>
                </div>
              </div>
            )
          })}
          {filteredRoles.length === 0 && (
            <div className="text-gray-500 text-sm">Sin resultados</div>
          )}
        </div>
      </div>

      {/* Asignación */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold mb-3">Asignar rol a usuario</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {users.map(u => (
            <div key={u.id} className="p-3 border rounded flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{u.first_name || ''} {u.last_name || ''}</div>
                <div className="text-xs text-gray-500">{u.id}</div>
              </div>
              <div className="flex items-center gap-2">
                <select disabled={busy} value={u.roles?.name || ''} onChange={(e)=>assignRole(u.id, e.target.value)} className="rounded border px-2 py-1">
                  <option value="">-- Rol --</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Loading general del provider
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-3"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  )

  // Fallback si no superadmin
  if (!isSuper) return (
    <div className="p-6 text-red-600">Acceso restringido. No tiene permisos suficientes.</div>
  )

  return (
    <RequireRoleClient allow={["superadmin"]} fallback={<div className="p-6 text-red-600">Acceso restringido. No tiene permisos suficientes.</div>}>
      {content}
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
