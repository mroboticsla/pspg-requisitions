'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

interface HeaderProps {
  showNavigation?: boolean
}

export default function Header({ showNavigation }: HeaderProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // Si la prop se pasa explícitamente, respetarla; si no, decidir por la ruta
  const resolvedShowNavigation = typeof showNavigation === 'boolean' ? showNavigation : !pathname?.startsWith('/login')

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo y título */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-accent to-brand-dark rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">PSP</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  PSP Group
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Sistema de Requisiciones
                </p>
              </div>
            </Link>
          </div>

          {/* Navegación desktop */}
          {resolvedShowNavigation && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/dashboard" 
                className="text-gray-600 hover:text-brand-dark transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link 
                href="/requisitions" 
                className="text-gray-600 hover:text-brand-dark transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                Requisiciones
              </Link>
              <Link 
                href="/reports" 
                className="text-gray-600 hover:text-brand-dark transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                Reportes
              </Link>
              <Link 
                href="/profile" 
                className="text-gray-600 hover:text-brand-dark transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                Perfil
              </Link>
            </nav>
          )}

          {/* Botón de menú móvil */}
          {resolvedShowNavigation && (
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-brand-dark hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                aria-expanded="false"
              >
                <span className="sr-only">Abrir menú principal</span>
                <svg
                  className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Menú móvil */}
          {resolvedShowNavigation && isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-3">
            <div className="space-y-1">
              <Link
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-brand-dark hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/requisitions"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-brand-dark hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Requisiciones
              </Link>
              <Link
                href="/reports"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-brand-dark hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Reportes
              </Link>
              <Link
                href="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-brand-dark hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Perfil
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}