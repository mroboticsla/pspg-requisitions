"use client";
import Image from 'next/image'

import { useState, useEffect, Suspense } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";
import AuthTabSwitch from "../components/AuthTabSwitch";
import PhoneInput, { getUnformattedPhone, composePhoneCountryValue, parsePhoneCountryValue, getCountryByValue } from "../components/PhoneInput";
import { captureSessionInfo, saveSessionToProfile } from "../../lib/sessionTracking";

function AuthPageContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("mode") === "register" ? "register" : "login";

  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(() => composePhoneCountryValue("MX", "+52"));
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // DEBUG: Log cuando cambia phoneCountry
  useEffect(() => {
    console.log('🏠 AuthPage phoneCountry cambió a:', phoneCountry);
  }, [phoneCountry]);

  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const router = useRouter();
  const { profile, loading } = useAuth();

  // Actualizar el tab activo cuando cambien los parámetros de URL
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "register") {
      setActiveTab("register");
    } else {
      setActiveTab("login");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && profile?.roles?.name) {
      const roleName = String(profile.roles.name).toLowerCase();
      if (roleName === "admin" || roleName === "superadmin") {
        router.replace("/admin");
      } else {
        router.replace("/request");
      }
    }
  }, [loading, profile, router]);

  // Timeout de seguridad: Si loading se queda en true por más de 10 segundos, continuar mostrando el formulario
  useEffect(() => {
    if (!loading) return

    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Timeout de verificación de sesión alcanzado en auth page')
        // En la página de auth, no redirigimos, solo dejamos que muestre el formulario
        // La página se encargará de manejar esto cuando loading cambie
      }
    }, 10000) // 10 segundos

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
        setErrorMsg(result.error.message);
        setFormLoading(false);
        return;
      }
      
      // Marcar login como exitoso para mostrar mensaje de éxito
      setLoginSuccess(true);
      
      // Capturar y guardar información de sesión de forma NO BLOQUEANTE
      // Esto evita que el login se retrase esperando la geolocalización
      if (result.data?.user?.id) {
        // Ejecutar en background sin await
        captureSessionInfo()
          .then(sessionInfo => saveSessionToProfile(result.data.user.id, sessionInfo))
          .catch(sessionError => {
            // No bloqueamos el login si falla el tracking de sesión
            console.warn('Error al guardar información de sesión:', sessionError);
          });
      }
      
      // El AuthProvider detectará el cambio y redirigirá automáticamente
      // No hacemos router.push aquí para evitar conflictos
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Error en autenticación");
      setFormLoading(false);
      setLoginSuccess(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // Obtener solo los dígitos del teléfono
      const digits = getUnformattedPhone(phoneNumber);
      
      // Validar longitud según el país seleccionado
      const countryConfig = getCountryByValue(phoneCountry);
      if (countryConfig && digits.length !== countryConfig.length) {
        setErrorMsg(`El número de teléfono debe tener ${countryConfig.length} dígitos para ${countryConfig.name}.`);
        setFormLoading(false);
        return;
      }

      const { dialCode } = parsePhoneCountryValue(phoneCountry);
      const phonePrefix = dialCode || phoneCountry;
      const phone = `${phonePrefix}${digits}`.trim();

      const { data: existingPhone, error: phoneError } = await supabase.from("profiles").select("id").eq("phone", phone).limit(1);

      if (phoneError) {
        console.error("Error verificando teléfono:", phoneError);
        setErrorMsg("Error al verificar el teléfono. Inténtalo de nuevo.");
        setFormLoading(false);
        return;
      }

      if (existingPhone && existingPhone.length > 0) {
        setErrorMsg("El número de teléfono ya está registrado.");
        setFormLoading(false);
        return;
      }

      const userMetadata = { first_name: firstName, last_name: lastName, phone };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: userMetadata },
      });
      if (error) throw error;

      const userId = (data?.user as any)?.id || (data as any)?.id;
      if (userId) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 7000);

          const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              userId, 
              first_name: firstName, 
              last_name: lastName, 
              phone
            }),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          const resJson = await res.json();
          if (!res.ok) {
            console.error("Profile creation failed", resJson);
            const errorMsg = resJson.error || "Error desconocido al crear el perfil";
            throw new Error(`Error al crear perfil: ${errorMsg}. Detalles: ${JSON.stringify(resJson.details || {})}`);
          }

          console.log("Profile created successfully", resJson);
        } catch (e: any) {
          if (e.name === "AbortError") {
            console.error("Profile creation request aborted (timeout)");
            throw new Error("La creación del perfil tardó demasiado. Por favor, intenta nuevamente o contacta a soporte.");
          } else {
            console.error("Failed to create profile via API", e);
            throw new Error(e.message || "No se pudo crear el perfil automáticamente. Por favor contacta a soporte.");
          }
        }
      } else {
        throw new Error("No se pudo obtener el ID del usuario creado");
      }

      setSuccessMsg("Cuenta registrada exitosamente.");
      setTimeout(() => {
        setActiveTab("login");
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes("already registered")) {
        setErrorMsg("El correo electrónico ya está registrado.");
      } else {
        setErrorMsg(err.message || "Error en el registro");
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Mostrar loading mientras se verifica la sesión
  if (loading || loginSuccess) return (
    <div className="flex items-center justify-center min-h-screen bg-surface-secondary">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">
          {loginSuccess ? "Inicio de sesión exitoso, redirigiendo..." : "Verificando sesión..."}
        </p>
      </div>
    </div>
  )

  return (
    <div className="h-screen bg-surface-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-md sm:max-w-lg space-y-6">
        {/* Logo y título */}
        <div className="text-center">
          <div className="h-20 flex items-center justify-center mx-auto mb-4">
            <Image 
              src="/images/logo-web-dark.png" 
              alt="PSP logo" 
              width={200} 
              height={80} 
              className="h-16 w-auto object-contain" 
              priority 
              quality={100}
            />
          </div>
        </div>

        {/* Control de pestañas flotante */}
        <AuthTabSwitch activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Contenedor del formulario */}
        <div className="bg-surface-primary p-6 sm:p-8 rounded-xl shadow-lg border border-neutral-200">
          {/* Formulario de Login */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-700 focus:outline-none">
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Sección "Recordarme" y "Olvidaste tu contraseña" optimizada para móvil */}
              <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                <div className="text-sm w-full text-right">
                  <a href="/forgot-password" className="font-medium text-brand-accent hover:text-brand-dark transition-colors">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-300">
                  <p className="text-sm text-red-800">{errorMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={formLoading || loginSuccess}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all duration-200 transform ${
                  formLoading || loginSuccess ? "bg-gray-400 cursor-not-allowed" : "bg-brand-dark hover:bg-brand-accent hover:scale-[1.02]"
                } `}>
                {loginSuccess ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redirigiendo...
                  </span>
                ) : formLoading ? (
                  "Iniciando..."
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>
          )}

          {/* Formulario de Registro */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-neutral-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
                    placeholder="Nombre"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-neutral-700 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
                    placeholder="Apellido"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email-register" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                  </span>
                  <input
                    type="email"
                    id="email-register"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Teléfono</label>
                <PhoneInput
                  phoneCountry={phoneCountry}
                  phoneNumber={phoneNumber}
                  onCountryChange={setPhoneCountry}
                  onNumberChange={setPhoneNumber}
                  required
                  placeholder="1234567890"
                  className="border-neutral-300 bg-surface-secondary"
                />
              </div>

              <div>
                <label htmlFor="password-register" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                  </span>

                  <input
                    type={showPassword ? "text" : "password"}
                    id="password-register"
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-700 focus:outline-none">
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-300">
                  <p className="text-sm text-red-800">{errorMsg}</p>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-300">
                  <p className="text-sm text-green-800">{successMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={formLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all duration-200 transform ${
                  formLoading ? "bg-gray-400 cursor-not-allowed" : "bg-brand-accent hover:bg-brand-dark hover:scale-[1.02]"
                } `}>
                {formLoading ? "Creando..." : "Crear cuenta"}
              </button>
            </form>
          )}

          {/* Footer del formulario */}
          <div className="mt-6 text-center">
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
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
