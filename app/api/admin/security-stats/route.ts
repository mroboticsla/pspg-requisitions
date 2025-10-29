import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getSecurityStats,
  getSecurityLogs,
  unblockIP,
} from '@/lib/rateLimiting';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verificar que el usuario sea superadmin
 */
async function verifySuperAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }
  
  const { data: { user } } = await adminClient.auth.getUser(token);
  
  if (!user) {
    return null;
  }
  
  const { data: profile } = await adminClient
    .from('profiles')
    .select('*, roles(*)')
    .eq('id', user.id)
    .single();
  
  const roleName = String(profile?.roles?.name || '').toLowerCase();
  
  if (roleName !== 'superadmin') {
    return null;
  }
  
  return user;
}

/**
 * GET - Obtener estadísticas de seguridad
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifySuperAdmin(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado. Solo superadmins pueden acceder.' },
        { status: 403 }
      );
    }
    
    const stats = getSecurityStats();
    const recentLogs = getSecurityLogs(50);
    
    return NextResponse.json({
      stats,
      recentLogs,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error al obtener estadísticas de seguridad:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

/**
 * POST - Desbloquear una IP manualmente
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifySuperAdmin(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado. Solo superadmins pueden desbloquear IPs.' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { ip } = body;
    
    if (!ip) {
      return NextResponse.json(
        { error: 'IP no especificada' },
        { status: 400 }
      );
    }
    
    const wasBlocked = unblockIP(ip);
    
    return NextResponse.json({
      success: true,
      wasBlocked,
      message: wasBlocked 
        ? `IP ${ip} desbloqueada exitosamente` 
        : `IP ${ip} no estaba bloqueada`,
    });
    
  } catch (error) {
    console.error('Error al desbloquear IP:', error);
    return NextResponse.json(
      { error: 'Error al desbloquear IP' },
      { status: 500 }
    );
  }
}
