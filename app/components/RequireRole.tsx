"use client"

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { AppRole } from '@/lib/getCurrentUserRole'
import { useAuth } from '@/app/providers/AuthProvider'

type Props = {
  allow?: AppRole[]
  permission?: string
  fallback?: React.ReactNode
  redirectTo?: string
  children: React.ReactNode
}

/**
 * Wrapper de cliente para protección de rutas basada en roles y permisos.
 * Utiliza el contexto de AuthProvider para evitar llamadas redundantes a la API.
 */
export function RequireRoleClient({ allow, permission, fallback = null, redirectTo, children }: Props) {
  const { profile, loading } = useAuth()
  const router = useRouter()
  
  // Extraer el nombre del rol del perfil cargado en memoria
  const role = profile?.roles?.name as AppRole | undefined
  const permissions = profile?.roles?.permissions as { can_do?: string[] } | undefined
  const canDo = permissions?.can_do || []
  
  const pathname = usePathname()

  React.useEffect(() => {
    if (loading) return

    let hasAccess = true

    // 1. Verificar rol si se proporciona 'allow'
    if (allow && allow.length > 0) {
      if (!role || !allow.includes(role)) {
        hasAccess = false
      }
    }

    // 2. Verificar permiso si se proporciona 'permission'
    if (permission) {
      // Superadmin siempre tiene acceso, o verificar si tiene el permiso explícito
      const isSuperAdmin = role === 'superadmin'
      if (!isSuperAdmin && !canDo.includes(permission)) {
        hasAccess = false
      }
    }

    if (!hasAccess) {
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        // Determinar ruta de login basada en la sección actual
        // Si estamos en /admin pero no en login, ir a admin login. Si no, ir a auth general.
        const isAdminSection = pathname?.startsWith('/admin')
        const loginPath = isAdminSection ? '/admin/login' : '/auth'
        
        // Evitar bucles de redirección si ya estamos en la página de destino
        if (pathname !== loginPath && !pathname?.startsWith(loginPath)) {
          router.push(`${loginPath}?reason=unauthorized&next=${encodeURIComponent(pathname || '/')}`)
        }
      }
    }
  }, [loading, role, allow, permission, canDo, redirectTo, router, pathname])

  if (loading) return <div className="p-4 text-gray-500">Verificando permisos…</div>
  
  // Lógica de renderizado debe coincidir con useEffect
  let hasAccess = true
  
  if (allow && allow.length > 0) {
    if (!role || !allow.includes(role)) {
      hasAccess = false
    }
  }

  if (permission) {
    const isSuperAdmin = role === 'superadmin'
    if (!isSuperAdmin && !canDo.includes(permission)) {
      hasAccess = false
    }
  }

  if (!hasAccess) return <>{fallback}</>
  
  return <>{children}</>
}

export default RequireRoleClient
