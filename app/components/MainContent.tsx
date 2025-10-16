"use client"

import { usePathname } from 'next/navigation'

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Detectar si estamos en una ruta de autenticación
  const isAuthRoute = pathname?.startsWith('/auth') || 
                      pathname?.startsWith('/login') || 
                      pathname?.startsWith('/register') || 
                      pathname?.startsWith('/forgot-password') ||
                      pathname?.startsWith('/change-password')

  return (
    <main 
      className={`
        overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 min-w-0
        transition-all duration-200 ease-in-out
      `}
      style={{
        marginTop: isAuthRoute ? '0px' : 'var(--header-h, 64px)',
        marginLeft: isAuthRoute ? '0px' : 'var(--sidebar-w-ml, 0px)',
        height: isAuthRoute ? '100vh' : 'calc(100dvh - var(--header-h, 64px))'
      }}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  )
}
