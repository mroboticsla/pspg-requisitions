/**
 * Utilidad para rastrear información de sesión de usuarios
 * Guarda IP, navegador, y timestamps de login/última acción en metadata del perfil
 */

import { supabase } from './supabaseClient'

export type SessionInfo = {
  ip?: string
  userAgent?: string
  browser?: string
  os?: string
  country?: string
  countryCode?: string
  city?: string
  loginAt?: string
  lastActionAt?: string
}

export type SessionMetadata = {
  sessionHistory?: SessionInfo[]
  currentSession?: SessionInfo
}

/**
 * Obtiene la IP del cliente y su geolocalización
 * En producción, puede requerir configuración del servidor/proxy
 */
async function getClientIPAndLocation(): Promise<{ 
  ip?: string; 
  country?: string; 
  countryCode?: string; 
  city?: string 
}> {
  try {
    // Usar ipapi.co que proporciona IP + geolocalización en una sola llamada
    // Límite gratuito: 1000 requests/día
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000) // timeout de 5 segundos
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch IP location')
    }
    
    const data = await response.json()
    
    return {
      ip: data.ip,
      country: data.country_name,
      countryCode: data.country_code,
      city: data.city
    }
  } catch (error) {
    console.warn('No se pudo obtener la geolocalización:', error)
    
    // Fallback: intentar solo obtener la IP sin geolocalización
    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        signal: AbortSignal.timeout(3000)
      })
      const data = await response.json()
      return { ip: data.ip }
    } catch (fallbackError) {
      console.warn('No se pudo obtener la IP del cliente:', fallbackError)
      return {}
    }
  }
}

/**
 * Parsea el user agent para extraer información del navegador y SO
 */
function parseBrowserInfo(userAgent: string): { browser: string; os: string } {
  // Detectar navegador
  let browser = 'Unknown'
  if (userAgent.includes('Firefox/')) {
    browser = 'Firefox'
  } else if (userAgent.includes('Edg/')) {
    browser = 'Edge'
  } else if (userAgent.includes('Chrome/')) {
    browser = 'Chrome'
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    browser = 'Safari'
  } else if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) {
    browser = 'Opera'
  }

  // Detectar SO
  let os = 'Unknown'
  if (userAgent.includes('Windows NT')) {
    os = 'Windows'
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS'
  } else if (userAgent.includes('Linux')) {
    os = 'Linux'
  } else if (userAgent.includes('Android')) {
    os = 'Android'
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS'
  }

  return { browser, os }
}

/**
 * Captura la información actual de la sesión
 */
export async function captureSessionInfo(): Promise<SessionInfo> {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
  const { browser, os } = parseBrowserInfo(userAgent)
  const { ip, country, countryCode, city } = await getClientIPAndLocation()
  const now = new Date().toISOString()

  return {
    ip,
    userAgent,
    browser,
    os,
    country,
    countryCode,
    city,
    loginAt: now,
    lastActionAt: now
  }
}

/**
 * Guarda la información de sesión en el perfil del usuario
 * Mantiene un historial de las últimas 10 sesiones
 */
export async function saveSessionToProfile(userId: string, sessionInfo: SessionInfo): Promise<void> {
  try {
    console.log('saveSessionToProfile - Guardando sesión:', sessionInfo);
    
    // Obtener metadata actual
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Error al obtener perfil para guardar sesión:', fetchError)
      return
    }

    console.log('saveSessionToProfile - metadata actual:', profile?.metadata);

    const currentMetadata: SessionMetadata = profile?.metadata || {}
    const sessionHistory = currentMetadata.sessionHistory || []

    // Agregar la nueva sesión al historial
    sessionHistory.unshift(sessionInfo)

    // Mantener solo las últimas 10 sesiones
    const updatedHistory = sessionHistory.slice(0, 10)

    // Actualizar metadata con la sesión actual y el historial
    const updatedMetadata: SessionMetadata = {
      currentSession: sessionInfo,
      sessionHistory: updatedHistory
    }

    console.log('saveSessionToProfile - nuevo metadata a guardar:', updatedMetadata);

    // Guardar en la base de datos
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error al actualizar metadata de sesión:', updateError)
    } else {
      console.log('✅ Información de sesión guardada exitosamente en la base de datos');
    }
  } catch (error) {
    console.error('Error al guardar información de sesión:', error)
  }
}

/**
 * Actualiza el timestamp de última acción del usuario
 */
export async function updateLastAction(userId: string): Promise<void> {
  try {
    // Obtener metadata actual
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Error al obtener perfil para actualizar última acción:', fetchError)
      return
    }

    const currentMetadata: SessionMetadata = profile?.metadata || {}
    const currentSession = currentMetadata.currentSession

    // Si hay una sesión actual, actualizar su lastActionAt
    if (currentSession) {
      currentSession.lastActionAt = new Date().toISOString()

      const updatedMetadata: SessionMetadata = {
        ...currentMetadata,
        currentSession
      }

      // Guardar en la base de datos
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error al actualizar última acción:', updateError)
      }
    }
  } catch (error) {
    console.error('Error al actualizar última acción:', error)
  }
}
