"use client";

import React from "react";
import { useAuth } from "../providers/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redireccionar si no hay usuario autenticado
  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="mt-2 text-sm text-gray-600">
            Administra tus preferencias y configuraciones de cuenta
          </p>
        </div>

        {/* Secciones de configuración */}
        <div className="space-y-6">
          {/* Preferencias de notificaciones */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Notificaciones por correo</h3>
                  <p className="text-sm text-gray-500">Recibe actualizaciones importantes por email</p>
                </div>
                <button
                  type="button"
                  className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-brand-dark transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2"
                  role="switch"
                  aria-checked="true"
                >
                  <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Notificaciones push</h3>
                  <p className="text-sm text-gray-500">Recibe notificaciones en tiempo real</p>
                </div>
                <button
                  type="button"
                  className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2"
                  role="switch"
                  aria-checked="false"
                >
                  <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                </button>
              </div>
            </div>
          </div>

          {/* Privacidad y seguridad */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Privacidad y Seguridad</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <Link
                href="/change-password"
                className="flex items-center justify-between py-3 hover:bg-gray-50 rounded-md px-2 -mx-2 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Cambiar contraseña</h3>
                    <p className="text-sm text-gray-500">Actualiza tu contraseña regularmente</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <div className="flex items-center justify-between py-3 hover:bg-gray-50 rounded-md px-2 -mx-2 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Autenticación de dos factores</h3>
                    <p className="text-sm text-gray-500">Agrega una capa extra de seguridad</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Preferencias de la aplicación */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Preferencias de la Aplicación</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-900 mb-2">
                  Idioma
                </label>
                <select
                  id="language"
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-accent focus:border-brand-accent"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-900 mb-2">
                  Zona horaria
                </label>
                <select
                  id="timezone"
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-accent focus:border-brand-accent"
                >
                  <option value="America/Mexico_City">América/Ciudad de México (GMT-6)</option>
                  <option value="America/New_York">América/Nueva York (GMT-5)</option>
                  <option value="America/Los_Angeles">América/Los Ángeles (GMT-8)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botón guardar */}
          <div className="flex justify-end">
            <button
              type="button"
              className="px-6 py-2 text-sm font-medium text-white bg-brand-dark border border-transparent rounded-md hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
