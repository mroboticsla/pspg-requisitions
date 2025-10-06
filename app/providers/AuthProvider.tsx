"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

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
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      const currentUser = data?.user ? { id: data.user.id, email: data.user.email } : null
      setUser(currentUser)

      if (currentUser) {
        // cargar profile y role (incluye permissions)
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, phone, is_active, role_id, roles(id, name, permissions)')
          .eq('id', currentUser.id)
          .single()

        if (!mounted) return
        if (profileData) {
          // Supabase puede devolver la relación como array cuando se usa select sobre una FK
          const rolesField = (profileData as any).roles
          const roleObj = Array.isArray(rolesField) ? rolesField[0] : rolesField
          const role = roleObj ? { id: roleObj.id, name: roleObj.name, permissions: roleObj.permissions } : null
          setProfile({ id: profileData.id, first_name: profileData.first_name, last_name: profileData.last_name, phone: profileData.phone, is_active: profileData.is_active, role })
        } else {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    }

    load()

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (session?.user) {
        const u = { id: session.user.id, email: session.user.email }
        setUser(u)
        // cargar profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, phone, is_active, role_id, roles(id, name, permissions)')
          .eq('id', u.id)
          .single()

        if (!mounted) return
        if (profileData) {
          const rolesField = (profileData as any).roles
          const roleObj = Array.isArray(rolesField) ? rolesField[0] : rolesField
          const role = roleObj ? { id: roleObj.id, name: roleObj.name, permissions: roleObj.permissions } : null
          setProfile({ id: profileData.id, first_name: profileData.first_name, last_name: profileData.last_name, phone: profileData.phone, is_active: profileData.is_active, role })
        } else {
          setProfile(null)
        }
      } else {
        setUser(null)
        setProfile(null)
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
