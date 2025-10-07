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
  loginAt?: string
  lastActionAt?: string
}

export type SessionMetadata = {
  sessionHistory?: SessionInfo[]
  currentSession?: SessionInfo
}

/**
 * Obtiene la IP del cliente
 * En producción, puede requerir configuración del servidor/proxy
 */
async function getClientIP(): Promise<string | undefined> {
  try {
    // Intenta obtener la IP desde un servicio externo
    // En producción, mejor obtenerla desde el servidor
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(3000) // timeout de 3 segundos
    })
    const data = await response.json()
    return data.ip
  } catch (error) {
    console.warn('No se pudo obtener la IP del cliente:', error)
    return undefined
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
  const ip = await getClientIP()
  const now = new Date().toISOString()

  return {
    ip,
    userAgent,
    browser,
    os,
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
      if (process.env.NODE_ENV === 'development') {
        console.debug('Información de sesión guardada exitosamente')
      }
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
