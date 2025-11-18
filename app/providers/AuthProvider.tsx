"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import getFullUserData from '../../lib/getFullUserData'
import { updateLastAction } from '../../lib/sessionTracking'

type Role = {
  id: string
  name: string
  permissions?: any
}

type Profile = {
  id: string
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  is_active?: boolean
  roles?: Role | null
  metadata?: any
}

type User = {
  id: string
  email?: string | null
}

type AuthContextValue = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)



export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const loadingRef = useRef(true)
  const lastCheckTime = useRef<number>(Date.now())
  const pathname = usePathname()
  const router = useRouter()

  const userRef = useRef<User | null>(null)

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    let mounted = true
    let loadingTimeout: NodeJS.Timeout | null = null
    let maxLoadingTimeout: NodeJS.Timeout | null = null

    const load = async (isBackground = false) => {
      try {
        if (!isBackground) {
          setLoading(true)
          loadingRef.current = true
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.debug(`AuthProvider: Iniciando carga de datos del usuario (background: ${isBackground})`)
        }
        
        // Timeout de seguridad para evitar que load() se quede colgado
        const timeoutPromise = new Promise<null>((resolve) => {
          loadingTimeout = setTimeout(() => {
            console.warn('AuthProvider: load() timeout alcanzado después de 15s - posible problema de red')
            resolve(null)
          }, 15000)
        })
        
        const full = await Promise.race([
          getFullUserData(),
          timeoutPromise
        ])
        
        if (loadingTimeout) clearTimeout(loadingTimeout)
        
        if (!mounted) return
        
        if (!full) {
          if (process.env.NODE_ENV === 'development') {
            console.debug('AuthProvider: No hay datos de usuario, limpiando estado')
          }
          setUser(null)
          setProfile(null)
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.debug('AuthProvider: Datos de usuario cargados correctamente')
          }
          const u = { id: (full as any).id, email: (full as any).email }
          setUser(u)
          setProfile((full as any).profile)
        }
      } catch (error) {
        console.error('AuthProvider: Error en load()', error)
        if (!mounted) return
        // Si falla en background, no necesariamente queremos limpiar el usuario inmediatamente
        // a menos que sea un error crítico. Por seguridad, si no es background, limpiamos.
        if (!isBackground) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (!mounted) return
        if (process.env.NODE_ENV === 'development') {
          console.debug('AuthProvider: Finalizando carga')
        }
        if (!isBackground) {
          setLoading(false)
          loadingRef.current = false
        }
        lastCheckTime.current = Date.now()
      }
    }

    // Timeout máximo absoluto
    maxLoadingTimeout = setTimeout(() => {
      if (mounted && loadingRef.current) {
        console.error('AuthProvider: Timeout máximo alcanzado (10s), forzando loading = false')
        setLoading(false)
        loadingRef.current = false
        // Solo limpiar si realmente estábamos cargando (no background)
        if (!userRef.current) {
             setUser(null)
             setProfile(null)
        }
      }
    }, 10000)

    load(false) // Carga inicial bloqueante

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      if (process.env.NODE_ENV === 'development') {
        console.debug('Auth state change:', event, session ? 'session exists' : 'no session')
      }

      if (!session || event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
        loadingRef.current = false
        return
      }

      if (event === 'TOKEN_REFRESHED') {
        // Refresh en background para no bloquear la UI
        await load(true)
      } else if (event === 'INITIAL_SESSION') {
        // Si ya tenemos usuario (usando ref para evitar closure stale), tratar como refresh en background
        // Si no tenemos usuario (carga inicial real), bloquear
        await load(!!userRef.current)
      } else if (event === 'SIGNED_IN') {
        // Login explícito: bloqueante, a menos que ya tengamos usuario (raro, pero posible)
        await load(!!userRef.current) 
      }
    })

    return () => {
      mounted = false
      if (loadingTimeout) clearTimeout(loadingTimeout)
      if (maxLoadingTimeout) clearTimeout(maxLoadingTimeout)
      subscription?.subscription.unsubscribe()
    }
  }, [])

  // Efecto para re-validar la sesión de forma NO bloqueante
  useEffect(() => {
    if (loadingRef.current) return
    
    const now = Date.now()
    const timeSinceLastCheck = now - lastCheckTime.current
    const REVALIDATE_THRESHOLD = 5 * 60 * 1000 // 5 minutos

    if (timeSinceLastCheck > REVALIDATE_THRESHOLD) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`AuthProvider: Re-validando sesión (background) después de ${Math.round(timeSinceLastCheck / 1000 / 60)} minutos`)
      }
      
      lastCheckTime.current = now
      
      // Re-verificar la sesión en segundo plano (sin setLoading(true))
      const revalidate = async () => {
        try {
          const full = await getFullUserData()
          
          if (!full) {
            // Solo si explícitamente falló la validación, cerramos sesión
            console.warn('AuthProvider: Sesión inválida detectada en background check')
            setUser(null)
            setProfile(null)
          } else {
            // Actualizar datos silenciosamente
            const u = { id: (full as any).id, email: (full as any).email }
            setUser(u)
            setProfile((full as any).profile)
          }
        } catch (error) {
          console.error('Error al re-validar sesión en background:', error)
          // No cerramos sesión por error de red en background check
        }
      }
      
      revalidate()
    } else {
      lastCheckTime.current = now
      if (user?.id) {
        updateLastAction(user.id).catch(error => {
          console.error('Error al actualizar última acción:', error)
        })
      }
    }
  }, [pathname, user])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
