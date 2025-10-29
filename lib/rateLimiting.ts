/**
 * Sistema de Rate Limiting y Seguridad para Login Administrativo
 * 
 * Características:
 * - Limita intentos de login por IP
 * - Bloqueo temporal después de intentos fallidos
 * - Registro de eventos de seguridad
 * - Limpieza automática de registros antiguos
 */

type LoginAttempt = {
  ip: string;
  timestamp: number;
  success: boolean;
  email?: string;
};

type IPBlock = {
  ip: string;
  blockedUntil: number;
  attempts: number;
};

// Almacenamiento en memoria (en producción, usar Redis o base de datos)
const loginAttempts: Map<string, LoginAttempt[]> = new Map();
const blockedIPs: Map<string, IPBlock> = new Map();
const securityLogs: LoginAttempt[] = [];

// Configuración
const MAX_ATTEMPTS = 5; // Máximo de intentos fallidos
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos de bloqueo
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // Ventana de 15 minutos para contar intentos
const MAX_LOGS = 1000; // Máximo de logs en memoria

/**
 * Obtiene la IP real del cliente desde los headers de la petición
 */
export function getClientIP(request: Request): string {
  // Intentar obtener la IP de varios headers comunes
  const headers = request.headers;
  
  // Cloudflare
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;
  
  // Otros proxies comunes
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for puede contener múltiples IPs, tomar la primera
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = headers.get('x-real-ip');
  if (realIP) return realIP;
  
  // Fallback (en desarrollo local)
  return 'unknown';
}

/**
 * Verifica si una IP está bloqueada
 */
export function isIPBlocked(ip: string): boolean {
  const block = blockedIPs.get(ip);
  if (!block) return false;
  
  const now = Date.now();
  
  // Si el bloqueo ha expirado, removerlo
  if (now > block.blockedUntil) {
    blockedIPs.delete(ip);
    return false;
  }
  
  return true;
}

/**
 * Obtiene el tiempo restante de bloqueo para una IP (en segundos)
 */
export function getBlockTimeRemaining(ip: string): number {
  const block = blockedIPs.get(ip);
  if (!block) return 0;
  
  const remaining = Math.max(0, block.blockedUntil - Date.now());
  return Math.ceil(remaining / 1000);
}

/**
 * Registra un intento de login (exitoso o fallido)
 */
export function recordLoginAttempt(
  ip: string,
  success: boolean,
  email?: string
): void {
  const now = Date.now();
  
  // Crear registro del intento
  const attempt: LoginAttempt = {
    ip,
    timestamp: now,
    success,
    email,
  };
  
  // Agregar a intentos de la IP
  const attempts = loginAttempts.get(ip) || [];
  attempts.push(attempt);
  loginAttempts.set(ip, attempts);
  
  // Agregar a logs de seguridad
  securityLogs.push(attempt);
  
  // Limpiar logs antiguos si exceden el máximo
  if (securityLogs.length > MAX_LOGS) {
    securityLogs.splice(0, securityLogs.length - MAX_LOGS);
  }
  
  // Si fue un intento fallido, verificar si se debe bloquear la IP
  if (!success) {
    checkAndBlockIP(ip);
  } else {
    // Si fue exitoso, limpiar intentos fallidos previos
    loginAttempts.delete(ip);
    blockedIPs.delete(ip);
  }
  
  // Limpiar intentos antiguos
  cleanOldAttempts();
}

/**
 * Verifica si una IP debe ser bloqueada por intentos fallidos
 */
function checkAndBlockIP(ip: string): void {
  const attempts = loginAttempts.get(ip) || [];
  const now = Date.now();
  
  // Filtrar solo intentos fallidos recientes
  const recentFailedAttempts = attempts.filter(
    (attempt) =>
      !attempt.success && now - attempt.timestamp < ATTEMPT_WINDOW_MS
  );
  
  // Si alcanzó el límite, bloquear la IP
  if (recentFailedAttempts.length >= MAX_ATTEMPTS) {
    const blockedUntil = now + BLOCK_DURATION_MS;
    blockedIPs.set(ip, {
      ip,
      blockedUntil,
      attempts: recentFailedAttempts.length,
    });
    
    console.warn(
      `🚨 IP bloqueada por intentos fallidos: ${ip} (${recentFailedAttempts.length} intentos)`
    );
  }
}

/**
 * Limpia intentos de login antiguos para liberar memoria
 */
function cleanOldAttempts(): void {
  const now = Date.now();
  
  // Limpiar intentos antiguos de loginAttempts
  loginAttempts.forEach((attempts, ip) => {
    const recentAttempts = attempts.filter(
      (attempt: LoginAttempt) => now - attempt.timestamp < ATTEMPT_WINDOW_MS
    );
    
    if (recentAttempts.length === 0) {
      loginAttempts.delete(ip);
    } else {
      loginAttempts.set(ip, recentAttempts);
    }
  });
  
  // Limpiar bloqueos expirados
  blockedIPs.forEach((block, ip) => {
    if (now > block.blockedUntil) {
      blockedIPs.delete(ip);
    }
  });
}

/**
 * Obtiene el número de intentos fallidos recientes para una IP
 */
export function getFailedAttempts(ip: string): number {
  const attempts = loginAttempts.get(ip) || [];
  const now = Date.now();
  
  return attempts.filter(
    (attempt) =>
      !attempt.success && now - attempt.timestamp < ATTEMPT_WINDOW_MS
  ).length;
}

/**
 * Obtiene los logs de seguridad recientes
 * (útil para auditoría y monitoreo)
 */
export function getSecurityLogs(limit: number = 100): LoginAttempt[] {
  return securityLogs.slice(-limit);
}

/**
 * Obtiene estadísticas de seguridad
 */
export function getSecurityStats() {
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;
  
  const recentLogs = securityLogs.filter(
    (log) => log.timestamp > last24h
  );
  
  const failedAttempts = recentLogs.filter((log) => !log.success).length;
  const successfulLogins = recentLogs.filter((log) => log.success).length;
  const uniqueIPs = new Set(recentLogs.map((log) => log.ip)).size;
  const currentlyBlocked = blockedIPs.size;
  
  return {
    last24Hours: {
      totalAttempts: recentLogs.length,
      failed: failedAttempts,
      successful: successfulLogins,
      uniqueIPs,
    },
    currentlyBlocked,
    totalLogs: securityLogs.length,
  };
}

/**
 * Desbloquea manualmente una IP (para administradores)
 */
export function unblockIP(ip: string): boolean {
  const wasBlocked = blockedIPs.has(ip);
  blockedIPs.delete(ip);
  loginAttempts.delete(ip);
  
  if (wasBlocked) {
    console.log(`🔓 IP desbloqueada manualmente: ${ip}`);
  }
  
  return wasBlocked;
}

// Limpieza periódica automática cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(cleanOldAttempts, 5 * 60 * 1000);
}
