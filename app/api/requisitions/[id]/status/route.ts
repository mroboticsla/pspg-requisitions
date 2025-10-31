import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { RequisitionStatus } from '@/lib/types/requisitions'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const requisitionId = params.id
    const { status, reviewedBy }: { status: RequisitionStatus; reviewedBy?: string } = await req.json()

    if (!status) {
      return NextResponse.json({ error: 'Estado requerido' }, { status: 400 })
    }

    // Extraer token del header Authorization
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener usuario del token
    const { data: userRes, error: userErr } = await adminClient.auth.getUser(token)
    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const userId = userRes.user.id

    // Cargar requisición actual
    const { data: existingReq, error: fetchError } = await adminClient
      .from('requisitions')
      .select('id, created_by, status')
      .eq('id', requisitionId)
      .single()

    if (fetchError || !existingReq) {
      return NextResponse.json({ error: 'La requisición no existe o fue eliminada.' }, { status: 404 })
    }

    // Obtener rol del usuario
    const { data: profile, error: profileErr } = await adminClient
      .from('profiles')
      .select('id, roles(name)')
      .eq('id', userId)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'No se pudo verificar el rol del usuario.' }, { status: 403 })
    }

    const roleName: string | undefined = (profile as any).roles?.name
    const isAdminRole = roleName === 'admin' || roleName === 'superadmin'
    const isOwner = existingReq.created_by === userId

    // Reglas:
    // - Admin/superadmin: pueden cambiar a cualquier estado
    // - Dueño: puede regresar de 'submitted' a 'draft'
    const isRevertSubmittedToDraft = existingReq.status === 'submitted' && status === 'draft'
    if (!isAdminRole) {
      if (!(isOwner && isRevertSubmittedToDraft)) {
        return NextResponse.json({ error: 'No tiene permisos para cambiar el estado de la requisición.' }, { status: 403 })
      }
    }

    const updates: Record<string, any> = { status }

    if (status === 'approved' || status === 'rejected') {
      updates.reviewed_at = new Date().toISOString()
      updates.reviewed_by = reviewedBy || userId
    } else if (status === 'draft') {
      // Al regresar a borrador, limpiamos metadatos de envío y revisión
      updates.submitted_at = null
      updates.reviewed_at = null
      updates.reviewed_by = null
    }

    const { data, error } = await adminClient
      .from('requisitions')
      .update(updates)
      .eq('id', requisitionId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('API error updating requisition status:', err)
    return NextResponse.json({ error: err?.message || 'Error inesperado' }, { status: 500 })
  }
}
