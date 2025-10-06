import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set; /api/register will fail')
}
if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not set; /api/register will fail')
}

const adminClient = SERVICE_ROLE_KEY && SUPABASE_URL 
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  : null

export async function POST(req: Request) {
  try {
    if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
      console.error('❌ Missing Supabase configuration')
      return NextResponse.json({ 
        error: 'Configuración del servidor incompleta. Faltan variables de entorno de Supabase.' 
      }, { status: 500 })
    }

    if (!adminClient) {
      return NextResponse.json({ 
        error: 'Cliente de Supabase no inicializado correctamente' 
      }, { status: 500 })
    }

    const body = await req.json()
  const { userId, first_name, last_name, phone } = body
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    console.log('📝 Creating profile for user:', userId, { first_name, last_name, phone })

    // Contar perfiles existentes (head:true para recibir solo count)
    const { count, error: countError } = await adminClient.from('profiles').select('id', { count: 'exact', head: true })
    if (countError) {
      console.error('❌ Error counting profiles:', countError)
      return NextResponse.json({ error: countError.message, details: countError }, { status: 500 })
    }

    const isFirst = (count ?? 0) === 0
    const roleName = isFirst ? 'superadmin' : 'candidate'
    console.log(`👤 User will be assigned role: ${roleName} (isFirst: ${isFirst}, count: ${count})`)

    // Buscar id del role
    const { data: roleRec, error: roleError } = await adminClient.from('roles').select('id').eq('name', roleName).limit(1).single()
    if (roleError) {
      console.error('❌ Error fetching role:', roleError)
      return NextResponse.json({ error: `No se encontró el rol '${roleName}': ${roleError.message}`, details: roleError }, { status: 500 })
    }
    const roleId = (roleRec as any)?.id ?? null
    console.log(`✓ Role ID found: ${roleId}`)

  const insertPayload: any = { id: userId, is_active: true }
  if (first_name) insertPayload.first_name = first_name
  if (last_name) insertPayload.last_name = last_name
  if (phone) insertPayload.phone = phone
    if (roleId) insertPayload.role_id = roleId

    console.log('💾 Inserting profile with payload:', insertPayload)

    // Intentar insertar y devolver el registro creado
    const { data, error: insertError } = await adminClient.from('profiles').insert(insertPayload).select().single()
    if (insertError) {
      console.error('❌ Failed to insert profile', insertPayload, insertError)
      return NextResponse.json({ 
        error: insertError.message, 
        details: insertError,
        code: insertError.code,
        hint: insertError.hint 
      }, { status: 500 })
    }

    console.log('✅ Profile created successfully for user', userId, data)
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    console.error('❌ Unexpected error in /api/register:', err)
    return NextResponse.json({ 
      error: err?.message ?? String(err),
      stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
    }, { status: 500 })
  }
}
