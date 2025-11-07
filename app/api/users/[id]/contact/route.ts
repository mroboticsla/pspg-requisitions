import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Endpoint: GET /api/users/:id/contact
// Retorna información de contacto del creador (solo admin/superadmin)
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: 'Falta user id' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verificar usuario solicitante y rol
    const { data: { user: requestingUser }, error: userErr } = await adminClient.auth.getUser(token);
    if (userErr || !requestingUser) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { data: requestingProfile, error: requestingProfileErr } = await adminClient
      .from('profiles')
      .select('id, roles(name)')
      .eq('id', requestingUser.id)
      .single();

    if (requestingProfileErr || !requestingProfile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 });
    }

    const roleName = (requestingProfile as any).roles?.name;
    if (!['admin', 'superadmin'].includes(roleName)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Obtener perfil del usuario objetivo
    const { data: profile, error: profileErr } = await adminClient
      .from('profiles')
      .select('id, first_name, last_name, phone, roles(name)')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Obtener email desde auth (admin API)
    const { data: authUserRes, error: authErr } = await adminClient.auth.admin.getUserById(userId);
    if (authErr) {
      console.warn('No se pudo obtener usuario auth:', authErr.message);
    }
    const authUser = authUserRes?.user;

    return NextResponse.json({
      user: {
        id: profile.id,
        first_name: (profile as any).first_name,
        last_name: (profile as any).last_name,
        phone: (profile as any).phone,
        role: (profile as any).roles?.name || null,
        email: authUser?.email || null,
      }
    });
  } catch (err: any) {
    console.error('Error en GET /api/users/[id]/contact:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
