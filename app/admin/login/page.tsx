"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useAuth } from "../../providers/AuthProvider";
import { captureSessionInfo, saveSessionToProfile } from "../../../lib/sessionTracking";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && profile?.roles?.name) {
      const roleName = String(profile.roles.name).toLowerCase();
      // Solo admins y superadmins pueden acceder
      if (roleName === "admin" || roleName === "superadmin") {
        router.replace("/admin");
      } else if (profile) {
        // Si es otro tipo de usuario, redirigir a su área
        router.replace("/request");
      }
    }
  }, [loading, profile, router]);

  // Timeout de seguridad
  useEffect(() => {
    if (!loading) return

    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Timeout de verificación de sesión alcanzado en admin login page')
      }
    }, 10000)

    return () => clearTimeout(timeoutId)
  }, [loading]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFormLoading(true);
    setLoginSuccess(false);
    
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      
      if (result.error) {
        // Mensaje genérico para evitar enumeration attacks
        setErrorMsg("Credenciales inválidas. Por favor verifica tu información.");
        setFormLoading(false);
        return;
      }

      // Verificar que el usuario tenga rol de admin o superadmin
      if (result.data?.user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, roles(*)')
          .eq('id', result.data.user.id)
          .single();

        const roleName = String(profileData?.roles?.name || '').toLowerCase();
        
        if (roleName !== 'admin' && roleName !== 'superadmin') {
          // Cerrar sesión inmediatamente si no es admin
          await supabase.auth.signOut();
          setErrorMsg("Acceso denegado. Esta área es solo para administradores.");
          setFormLoading(false);
          return;
        }

        setLoginSuccess(true);
        
        // Capturar sesión de forma NO BLOQUEANTE
        captureSessionInfo()
          .then(sessionInfo => saveSessionToProfile(result.data.user.id, sessionInfo))
          .catch(sessionError => {
            console.warn('Error al guardar información de sesión:', sessionError);
          });
      }
    } catch (err: any) {
      setErrorMsg("Error en autenticación. Por favor intenta nuevamente.");
      setFormLoading(false);
      setLoginSuccess(false);
    }
  };

  // Mostrar loading mientras se verifica la sesión
  if (loading || loginSuccess) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-admin-primary to-admin-accent">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white font-medium">
          {loginSuccess ? "Autenticación exitosa, redirigiendo..." : "Verificando credenciales..."}
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-admin-primary to-admin-accent flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header administrativo */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Shield className="h-10 w-10 text-admin-primary" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Panel Administrativo
          </h2>
          <p className="text-admin-accent/80 text-sm">
            Acceso restringido solo para administradores
          </p>
        </div>

        {/* Formulario de login */}
        <div className="bg-white p-8 rounded-2xl shadow-2xl border border-admin-border">
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-semibold text-gray-700 mb-2">
                Correo Electrónico Administrativo
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
                <input
                  type="email"
                  id="admin-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary focus:border-transparent transition-all duration-200 bg-gray-50 text-gray-900"
                  placeholder="admin@pspgroup.com"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  id="admin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary focus:border-transparent transition-all duration-200 bg-gray-50 text-gray-900"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none">
                  {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-300">
                <p className="text-sm text-red-800 font-medium">{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white transition-all duration-200 transform ${
                formLoading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-admin-primary hover:bg-admin-accent hover:scale-[1.02] active:scale-[0.98]"
              }`}>
              {formLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </span>
              ) : (
                "Acceder al Panel"
              )}
            </button>
          </form>
        </div>

        {/* Footer de seguridad */}
        <div className="text-center">
          <p className="text-sm text-white/80">
            🔒 Conexión segura y encriptada
          </p>
          <p className="text-xs text-white/60 mt-2">
            Todos los accesos son monitoreados y registrados
          </p>
        </div>
      </div>
    </div>
  );
}
