"use client"

import { useEffect } from 'react'
import { useAuth } from './providers/AuthProvider'
import { useSafeRouter } from '@/lib/useSafeRouter'

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const router = useSafeRouter()

  // Redirigir según el estado de autenticación
  useEffect(() => {
    if (!loading) {
      if (user && profile) {
        // Si hay usuario autenticado, redirigir al dashboard
        router.replace('/dashboard')
      } else {
        // Si no hay usuario, redirigir a auth
        router.replace('/auth')
      }
    }
  }, [loading, user, profile, router])

  // Mostrar loading mientras se verifica la sesión
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">
          {loading ? 'Verificando sesión...' : 'Redirigiendo...'}
        </p>
      </div>
    </div>
  )
}
