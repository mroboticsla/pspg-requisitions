"use client"

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
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
  const pathname = usePathname()

  React.useEffect(() => {
    if (loading) return

    const hasPermission = role && allow.includes(role)

    if (!hasPermission) {
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
  }, [loading, role, allow, redirectTo, router, pathname])

  if (loading) return <div className="p-4 text-gray-500">Verificando permisos…</div>
  
  if (!role || !allow.includes(role)) return <>{fallback}</>
  
  return <>{children}</>
}

export default RequireRoleClient
