import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Endpoint: GET /api/companies/:id/contact
// Retorna información de contacto de la empresa (solo para admin/superadmin)
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;
    if (!companyId) {
      return NextResponse.json({ error: 'Falta company id' }, { status: 400 });
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

    // Verificar usuario y rol
    const { data: { user }, error: userErr } = await adminClient.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { data: profile, error: profileErr } = await adminClient
      .from('profiles')
      .select('id, role_id, roles(name)')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 });
    }

    const roleName = (profile as any).roles?.name;
    if (!['admin', 'superadmin'].includes(roleName)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Obtener datos de la empresa
    const { data: company, error: companyErr } = await adminClient
      .from('companies')
      .select('id, name, website, contact_info, metadata')
      .eq('id', companyId)
      .single();

    if (companyErr || !company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        website: company.website,
        contact_info: company.contact_info || {},
        metadata: company.metadata || null,
      }
    });
  } catch (err: any) {
    console.error('Error en GET /api/companies/[id]/contact:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
