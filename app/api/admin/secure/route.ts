import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!SERVICE_ROLE_KEY) console.warn('SUPABASE_SERVICE_ROLE_KEY not set; admin secure API will fail')

const adminClient = createClient(SUPABASE_URL ?? '', SERVICE_ROLE_KEY ?? '')

async function getUserFromToken(token: string | null) {
  if (!token) return null
  try {
    // Supabase JS v2: getUser can accept { access_token }
    const res = await adminClient.auth.getUser(token)
    return (res as any).data?.user ?? null
  } catch (err) {
    return null
  }
}

const RESERVED_ROLE_NAMES = ['superadmin', 'admin', 'partner', 'candidate']

function normalizeRoleName(name: string): string {
  return String(name || '').trim().toLowerCase()
}

function validateRoleName(name: string): string | null {
  const n = normalizeRoleName(name)
  if (!n) return 'El nombre del rol es requerido'
  if (n.length < 3 || n.length > 30) return 'El nombre debe tener entre 3 y 30 caracteres'
  if (!/^[a-z0-9_-]+$/.test(n)) return 'El nombre solo puede contener a-z, 0-9, guion y guion bajo'
  return null
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // cargar profile + role
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, first_name, last_name, role_id, roles(id, name, permissions)')
      .eq('id', user.id)
      .single()

    const rolesField = (profile as any)?.roles
    const roleObj = Array.isArray(rolesField) ? rolesField[0] : rolesField
    const roleName = roleObj?.name ?? null

    if (!['admin', 'superadmin'].includes(roleName)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { action } = body

    // LIST USERS
    if (action === 'list-users') {
      const { data } = await adminClient.from('profiles').select('id, first_name, last_name, phone, is_active, role_id, roles(id, name)')
      return NextResponse.json({ ok: true, data })
    }

    // LIST ROLES
    if (action === 'list-roles') {
      const { data } = await adminClient.from('roles').select('id, name, permissions')
      return NextResponse.json({ ok: true, data })
    }

    // CREATE ROLE (only superadmin)
    if (action === 'create-role') {
      if (roleName !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const { name, permissions } = body
      const nameError = validateRoleName(name)
      if (nameError) return NextResponse.json({ error: nameError }, { status: 400 })
      const normalizedName = normalizeRoleName(name)
      const { data: existingByName } = await adminClient
        .from('roles')
        .select('id, name')
        .eq('name', normalizedName)
        .maybeSingle()
      if (existingByName) return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 409 })
      const { data, error } = await adminClient.from('roles').insert({ name: normalizedName, permissions })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    // UPDATE ROLE (only superadmin)
    if (action === 'update-role') {
      if (roleName !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const { id, name, permissions } = body
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
      const { data: targetRole, error: fetchErr } = await adminClient.from('roles').select('id, name').eq('id', id).maybeSingle()
      if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
      if (!targetRole) return NextResponse.json({ error: 'role not found' }, { status: 404 })

      const payload: any = {}
      if (typeof name === 'string') {
        const nameError = validateRoleName(name)
        if (nameError) return NextResponse.json({ error: nameError }, { status: 400 })
        const normalizedName = normalizeRoleName(name)
        const isTargetReserved = RESERVED_ROLE_NAMES.includes(String((targetRole as any).name).toLowerCase())
        if (isTargetReserved && normalizedName !== String((targetRole as any).name).toLowerCase()) {
          return NextResponse.json({ error: 'No se puede renombrar un rol reservado' }, { status: 400 })
        }
        const { data: exists } = await adminClient
          .from('roles')
          .select('id, name')
          .eq('name', normalizedName)
          .neq('id', id)
          .maybeSingle()
        if (exists) return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 409 })
        payload.name = normalizedName
      }
      if (typeof permissions !== 'undefined') payload.permissions = permissions
      if (Object.keys(payload).length === 0) return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
      const { data, error } = await adminClient.from('roles').update(payload).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    // DELETE ROLE (only superadmin)
    if (action === 'delete-role') {
      if (roleName !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const { id } = body
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
      const { data: roleRec, error: roleErr } = await adminClient.from('roles').select('id, name').eq('id', id).maybeSingle()
      if (roleErr) return NextResponse.json({ error: roleErr.message }, { status: 500 })
      if (!roleRec) return NextResponse.json({ error: 'role not found' }, { status: 404 })
      if (RESERVED_ROLE_NAMES.includes(String((roleRec as any).name).toLowerCase())) {
        return NextResponse.json({ error: 'No se puede eliminar un rol reservado' }, { status: 400 })
      }
      const { count } = await adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('role_id', id)
      if ((count ?? 0) > 0) return NextResponse.json({ error: 'role in use by some profiles' }, { status: 400 })
      const { data, error } = await adminClient.from('roles').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    // ASSIGN ROLE
    if (action === 'assign-role') {
      const { userId, roleName: targetRole } = body
      if (!userId || !targetRole) return NextResponse.json({ error: 'userId and roleName required' }, { status: 400 })

      // admins cannot assign admin/superadmin
      if (roleName === 'admin' && ['admin', 'superadmin'].includes(targetRole)) {
        return NextResponse.json({ error: 'Forbidden to assign privileged role' }, { status: 403 })
      }

      // find role id
      const { data: roleRec } = await adminClient.from('roles').select('id, name').eq('name', targetRole).limit(1).single()
      const roleId = (roleRec as any)?.id
      if (!roleId) return NextResponse.json({ error: 'role not found' }, { status: 404 })

      const { data, error } = await adminClient.from('profiles').update({ role_id: roleId }).eq('id', userId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    // CREATE PROFILE (admin or superadmin) - only create basic profile
    if (action === 'create-profile') {
      const { userId } = body
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
      // cannot create privileged profiles unless superadmin
      const { data: existing } = await adminClient.from('profiles').select('id, role_id, roles(id, name)').eq('id', userId).single()
      if (existing) return NextResponse.json({ error: 'profile already exists' }, { status: 400 })

      const { data, error } = await adminClient.from('profiles').insert({ id: userId, is_active: true })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    // DELETE PROFILE (only superadmin)
    if (action === 'delete-profile') {
      if (roleName !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const { userId } = body
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
      const { data, error } = await adminClient.from('profiles').delete().eq('id', userId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
