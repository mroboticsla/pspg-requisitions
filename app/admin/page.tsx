"use client"

import { useEffect } from 'react'
import { useSafeRouter } from '../../lib/useSafeRouter'
import { useAuth } from '../providers/AuthProvider'

export default function AdminPage() {
  const router = useSafeRouter()
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirigir automaticamente al dashboard principal
      router.replace('/dashboard')
    }
  }, [loading, user, profile, router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo al dashboard...</p>
      </div>
    </div>
  )
}
