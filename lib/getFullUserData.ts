import { supabase } from './supabaseClient'

type Profile = Record<string, any> | null

/**
 * Devuelve el user (auth) combinado con la fila de `profiles` (si existe).
 * Retorna null si no hay user autenticado.
 * Incluye retry logic para conexiones lentas.
 */
export async function getFullUserData(retryCount = 0): Promise<any> {
  const maxRetries = 2

  try {
    // PRIMERO: Verificar que tengamos una sesión válida (local check, muy rápido)
    const startTime = Date.now()
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (process.env.NODE_ENV === 'development') {
      console.debug(`getFullUserData: getSession() tomó ${Date.now() - startTime}ms`)
    }

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

    // SEGUNDO: Ejecutar getUser (verificación servidor) y fetch profile en PARALELO
    // Esto reduce el tiempo total de espera al máximo de los dos, en lugar de la suma.
    const parallelStartTime = Date.now()

    const userPromise = supabase.auth.getUser()
    const profilePromise = supabase
      .from('profiles')
      .select('id, first_name, last_name, phone, is_active, role_id, metadata, updated_at, roles(*)')
      .eq('id', sessionData.session.user.id)
      .single()

    const [userResult, profileResult] = await Promise.all([userPromise, profilePromise])

    if (process.env.NODE_ENV === 'development') {
      console.debug(`getFullUserData: Parallel fetch tomó ${Date.now() - parallelStartTime}ms`)
      console.debug(`getFullUserData: Tiempo total: ${Date.now() - startTime}ms`)
    }

    // Verificar resultado de getUser
    const { data: userData, error: userError } = userResult
    if (userError) throw userError

    const user = (userData as any)?.user
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('getFullUserData: no hay usuario autenticado tras getUser')
      }
      return null
    }

    // Verificar resultado de profile
    const { data: profile, error: profileError } = profileResult

    if (profileError && (profileError as any).code !== 'PGRST116') {
      // PGRST116 => no rows found; ignorar y devolver solo user
      // Si es otro error, lo lanzamos para que el retry logic lo capture si es de red
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
        supabase.auth.signOut({ scope: 'local' }).catch(() => { })
      })
      return null
    }

    // Verificar si es un error de timeout/red y si podemos reintentar
    const isNetworkError =
      msg.includes('fetch') ||
      msg.includes('network') ||
      msg.includes('timeout') ||
      err.name === 'AbortError'

    if (isNetworkError && retryCount < maxRetries) {
      const waitTime = (retryCount + 1) * 1000 // 1s, 2s
      console.warn(`getFullUserData: Error de red, reintentando en ${waitTime}ms (intento ${retryCount + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return getFullUserData(retryCount + 1)
    }

    console.error('getFullUserData error inesperado:', err)
    return null
  }
}

export default getFullUserData
