"use client"

import React from 'react'
import type { AppRole } from '@/lib/getCurrentUserRole'
import getCurrentUserRole from '@/lib/getCurrentUserRole'

type Props = {
  allow: AppRole[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Nota: Este guard es asíncrono. Para uso en Server Components necesitarías
 * resolver el rol vía cookies/headers o un wrapper cliente. Aquí proveemos
 * un wrapper cliente simple.
 */
export function RequireRoleClient({ allow, fallback = null, children }: Props) {
  const [role, setRole] = React.useState<AppRole | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    getCurrentUserRole()
      .then(r => { if (mounted) setRole(r) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="p-4 text-gray-500">Verificando permisos…</div>
  if (!role || !allow.includes(role)) return <>{fallback}</>
  return <>{children}</>
}

export default RequireRoleClient
