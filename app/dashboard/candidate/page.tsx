"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CandidateDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/profile')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo a tu perfil...</p>
      </div>
    </div>
  )
}
