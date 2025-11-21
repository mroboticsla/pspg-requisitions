"use client"

import { useEffect } from 'react'
import { useSafeRouter } from '../../lib/useSafeRouter'
import { useAuth } from '../providers/AuthProvider'

export default function AdminPage() {
  const router = useSafeRouter()
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    // Si no hay usuario autenticado, redirigir al login de admin
    if (!user || !profile) {
      router.replace('/admin/login')
      return
    }

    // Verificar permisos en lugar de roles fijos
    const permissions = profile.roles?.permissions as any
    const canViewDashboard = permissions?.can_do?.includes('view_dashboard')

    // Si el usuario tiene permiso de ver dashboard, redirigir
    if (canViewDashboard) {
      router.replace('/dashboard')
      return
    }

    // Si el usuario no tiene permisos de admin, redirigir al login
    router.replace('/admin/login')
  }, [loading, user, profile, router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  )
}
