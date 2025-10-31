"use client";

import { useState, useEffect, Suspense } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";
import AuthTabSwitch from "../components/AuthTabSwitch";
import PhoneInput, { getUnformattedPhone, composePhoneCountryValue, parsePhoneCountryValue, getCountryByValue } from "../components/PhoneInput";
import { captureSessionInfo, saveSessionToProfile } from "../../lib/sessionTracking";

function LoginPageContent() {
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

  // Verificar si ya hay una sesión válida al cargar la página
  useEffect(() => {
    if (!loading && profile?.roles?.name) {
      const roleName = String(profile.roles.name).toLowerCase();
      // Solo redirigir a usuarios NO administrativos que ya tienen sesión
      if (roleName === "partner") {
        router.replace("/dashboard/partner");
      }else if (roleName === "candidate") {
        router.replace("/dashboard/candidate");
      }
      // Los admin/superadmin que lleguen aquí serán manejados en handleLoginSubmit
    }
  }, [loading, profile, router]);

  // Timeout de seguridad
  useEffect(() => {
    if (!loading) return

    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Timeout de verificación de sesión alcanzado en login page')
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
        // Traducir mensajes de error de Supabase
        const errorMessage = result.error.message.toLowerCase();
        if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid') || errorMessage.includes('credentials')) {
          setErrorMsg("Credenciales incorrectas");
        } else if (errorMessage.includes('email not confirmed')) {
          setErrorMsg("Correo electrónico no confirmado");
        } else {
          setErrorMsg("Error al iniciar sesión. Por favor, verifica tus credenciales.");
        }
        setFormLoading(false);
        return;
      }
      
      // Verificar el rol del usuario antes de permitir el acceso
      if (result.data?.user?.id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, roles(*)')
          .eq('id', result.data.user.id)
          .single();
        
        if (profileError) {
          console.error('Error al obtener perfil:', profileError);
          setErrorMsg("Error al verificar las credenciales");
          setFormLoading(false);
          // Cerrar sesión si hay error
          await supabase.auth.signOut();
          return;
        }
        
        // Verificar si es admin o superadmin
        const roleName = profileData?.roles?.name?.toLowerCase();
        if (roleName === 'admin' || roleName === 'superadmin') {
          // Cerrar sesión inmediatamente
          await supabase.auth.signOut();
          setErrorMsg("Credenciales incorrectas");
          setFormLoading(false);
          return;
        }
        
        // Si llegamos aquí, es un usuario válido (partner o candidate)
        setLoginSuccess(true);
        
        // Capturar sesión de forma NO BLOQUEANTE
        captureSessionInfo()
          .then(sessionInfo => saveSessionToProfile(result.data.user.id, sessionInfo))
          .catch(sessionError => {
            console.warn('Error al guardar información de sesión:', sessionError);
          });
        
        // Redirigir al usuario
        router.replace("/request");
      }
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
      const digits = getUnformattedPhone(phoneNumber);
      
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
      if (error) {
        // Traducir mensajes de error de Supabase en el registro
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          throw new Error("El correo electrónico ya está registrado.");
        } else if (errorMessage.includes('password')) {
          throw new Error("La contraseña no cumple con los requisitos mínimos.");
        } else {
          throw new Error("Error al crear la cuenta. Por favor, intenta nuevamente.");
        }
      }

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

  if (loading || loginSuccess) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)] bg-surface-secondary py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">
          {loginSuccess ? "Inicio de sesión exitoso, redirigiendo..." : "Verificando sesión..."}
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-16rem)] bg-surface-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md sm:max-w-lg space-y-6">

        <AuthTabSwitch activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="bg-surface-primary p-6 sm:p-8 rounded-xl shadow-lg border border-neutral-200">
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
        </div>

        <div className="text-center">
          <p className="text-sm text-neutral-600">
            ¿Necesitas ayuda?{" "}
            <a href="/contact" className="font-medium text-brand-accent hover:text-brand-dark transition-colors">
              Contacta soporte técnico
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[calc(100vh-16rem)] bg-surface-secondary py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
