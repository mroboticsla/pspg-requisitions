import { supabase } from './supabaseClient'

type Profile = Record<string, any> | null

/**
 * Devuelve el user (auth) combinado con la fila de `profiles` (si existe).
 * Retorna null si no hay user autenticado.
 */
export async function getFullUserData() {
  try {
    // PRIMERO: Verificar que tengamos una sesión válida
    // Esto previene el "flash" de contenido autenticado con sesiones expiradas
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('getFullUserData: Error al obtener sesión', sessionError.message)
      }
      throw sessionError
    }
    
    // Si no hay sesión activa, retornar null inmediatamente
    if (!sessionData?.session) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('getFullUserData: No hay sesión activa')
      }
      return null
    }

    // SEGUNDO: Ahora sí obtener los datos del usuario
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const user = (userData as any)?.user
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('getFullUserData: no hay usuario autenticado')
      }
      return null
    }

    // TERCERO: Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, roles(*)')
      .eq('id', user.id)
      .single()

    if (profileError && (profileError as any).code !== 'PGRST116') {
      // PGRST116 => no rows found; ignorar y devolver solo user
      throw profileError
    }

    return { ...user, profile: profile as Profile }
  } catch (err: any) {
    // Silenciar errores esperables cuando la sesión contiene un JWT cuyo `sub`
    // ya no existe en Auth (por ejemplo: "User from sub claim in JWT does not exist").
    // Esto evita spam de errores 403 en la consola en clientes con una sesión obsoleta.
    const msg = String(err?.message ?? '')
    const isExpectedError = 
      msg.includes('User from sub claim in JWT does not exist') || 
      err?.status === 403 ||
      msg.includes('JWT expired') ||
      msg.includes('Invalid token') ||
      msg.includes('Auth session missing') ||
      msg.includes('refresh_token_not_found')
    
    if (isExpectedError) {
      // Solo mostrar en modo debug para no llenar la consola
      if (process.env.NODE_ENV === 'development') {
        console.debug('getFullUserData: sesión inválida o expirada', msg)
      }
      // Limpiar la sesión de forma no bloqueante con timeout
      // Usamos Promise.race para evitar que se quede colgado
      Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 2000))
      ]).catch(() => {
        // Si falla el signOut, limpiar solo localmente
        supabase.auth.signOut({ scope: 'local' }).catch(() => {})
      })
      return null
    }

    console.error('getFullUserData error inesperado:', err)
    return null
  }
}

export default getFullUserData
