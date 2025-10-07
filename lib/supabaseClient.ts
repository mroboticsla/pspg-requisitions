import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  // En tiempo de desarrollo es útil lanzar un error visible si faltan las variables
  // pero en producción Vercel debe tenerlas definidas.
  console.warn('WARNING: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Agregar timeout para las operaciones de auth
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': 'pspg-requisitions'
    }
  }
})
