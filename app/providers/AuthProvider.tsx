"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import getFullUserData from '../../lib/getFullUserData'

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

  useEffect(() => {
    let mounted = true
    let loadingTimeout: NodeJS.Timeout | null = null
    let maxLoadingTimeout: NodeJS.Timeout | null = null

    const load = async () => {
      try {
        setLoading(true)
        
        if (process.env.NODE_ENV === 'development') {
          console.debug('AuthProvider: Iniciando carga de datos del usuario')
        }
        
        // Timeout de seguridad para evitar que load() se quede colgado
        const timeoutPromise = new Promise<null>((resolve) => {
          loadingTimeout = setTimeout(() => {
            console.warn('AuthProvider: load() timeout alcanzado, limpiando sesión')
            resolve(null)
          }, 5000) // Reducido a 5 segundos
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
      }
    }

    // Timeout máximo absoluto: forzar loading = false después de 7 segundos sin importar qué
    maxLoadingTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.error('AuthProvider: Timeout máximo alcanzado (7s), forzando loading = false')
        setLoading(false)
        setUser(null)
        setProfile(null)
      }
    }, 7000)

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
