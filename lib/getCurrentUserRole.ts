import { supabase } from './supabaseClient'
import getFullUserData from './getFullUserData'

export type AppRole = 'superadmin' | 'admin' | 'partner' | 'candidate'

/**
 * Obtiene el rol actual del usuario.
 * - Primero intenta leerlo del perfil ya cargado (si existe).
 * - Si no está disponible, usa la RPC `public.current_user_role()`.
 */
export async function getCurrentUserRole(): Promise<AppRole | null> {
  // Intento A: reutilizar datos ya cargados
  const full = await getFullUserData().catch(() => null)
  const profileRoleName = (full as any)?.profile?.roles?.name as string | undefined
  if (profileRoleName && isAppRole(profileRoleName)) return profileRoleName

  // Intento B: RPC segura
  const { data, error } = await supabase.rpc('current_user_role')
  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('getCurrentUserRole RPC error:', error.message)
    }
    return null
  }
  const role = String(data || '').trim()
  return isAppRole(role) ? role : null
}

function isAppRole(r: string): r is AppRole {
  return ['superadmin', 'admin', 'partner', 'candidate'].includes(r)
}

export default getCurrentUserRole
