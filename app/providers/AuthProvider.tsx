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

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000 // 15 minutos
const INACTIVITY_EVENTS: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const loadingRef = useRef(true)
  const lastCheckTime = useRef<number>(Date.now())
  const pathname = usePathname()
  const router = useRouter()
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handlingInactivityRef = useRef(false)

  useEffect(() => {
    let mounted = true
    let loadingTimeout: NodeJS.Timeout | null = null
    let maxLoadingTimeout: NodeJS.Timeout | null = null

    const load = async () => {
      try {
        setLoading(true)
        loadingRef.current = true
        
        if (process.env.NODE_ENV === 'development') {
          console.debug('AuthProvider: Iniciando carga de datos del usuario')
        }
        
        // Timeout de seguridad para evitar que load() se quede colgado
        // Reducido a 8 segundos para mejorar la experiencia del usuario
        const timeoutPromise = new Promise<null>((resolve) => {
          loadingTimeout = setTimeout(() => {
            console.warn('AuthProvider: load() timeout alcanzado después de 8s - posible problema de red')
            resolve(null)
          }, 8000) // 8 segundos - suficiente para conexiones lentas pero no excesivo
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
          // full contains user fields + profile under `profile`
          const u = { id: (full as any).id, email: (full as any).email }
          setUser(u)
          setProfile((full as any).profile)
        }
      } catch (error) {
        console.error('AuthProvider: Error en load()', error)
        if (!mounted) return
        setUser(null)
        setProfile(null)
      } finally {
        if (!mounted) return
        if (process.env.NODE_ENV === 'development') {
          console.debug('AuthProvider: Finalizando carga, setLoading(false)')
        }
        setLoading(false)
        loadingRef.current = false
        lastCheckTime.current = Date.now() // Actualizar tiempo de última verificación
      }
    }

    // Timeout máximo absoluto: forzar loading = false después de 10 segundos sin importar qué
    // Reducido para mejorar la experiencia del usuario
    maxLoadingTimeout = setTimeout(() => {
      if (mounted && loadingRef.current) {
        console.error('AuthProvider: Timeout máximo alcanzado (10s), forzando loading = false')
        setLoading(false)
        loadingRef.current = false
        setUser(null)
        setProfile(null)
      }
    }, 10000) // 10 segundos - balance entre dar tiempo y no frustrar al usuario

    load()

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      // Log del evento en desarrollo para debug
      if (process.env.NODE_ENV === 'development') {
        console.debug('Auth state change:', event, session ? 'session exists' : 'no session')
      }

      // Si no hay sesión (logout, token expirado, etc.), limpiar el estado
      if (!session || event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
        loadingRef.current = false
        return
      }

      // Para eventos de token refresh o sign in, recargar los datos del usuario
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        await load()
      }
    })

    return () => {
      mounted = false
      if (loadingTimeout) clearTimeout(loadingTimeout)
      if (maxLoadingTimeout) clearTimeout(maxLoadingTimeout)
      subscription?.subscription.unsubscribe()
    }
  }, [])

  // Efecto para re-validar la sesión cuando cambia la ruta después de inactividad
  useEffect(() => {
    // No hacer nada si ya está cargando
    if (loadingRef.current) return
    
    const now = Date.now()
    const timeSinceLastCheck = now - lastCheckTime.current
    const REVALIDATE_THRESHOLD = 5 * 60 * 1000 // 5 minutos

    // Si ha pasado más de 5 minutos desde la última verificación, re-validar
    if (timeSinceLastCheck > REVALIDATE_THRESHOLD) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`AuthProvider: Re-validando sesión después de ${Math.round(timeSinceLastCheck / 1000 / 60)} minutos de inactividad`)
      }
      
      lastCheckTime.current = now
      
      // Re-verificar la sesión
      const revalidate = async () => {
        setLoading(true)
        loadingRef.current = true
        
        try {
          const full = await getFullUserData()
          
          if (!full) {
            setUser(null)
            setProfile(null)
          } else {
            const u = { id: (full as any).id, email: (full as any).email }
            setUser(u)
            setProfile((full as any).profile)
          }
        } catch (error) {
          console.error('Error al re-validar sesión:', error)
          setUser(null)
          setProfile(null)
        } finally {
          setLoading(false)
          loadingRef.current = false
        }
      }
      
      revalidate()
    } else {
      // Actualizar el tiempo de última verificación en cada navegación
      lastCheckTime.current = now
      
      // Actualizar la última acción del usuario si está autenticado
      if (user?.id) {
        updateLastAction(user.id).catch(error => {
          console.error('Error al actualizar última acción:', error)
        })
      }
    }
  }, [pathname, user]) // Se ejecuta cada vez que cambia la ruta

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const clearTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }
    }

    if (!user) {
      clearTimer()
      handlingInactivityRef.current = false
      return
    }

    const handleInactivity = async () => {
      if (handlingInactivityRef.current) return
      handlingInactivityRef.current = true

      console.warn('AuthProvider: Sesión cerrada por inactividad')

      try {
        await supabase.auth.signOut({ scope: 'global' })
      } catch (error) {
        console.error('Error al cerrar sesión por inactividad:', error)
        await supabase.auth.signOut().catch(() => {})
      } finally {
        setUser(null)
        setProfile(null)
        setLoading(false)
        loadingRef.current = false
        clearTimer()
        if (pathname !== '/auth') {
          router.replace('/auth?reason=timeout')
        }
        handlingInactivityRef.current = false
      }
    }

    const resetTimer = () => {
      if (handlingInactivityRef.current) return
      clearTimer()
      inactivityTimerRef.current = setTimeout(handleInactivity, INACTIVITY_LIMIT_MS)
    }

    INACTIVITY_EVENTS.forEach(event => window.addEventListener(event, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      clearTimer()
      INACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, resetTimer))
    }
  }, [user, pathname, router])

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
