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
  role?: Role | null
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

    const load = async () => {
      setLoading(true)
      const full = await getFullUserData()
      if (!mounted) return
      if (!full) {
        setUser(null)
        setProfile(null)
      } else {
        // full contains user fields + profile under `profile`
        const u = { id: (full as any).id, email: (full as any).email }
        setUser(u)
        setProfile((full as any).profile)
      }
      setLoading(false)
    }

    load()

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      // Si no hay sesión (logout), evitamos llamar a getFullUserData
      if (!session) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      // refrescar datos completos cuando cambia el estado de auth y hay sesión
      await load()
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
