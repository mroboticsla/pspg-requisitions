"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const router = useRouter()
  const { profile, loading } = useAuth()

  useEffect(() => {
    // Si ya cargó el estado de auth y existe un role, redirigir a /admin
    if (!loading && profile?.role?.name) {
      const roleName = String(profile.role.name).toLowerCase()
      if (roleName === 'admin' || roleName === 'superadmin') {
        router.replace('/admin')
      }
    }
  }, [loading, profile, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  setErrorMsg(null)
  setFormLoading(true)
    try {
      const result = await supabase.auth.signInWithPassword({ email, password })
      if (result.error) {
        setErrorMsg(result.error.message)
        setFormLoading(false)
        return
      }
      // Inicio de sesión correcto
      // Puedes redirigir a la página principal o dashboard
      router.push('/request')
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Error en autenticación')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-surface-secondary">
      <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Contenedor principal del formulario */}
          <div className="bg-surface-primary p-8 rounded-xl shadow-lg border border-neutral-200">
            {/* Header del formulario */}
            <div className="text-center mb-8">
              <div className="h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                <img src="/images/logo-web-dark.png" alt="PSP logo" className="h-10 rounded-lg object-cover" />
              </div>
              <h2 className="text-xl font-bold text-neutral-800 mb-2">Inicia sesión para continuar</h2>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                  </span>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                  </span>

                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
                    placeholder="••••••••"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-700 focus:outline-none"
                  >
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-neutral-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-600">
                    Recordarme
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-brand-accent hover:text-brand-dark transition-colors">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>

              {errorMsg && (
                <p className="text-sm text-red-600 mb-2">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={formLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all duration-200 transform ${formLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-dark hover:bg-brand-accent'} `}
              >
                {formLoading ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
            </form>

            {/* Footer del formulario */}
            <div className="mt-8 text-center">
              <p className="text-xs text-neutral-500">© 2025 PSP Group. Todos los derechos reservados.</p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="text-center">
            <p className="text-sm text-neutral-600">
              ¿Necesitas ayuda?{" "}
              <a href="#" className="font-medium text-brand-accent hover:text-brand-dark transition-colors">
                Contacta soporte técnico
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
