import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!SERVICE_ROLE_KEY) console.warn('SUPABASE_SERVICE_ROLE_KEY not set; /api/register will fail')

const adminClient = createClient(SUPABASE_URL ?? '', SERVICE_ROLE_KEY ?? '')

export async function POST(req: Request) {
  try {
    if (!SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })

    const body = await req.json()
    const { userId } = body
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    // Contar perfiles existentes (head:true para recibir solo count)
    const { count, error: countError } = await adminClient.from('profiles').select('id', { count: 'exact', head: true })
    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })

    const isFirst = (count ?? 0) === 0
    const roleName = isFirst ? 'superadmin' : 'candidate'

    // Buscar id del role
    const { data: roleRec, error: roleError } = await adminClient.from('roles').select('id').eq('name', roleName).limit(1).single()
    if (roleError) return NextResponse.json({ error: roleError.message }, { status: 500 })
    const roleId = (roleRec as any)?.id ?? null

    const insertPayload: any = { id: userId, is_active: true }
    if (roleId) insertPayload.role_id = roleId

    const { data, error } = await adminClient.from('profiles').insert(insertPayload)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
