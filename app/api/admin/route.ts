import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ADMIN_SECRET = process.env.ADMIN_SECRET

if (!SERVICE_ROLE_KEY) {
  console.warn('Missing SUPABASE_SERVICE_ROLE_KEY in environment. Admin API will not work.')
}

const adminClient = createClient(SUPABASE_URL ?? '', SERVICE_ROLE_KEY ?? '')

export async function POST(req: Request) {
  // Protección simple: header x-admin-secret debe coincidir con ADMIN_SECRET
  const secret = req.headers.get('x-admin-secret')
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'create-profile') {
      const { userId } = body
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
      const { data, error } = await adminClient.from('profiles').insert({ id: userId, is_active: true })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    if (action === 'assign-role') {
      const { userId, roleName } = body
      if (!userId || !roleName) return NextResponse.json({ error: 'userId and roleName required' }, { status: 400 })
      const { data: role } = await adminClient.from('roles').select('id').eq('name', roleName).limit(1).single()
      const roleId = (role as any)?.id
      if (!roleId) return NextResponse.json({ error: 'role not found' }, { status: 404 })
      const { data, error } = await adminClient.from('profiles').update({ role_id: roleId }).eq('id', userId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, data })
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
