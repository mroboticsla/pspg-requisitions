"use client"

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Hook personalizado que envuelve useRouter de Next.js
 * para manejar redirecciones de forma más segura y evitar
 * errores de webpack durante la navegación.
 */
export function useSafeRouter() {
  const router = useRouter()

  const safeReplace = useCallback((url: string) => {
    try {
      router.replace(url)
    } catch (error) {
      // Si router.replace falla, intentar con router.push como fallback
      console.warn('Error en router.replace, usando router.push como fallback:', error)
      try {
        router.push(url)
      } catch (pushError) {
        // Si ambos fallan, usar window.location como último recurso
        console.error('Error en router.push, usando window.location:', pushError)
        if (typeof window !== 'undefined') {
          window.location.href = url
        }
      }
    }
  }, [router])

  const safePush = useCallback((url: string) => {
    try {
      router.push(url)
    } catch (error) {
      console.warn('Error en router.push, usando window.location:', error)
      if (typeof window !== 'undefined') {
        window.location.href = url
      }
    }
  }, [router])

  return {
    ...router,
    replace: safeReplace,
    push: safePush,
  }
}
