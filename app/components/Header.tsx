"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from '../providers/AuthProvider';
import UserMenu from './UserMenu';

interface HeaderProps {
  showNavigation?: boolean;
}

export default function Header({ showNavigation }: HeaderProps) {
  const pathname = usePathname();
  const { user, profile, loading, signOut } = useAuth()
  const headerRef = React.useRef<HTMLElement | null>(null)

  // Expone la altura real del header como variable CSS --header-h para
  // poder fijar el sidebar justo por debajo, incluso si la altura cambia.
  React.useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return

    const setVar = () => {
      const h = el.offsetHeight
      // Guardamos en el elemento raíz para poder usarla desde cualquier componente
      document.documentElement.style.setProperty('--header-h', `${h}px`)
    }
    setVar()

    // Observa cambios de tamaño del header y el viewport
    const ro = new ResizeObserver(setVar)
    ro.observe(el)
    window.addEventListener('resize', setVar)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', setVar)
    }
  }, [])
  
  // Si la prop se pasa explícitamente, respetarla; si no, decidir por la ruta
  const resolvedShowNavigation = typeof showNavigation === "boolean" ? showNavigation : !pathname?.startsWith("/auth");

  if (pathname?.startsWith("/auth")) return null;

  const canAccess = (moduleName: string) => {
    const role = (profile as any)?.roles
    if (!role) return false
    const modules = role.permissions?.modules
    if (!modules) return false
    // Si el módulo existe en permissions, permitimos el acceso (puedes afinar por acciones)
    return Boolean(modules[moduleName])
  }

  return (
    <header ref={headerRef} className="fixed top-0 inset-x-0 z-50 bg-white shadow-sm border-b border-gray-200">
      {/* Contenedor a ancho completo para aprovechar toda la pantalla en desktop */}
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo y título */}
          <div className="flex items-center min-w-0 flex-1">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <Image src="/images/favicon.png" alt="PSP logo" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0" priority />
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">PSP Group</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Sistema de Requisiciones</p>
              </div>
            </Link>
          </div>

          {/* Estado de usuario / acciones */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">Verificando...</span>
              </div>
            ) : user ? (
              <UserMenu user={user} profile={profile} signOut={signOut} />
            ) : (
              <>
                <Link href="/auth" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 bg-brand-dark text-white rounded-md font-medium hover:bg-brand-accent transition-colors whitespace-nowrap">
                  Iniciar sesión
                </Link>
                <Link href="/auth?mode=register" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 border border-brand-accent text-brand-accent rounded-md font-medium hover:bg-brand-accent hover:text-white transition-colors whitespace-nowrap hidden sm:inline-block">
                  Registrarse
                </Link>
              </>
            )}
            {/* Botón de hamburguesa (abre el sidebar en móvil) */}
            {resolvedShowNavigation && (
              <div className="md:hidden">
                <button
                  onClick={() => window.dispatchEvent(new Event('sidebar:toggle'))}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-brand-dark hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  aria-label="Abrir menú de navegación">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
