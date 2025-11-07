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
      // Obtener perfiles (sin created_at porque no existe en profiles)
      const { data: profilesData, error: profilesError } = await adminClient
        .from('profiles')
        .select('id, first_name, last_name, phone, is_active, updated_at, role_id, roles(id, name)')

      // Obtener usuarios de Auth para derivar created_at
      const { data: usersList, error: usersError } = await adminClient.auth.admin.listUsers()
      if (usersError) {
        return NextResponse.json({ error: usersError.message || 'Failed to list users' }, { status: 500 })
      }

      const createdAtMap = new Map<string, string>()
      const metaMap = new Map<string, any>()
      for (const u of usersList?.users || []) {
        createdAtMap.set(u.id, u.created_at)
        metaMap.set(u.id, u.user_metadata || {})
      }

      if (!profilesError && profilesData && profilesData.length > 0) {
        // Fusionar profiles + created_at desde Auth
        const merged = profilesData.map((p: any) => ({
          id: p.id,
          first_name: p.first_name ?? metaMap.get(p.id)?.first_name ?? null,
          last_name: p.last_name ?? metaMap.get(p.id)?.last_name ?? null,
          phone: p.phone ?? metaMap.get(p.id)?.phone ?? null,
          is_active: p.is_active ?? true,
          created_at: createdAtMap.get(p.id) ?? p.updated_at ?? null,
          role_id: p.role_id ?? null,
          roles: p.roles ?? null,
        }))

        // Ordenar por created_at desc si existe, si no por last_name
        merged.sort((a: any, b: any) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0
          const db = b.created_at ? new Date(b.created_at).getTime() : 0
          return db - da
        })

        return NextResponse.json({ ok: true, data: merged })
      }

      // Fallback: si no hay perfiles, regresar solo desde Auth
      const fallback = (usersList?.users || []).map((u: any) => ({
        id: u.id,
        first_name: u.user_metadata?.first_name || null,
        last_name: u.user_metadata?.last_name || null,
        phone: u.user_metadata?.phone || null,
        is_active: true,
        created_at: u.created_at,
        role_id: null,
        roles: null,
      }))
      fallback.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      return NextResponse.json({ ok: true, data: fallback })
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
      
      // Validar roles protegidos
      const roleLower = String((roleRec as any).name).toLowerCase()
      if (RESERVED_ROLE_NAMES.includes(roleLower)) {
        return NextResponse.json({ 
          error: `El rol "${(roleRec as any).name}" es un rol del sistema y no puede ser eliminado` 
        }, { status: 400 })
      }
      
      // Verificar si el rol está en uso
      const { count } = await adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('role_id', id)
      if ((count ?? 0) > 0) {
        return NextResponse.json({ 
          error: `El rol "${(roleRec as any).name}" no puede ser eliminado porque ${count} ${count === 1 ? 'usuario está asignado' : 'usuarios están asignados'} a este rol` 
        }, { status: 400 })
      }
      
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

    // CREATE USER (admin or superadmin) - creates auth user + profile
    if (action === 'create-user') {
      const { email, password, first_name, last_name, phone, roleName: targetRole } = body
      if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 })
      
      // admins cannot create admin/superadmin users
      if (roleName === 'admin' && ['admin', 'superadmin'].includes(targetRole)) {
        return NextResponse.json({ error: 'Forbidden to create privileged users' }, { status: 403 })
      }

      // Find role id if roleName provided
      let roleId = null
      if (targetRole) {
        const { data: roleRec } = await adminClient.from('roles').select('id, name').eq('name', targetRole).limit(1).single()
        roleId = (roleRec as any)?.id
        if (!roleId) return NextResponse.json({ error: `Role '${targetRole}' not found` }, { status: 404 })
      }

      // Create auth user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: { first_name, last_name, phone }
      })
      
      if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })
      const userId = authData?.user?.id
      if (!userId) return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })

      // Create profile
      const profilePayload: any = { id: userId, is_active: true }
      if (first_name) profilePayload.first_name = first_name
      if (last_name) profilePayload.last_name = last_name
      if (phone) profilePayload.phone = phone
      if (roleId) profilePayload.role_id = roleId

      const { data: profileData, error: profileError } = await adminClient.from('profiles').insert(profilePayload).select().single()
      if (profileError) {
        // Cleanup: delete auth user if profile creation fails
        await adminClient.auth.admin.deleteUser(userId)
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true, data: profileData })
    }

    // UPDATE USER (admin or superadmin) - updates profile info
    if (action === 'update-user') {
      const { userId, first_name, last_name, phone, roleName: targetRole } = body
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

      // admins cannot update to admin/superadmin roles
      if (roleName === 'admin' && targetRole && ['admin', 'superadmin'].includes(targetRole)) {
        return NextResponse.json({ error: 'Forbidden to assign privileged roles' }, { status: 403 })
      }

      const updatePayload: any = {}
      if (first_name !== undefined) updatePayload.first_name = first_name
      if (last_name !== undefined) updatePayload.last_name = last_name
      if (phone !== undefined) updatePayload.phone = phone
      
      if (targetRole !== undefined) {
        const { data: roleRec } = await adminClient.from('roles').select('id, name').eq('name', targetRole).limit(1).single()
        const roleId = (roleRec as any)?.id
        if (!roleId) return NextResponse.json({ error: `Role '${targetRole}' not found` }, { status: 404 })
        updatePayload.role_id = roleId
      }

      if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
      }

      const { data, error } = await adminClient.from('profiles').update(updatePayload).eq('id', userId).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    // =====================================================
    // COMPANIES MANAGEMENT
    // =====================================================

    // LIST COMPANIES
    if (action === 'list-companies') {
      const { data } = await adminClient
        .from('companies')
        .select('id, name, legal_name, tax_id, industry, website, logo_url, address, contact_info, is_active, metadata, created_at, updated_at')
        .order('name', { ascending: true })
      return NextResponse.json({ ok: true, data })
    }

    // GET COMPANY WITH USERS
    if (action === 'get-company') {
      const { companyId } = body
      if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })
      
      const { data: company, error: companyError } = await adminClient
        .from('companies')
        .select('id, name, legal_name, tax_id, industry, website, logo_url, address, contact_info, is_active, metadata, created_at, updated_at')
        .eq('id', companyId)
        .single()
      
      if (companyError) return NextResponse.json({ error: companyError.message }, { status: 500 })
      if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

      // Get assigned users
      const { data: users } = await adminClient
        .from('company_users')
        .select('id, company_id, user_id, role_in_company, permissions, assigned_at, assigned_by, is_active, profiles(id, first_name, last_name, phone)')
        .eq('company_id', companyId)
        .order('assigned_at', { ascending: false })

      return NextResponse.json({ ok: true, data: { ...company, company_users: users || [] } })
    }

    // CREATE COMPANY (only admins)
    if (action === 'create-company') {
      const { name, legal_name, tax_id, industry, website, logo_url, address, contact_info, metadata } = body
      if (!name) return NextResponse.json({ error: 'Company name is required' }, { status: 400 })

      // Check for duplicate tax_id if provided
      if (tax_id) {
        const { data: existing } = await adminClient
          .from('companies')
          .select('id')
          .eq('tax_id', tax_id)
          .maybeSingle()
        if (existing) return NextResponse.json({ error: 'Ya existe una empresa con ese RFC/Tax ID' }, { status: 409 })
      }

      const companyData: any = { 
        name, 
        is_active: true 
      }
      if (legal_name) companyData.legal_name = legal_name
      if (tax_id) companyData.tax_id = tax_id
      if (industry) companyData.industry = industry
      if (website) companyData.website = website
      if (logo_url) companyData.logo_url = logo_url
      if (address) companyData.address = address
      if (contact_info) companyData.contact_info = contact_info
      if (metadata) companyData.metadata = metadata

      const { data, error } = await adminClient
        .from('companies')
        .insert(companyData)
        .select()
        .single()
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    // UPDATE COMPANY (only admins)
    if (action === 'update-company') {
      const { companyId, name, legal_name, tax_id, industry, website, logo_url, address, contact_info, is_active, metadata } = body
      if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

      // Check for duplicate tax_id if being updated
      if (tax_id) {
        const { data: existing } = await adminClient
          .from('companies')
          .select('id')
          .eq('tax_id', tax_id)
          .neq('id', companyId)
          .maybeSingle()
        if (existing) return NextResponse.json({ error: 'Ya existe otra empresa con ese RFC/Tax ID' }, { status: 409 })
      }

      const updatePayload: any = {}
      if (name !== undefined) updatePayload.name = name
      if (legal_name !== undefined) updatePayload.legal_name = legal_name
      if (tax_id !== undefined) updatePayload.tax_id = tax_id
      if (industry !== undefined) updatePayload.industry = industry
      if (website !== undefined) updatePayload.website = website
      if (logo_url !== undefined) updatePayload.logo_url = logo_url
      if (address !== undefined) updatePayload.address = address
      if (contact_info !== undefined) updatePayload.contact_info = contact_info
      if (is_active !== undefined) updatePayload.is_active = is_active
      if (metadata !== undefined) updatePayload.metadata = metadata

      if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
      }

      const { data, error } = await adminClient
        .from('companies')
        .update(updatePayload)
        .eq('id', companyId)
        .select()
        .single()
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    // DELETE COMPANY (only superadmin)
    if (action === 'delete-company') {
      if (roleName !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const { companyId } = body
      if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

      const { data, error } = await adminClient
        .from('companies')
        .delete()
        .eq('id', companyId)
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    // ASSIGN USER TO COMPANY
    if (action === 'assign-user-to-company') {
      const { companyId, userId, roleInCompany = 'member', permissions } = body
      if (!companyId || !userId) return NextResponse.json({ error: 'companyId and userId required' }, { status: 400 })

      // Verify company exists and is active
      const { data: company } = await adminClient
        .from('companies')
        .select('id, name, is_active')
        .eq('id', companyId)
        .single()
      
      if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })
      if (!company.is_active) return NextResponse.json({ error: 'Cannot assign users to inactive company' }, { status: 400 })

      // Verify user exists
      const { data: userProfile } = await adminClient
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', userId)
        .single()
      
      if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      // Check if assignment already exists
      const { data: existing } = await adminClient
        .from('company_users')
        .select('id')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .maybeSingle()

      if (existing) return NextResponse.json({ error: 'User is already assigned to this company' }, { status: 409 })

      const assignmentData: any = {
        company_id: companyId,
        user_id: userId,
        role_in_company: roleInCompany,
        assigned_by: user.id,
        is_active: true
      }
      if (permissions) assignmentData.permissions = permissions

      const { data, error } = await adminClient
        .from('company_users')
        .insert(assignmentData)
        .select()
        .single()
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    // UPDATE USER COMPANY ASSIGNMENT
    if (action === 'update-company-assignment') {
      const { assignmentId, roleInCompany, permissions, is_active } = body
      if (!assignmentId) return NextResponse.json({ error: 'assignmentId required' }, { status: 400 })

      const updatePayload: any = {}
      if (roleInCompany !== undefined) updatePayload.role_in_company = roleInCompany
      if (permissions !== undefined) updatePayload.permissions = permissions
      if (is_active !== undefined) updatePayload.is_active = is_active

      if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
      }

      const { data, error } = await adminClient
        .from('company_users')
        .update(updatePayload)
        .eq('id', assignmentId)
        .select()
        .single()
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    // REMOVE USER FROM COMPANY
    if (action === 'remove-user-from-company') {
      const { assignmentId } = body
      if (!assignmentId) return NextResponse.json({ error: 'assignmentId required' }, { status: 400 })

      const { data, error } = await adminClient
        .from('company_users')
        .delete()
        .eq('id', assignmentId)
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    // =====================================================
    // USER EMAIL AND PASSWORD MANAGEMENT
    // =====================================================

    // GET USER EMAIL (admin or superadmin)
    if (action === 'get-user-email') {
      const { userId } = body
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

      const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId)
      if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })
      if (!userData?.user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      return NextResponse.json({ ok: true, data: { email: userData.user.email } })
    }

    // UPDATE USER EMAIL (admin or superadmin)
    if (action === 'update-user-email') {
      const { userId, email } = body
      if (!userId || !email) return NextResponse.json({ error: 'userId and email required' }, { status: 400 })

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }

      // Check if email is already in use by another user
      const { data: existingUser } = await adminClient.auth.admin.listUsers()
      const emailInUse = existingUser?.users?.find(u => u.email === email && u.id !== userId)
      if (emailInUse) {
        return NextResponse.json({ error: 'Este correo electrónico ya está en uso por otro usuario' }, { status: 409 })
      }

      const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
        email,
        email_confirm: true // Auto-confirm the new email
      })
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    // SEND PASSWORD RESET EMAIL (admin or superadmin)
    if (action === 'send-password-reset') {
      const { email } = body
      if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

      // Use regular supabase client to send reset email
      const { data, error } = await adminClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/change-password`
      })
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data, message: 'Se ha enviado un correo electrónico para restablecer la contraseña' })
    }

    // SET TEMPORARY PASSWORD (admin or superadmin)
    if (action === 'set-temporary-password') {
      const { userId, password } = body
      if (!userId || !password) return NextResponse.json({ error: 'userId and password required' }, { status: 400 })

      if (password.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
      }

      const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
        password
      })
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data, message: 'Contraseña temporal establecida exitosamente' })
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
