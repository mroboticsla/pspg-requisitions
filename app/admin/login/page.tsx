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
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

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
    setWarningMsg(null);
    setFormLoading(true);
    setLoginSuccess(false);
    
    try {
      // Verificar rate limiting ANTES de intentar login
      const rateLimitCheck = await fetch('/api/admin/rate-limit', {
        method: 'POST',
      });
      
      const rateLimitData = await rateLimitCheck.json();
      
      if (rateLimitData.blocked) {
        setIsBlocked(true);
        setBlockTimeRemaining(rateLimitData.remainingSeconds);
        setErrorMsg(rateLimitData.message);
        setFormLoading(false);
        return;
      }
      
      // Mostrar advertencia si quedan pocos intentos
      if (rateLimitData.attemptsRemaining <= 2 && rateLimitData.message) {
        setWarningMsg(rateLimitData.message);
      }
      
      const result = await supabase.auth.signInWithPassword({ email, password });
      
      if (result.error) {
        // Registrar intento fallido
        await fetch('/api/admin/rate-limit', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, email }),
        });
        
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
          // Registrar intento fallido
          await fetch('/api/admin/rate-limit', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, email }),
          });
          
          // Cerrar sesión inmediatamente si no es admin
          await supabase.auth.signOut();
          setErrorMsg("Acceso denegado. Esta área es solo para administradores.");
          setFormLoading(false);
          return;
        }

        // Registrar intento exitoso
        await fetch('/api/admin/rate-limit', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, email }),
        });

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
    <div className="flex-1 flex items-center justify-center bg-surface-secondary py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">
          {loginSuccess ? "Autenticación exitosa, redirigiendo..." : "Verificando credenciales..."}
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex-1 bg-surface-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md sm:max-w-lg space-y-6">
        
        {/* Header administrativo */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-brand-dark rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-brand-dark mb-2">
            Panel Administrativo
          </h2>
          <p className="text-neutral-600 text-sm">
            Acceso restringido solo para administradores
          </p>
        </div>

        {/* Formulario de login */}
        <div className="bg-surface-primary p-6 sm:p-8 rounded-xl shadow-lg border border-neutral-200">
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-semibold text-neutral-700 mb-2">
                Correo Electrónico Administrativo
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                </span>
                <input
                  type="email"
                  id="admin-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
                  placeholder="admin@pspgroup.com"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold text-neutral-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  id="admin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-700 focus:outline-none">
                  {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {warningMsg && (
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-300">
                <p className="text-sm text-yellow-800 font-medium">⚠️ {warningMsg}</p>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-300">
                <p className="text-sm text-red-800">{errorMsg}</p>
                {isBlocked && blockTimeRemaining > 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    Tiempo restante: {Math.ceil(blockTimeRemaining / 60)} minutos
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading || isBlocked}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all duration-200 transform ${
                formLoading || isBlocked
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-brand-dark hover:bg-brand-accent hover:scale-[1.02]"
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
          <p className="text-sm text-neutral-600">
            🔒 Conexión segura y encriptada
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            Todos los accesos son monitoreados y registrados
          </p>
        </div>
      </div>
    </div>
  );
}
