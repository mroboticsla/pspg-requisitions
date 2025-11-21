"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

  const userRef = useRef<User | null>(null)

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    let mounted = true

    const load = async (isBackground = false) => {
      try {
        if (!isBackground) {
          setLoading(true)
          loadingRef.current = true
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.debug(`AuthProvider: Iniciando carga de datos del usuario (background: ${isBackground})`)
        }
        
        // Timeout de seguridad de 15 segundos para evitar que la UI se quede pegada en "Verificando permisos..."
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 15000)
        )
        
        // Usar Promise.race para forzar un fallo si getFullUserData se cuelga
        const full = await Promise.race([
          getFullUserData(),
          timeoutPromise
        ]) as any
        
        if (!mounted) return
        
        if (!full) {
          if (process.env.NODE_ENV === 'development') {
            console.debug('AuthProvider: No hay datos de usuario, limpiando estado')
          }
          // Si es background check, NO limpiar estado para evitar UX disruptiva si es solo un error de red
          if (!isBackground) {
            setUser(null)
            setProfile(null)
          } else {
            console.warn('AuthProvider: Background check falló en load() - manteniendo sesión local')
          }
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
      }
    }

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
        await load(!!userRef.current)
      } else if (event === 'SIGNED_IN') {
        await load(!!userRef.current) 
      }
    })

    return () => {
      mounted = false
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
