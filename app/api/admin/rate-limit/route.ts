import { NextRequest, NextResponse } from 'next/server';
import {
  getClientIP,
  isIPBlocked,
  getBlockTimeRemaining,
  recordLoginAttempt,
  getFailedAttempts,
} from '@/lib/rateLimiting';

/**
 * API Route para verificar el estado de rate limiting
 * antes de intentar un login administrativo
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Verificar si la IP está bloqueada
    if (isIPBlocked(clientIP)) {
      const remainingTime = getBlockTimeRemaining(clientIP);
      
      console.warn(`🚫 Intento de login desde IP bloqueada: ${clientIP}`);
      
      return NextResponse.json(
        {
          blocked: true,
          message: `Demasiados intentos fallidos. Inténtalo de nuevo en ${Math.ceil(remainingTime / 60)} minutos.`,
          remainingSeconds: remainingTime,
        },
        { status: 429 } // Too Many Requests
      );
    }
    
    // Obtener número de intentos fallidos
    const failedAttempts = getFailedAttempts(clientIP);
    const attemptsRemaining = Math.max(0, 5 - failedAttempts);
    
    return NextResponse.json({
      blocked: false,
      attemptsRemaining,
      message: attemptsRemaining <= 2 
        ? `Quedan ${attemptsRemaining} intentos antes del bloqueo.`
        : null,
    });
    
  } catch (error) {
    console.error('Error en rate limit check:', error);
    return NextResponse.json(
      { error: 'Error al verificar límite de intentos' },
      { status: 500 }
    );
  }
}

/**
 * API Route para registrar un intento de login
 */
export async function PUT(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const body = await request.json();
    const { success, email } = body;
    
    // Registrar el intento
    recordLoginAttempt(clientIP, success, email);
    
    if (!success) {
      const failedAttempts = getFailedAttempts(clientIP);
      console.warn(
        `⚠️ Login fallido desde IP ${clientIP} (email: ${email || 'unknown'}) - ${failedAttempts} intentos`
      );
    } else {
      console.log(`✅ Login exitoso desde IP ${clientIP} (email: ${email})`);
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error al registrar intento de login:', error);
    return NextResponse.json(
      { error: 'Error al registrar intento' },
      { status: 500 }
    );
  }
}
