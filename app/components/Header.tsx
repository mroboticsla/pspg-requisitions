"use client";

import React from "react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from '../providers/AuthProvider';
import UserMenu from './UserMenu';

interface HeaderProps {
  showNavigation?: boolean;
}

export default function Header({ showNavigation }: HeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth()
  
  // Si la prop se pasa explícitamente, respetarla; si no, decidir por la ruta
  const resolvedShowNavigation = typeof showNavigation === "boolean" ? showNavigation : !pathname?.startsWith("/login");

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
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo y título */}
          <div className="flex items-center min-w-0 flex-1">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <img src="/images/favicon.png" alt="PSP logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">PSP Group</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Sistema de Requisiciones</p>
              </div>
            </Link>
          </div>

          {/* Navegación desktop */}
          {resolvedShowNavigation && (
            <nav className="hidden md:flex items-center space-x-6">
              {canAccess('dashboard') && (
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-brand-dark transition-colors px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
              )}
              {canAccess('requisitions') && (
                <Link
                  href="/requisitions"
                  className="text-gray-600 hover:text-brand-dark transition-colors px-3 py-2 rounded-md text-sm font-medium">
                  Requisiciones
                </Link>
              )}
              {canAccess('reports') && (
                <Link
                  href="/reports"
                  className="text-gray-600 hover:text-brand-dark transition-colors px-3 py-2 rounded-md text-sm font-medium">
                  Reportes
                </Link>
              )}
              {canAccess('profile') && (
                <Link
                  href="/profile"
                  className="text-gray-600 hover:text-brand-dark transition-colors px-3 py-2 rounded-md text-sm font-medium">
                  Perfil
                </Link>
              )}
            </nav>
          )}

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
            {/* Botón de menú móvil */}
            {resolvedShowNavigation && (
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-brand-dark hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  aria-expanded="false">
                  <span className="sr-only">Abrir menú principal</span>
                  <svg
                    className={`${isMobileMenuOpen ? "hidden" : "block"} h-5 w-5 sm:h-6 sm:w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <svg
                    className={`${isMobileMenuOpen ? "block" : "hidden"} h-5 w-5 sm:h-6 sm:w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Menú móvil */}
        {resolvedShowNavigation && isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-3 bg-surface-secondary">
            <div className="space-y-1 px-2">
              {canAccess('dashboard') && (
                <Link
                  href="/dashboard"
                  className="block px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:text-brand-dark hover:bg-white transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}>
                  Dashboard
                </Link>
              )}
              {canAccess('requisitions') && (
                <Link
                  href="/requisitions"
                  className="block px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:text-brand-dark hover:bg-white transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}>
                  Requisiciones
                </Link>
              )}
              {canAccess('reports') && (
                <Link
                  href="/reports"
                  className="block px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:text-brand-dark hover:bg-white transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}>
                  Reportes
                </Link>
              )}
              {canAccess('profile') && (
                <Link
                  href="/profile"
                  className="block px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:text-brand-dark hover:bg-white transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}>
                  Perfil
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
