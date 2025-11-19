"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import type { AppRole } from '@/lib/getCurrentUserRole'
import { useAuth } from '@/app/providers/AuthProvider'

type Props = {
  allow: AppRole[]
  fallback?: React.ReactNode
  redirectTo?: string
  children: React.ReactNode
}

/**
 * Wrapper de cliente para protección de rutas basada en roles.
 * Utiliza el contexto de AuthProvider para evitar llamadas redundantes a la API.
 */
export function RequireRoleClient({ allow, fallback = null, redirectTo, children }: Props) {
  const { profile, loading } = useAuth()
  const router = useRouter()
  
  // Extraer el nombre del rol del perfil cargado en memoria
  const role = profile?.roles?.name as AppRole | undefined

  React.useEffect(() => {
    if (!loading && (!role || !allow.includes(role)) && redirectTo) {
      router.push(redirectTo)
    }
  }, [loading, role, allow, redirectTo, router])

  if (loading) return <div className="p-4 text-gray-500">Verificando permisos…</div>
  
  if (!role || !allow.includes(role)) return <>{fallback}</>
  
  return <>{children}</>
}

export default RequireRoleClient
