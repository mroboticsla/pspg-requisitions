"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Unlock } from "lucide-react";
import PhoneInput, { COUNTRY_CODES, getUnformattedPhone, formatPhoneNumber, composePhoneCountryValue, parsePhoneCountryValue, getCountryByValue } from "../components/PhoneInput";
import SessionHistory from "../components/SessionHistory";
import { SessionMetadata } from "../../lib/sessionTracking";
import AvatarUpload from "../components/AvatarUpload";

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phoneCountry: composePhoneCountryValue("MX", "+52"),
    phoneNumber: "",
    email: "",
    currentPassword: "",
  });
  
  const [isEmailUnlocked, setIsEmailUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Función para cargar el avatar desde user_metadata
  const loadAvatarUrl = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('user_metadata')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!error && data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error al cargar avatar:', error);
    }
  }, [user?.id]);

  // Cargar datos del perfil cuando estén disponibles
  useEffect(() => {
    if (profile && user) {
      // Separar el código de país del número de teléfono
      const phone = profile.phone || "";
      let countryCode = "+52";
      let number = "";
      
      if (phone) {
        // Buscar el código de país en el teléfono
        const codes = Array.from(new Set(COUNTRY_CODES.map(c => c.code))).sort((a, b) => b.length - a.length);
        for (const code of codes) {
          if (phone.startsWith(code)) {
            countryCode = code;
            number = phone.substring(code.length);
            break;
          }
        }
      }
      
      const selectedCountry = getCountryByValue(countryCode);
      const phoneCountryValue = selectedCountry
        ? composePhoneCountryValue(selectedCountry.country, selectedCountry.code)
        : countryCode;

      // Aplicar formato al número cargado desde la BD
      const formattedNumber = number ? formatPhoneNumber(number, phoneCountryValue) : "";
      
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phoneCountry: phoneCountryValue,
        phoneNumber: formattedNumber,
        email: user?.email || "",
        currentPassword: "",
      });
      
      // Cargar metadata de sesión
      setSessionMetadata(profile.metadata || null);
      
      // Cargar avatar URL desde user_metadata
      loadAvatarUrl();
    }
  }, [profile, user, loadAvatarUrl]);

  // Callback para cuando se actualiza el avatar
  const handleAvatarUpdate = (newAvatarUrl: string) => {
    // Si la URL está vacía, significa que se eliminó el avatar
    if (!newAvatarUrl || newAvatarUrl === '') {
      setAvatarUrl(null);
    } else {
      setAvatarUrl(newAvatarUrl);
    }
    
    // Forzar recarga del avatar en otros componentes
    // Esto se propagará a través del contexto de autenticación
    window.dispatchEvent(new CustomEvent('avatar-updated', { 
      detail: { avatarUrl: newAvatarUrl } 
    }));
  };

  // Redireccionar si no hay usuario autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      // Validar que se haya ingresado la contraseña actual
      if (!formData.currentPassword) {
        throw new Error("Debes ingresar tu contraseña actual para guardar los cambios");
      }

      // Verificar la contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: formData.currentPassword,
      });

      if (signInError) {
        throw new Error("La contraseña actual es incorrecta");
      }

    // Construir el teléfono completo (solo dígitos)
    const phoneDigits = getUnformattedPhone(formData.phoneNumber);
    const { dialCode } = parsePhoneCountryValue(formData.phoneCountry);
    const phonePrefix = dialCode || formData.phoneCountry;
    const fullPhone = `${phonePrefix}${phoneDigits}`.trim();

      // Validar longitud del teléfono según el código de país
    const countryConfig = getCountryByValue(formData.phoneCountry);
      if (countryConfig && phoneDigits.length !== countryConfig.length) {
        throw new Error(`El número de teléfono debe tener ${countryConfig.length} dígitos para ${countryConfig.name}`);
      }

      // Actualizar perfil en la tabla profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: fullPhone,
        })
        .eq("id", user?.id);

      if (profileError) throw profileError;

      // Actualizar display_name en auth.users
      const displayName = `${formData.first_name} ${formData.last_name}`.trim();
      const { error: updateUserError } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          first_name: formData.first_name,
          last_name: formData.last_name,
        },
      });

      if (updateUserError) {
        console.error("Error al actualizar display_name:", updateUserError);
        // No lanzamos error aquí porque el perfil ya se actualizó
      }

      // Si se cambió el email y está desbloqueado, actualizar en auth
      if (isEmailUnlocked && formData.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });

        if (emailError) throw emailError;

        setMessage({
          type: "success",
          text: "Perfil actualizado. Se ha enviado un correo de confirmación a tu nueva dirección.",
        });
        setIsEmailUnlocked(false);
      } else {
        setMessage({
          type: "success",
          text: "Perfil actualizado exitosamente.",
        });
      }

      // Limpiar la contraseña del formulario
      setFormData((prev) => ({ ...prev, currentPassword: "" }));

      // Recargar la página después de un momento para actualizar el contexto
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);
      setMessage({
        type: "error",
        text: error.message || "Error al actualizar el perfil. Intenta de nuevo.",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="mt-2 text-sm text-gray-600">
            Actualiza tu información personal y preferencias de cuenta
          </p>
        </div>

        {/* Tarjeta de perfil */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Avatar y nombre */}
          <div className="bg-gradient-to-r from-brand-dark to-brand-accent px-6 py-8">
            <div className="flex items-start gap-6">
              {/* Avatar con opción de editar */}
              <div className="flex-shrink-0">
                {user && (
                  <AvatarUpload 
                    user={user}
                    currentAvatarUrl={avatarUrl}
                    onAvatarUpdate={handleAvatarUpdate}
                  />
                )}
              </div>
              
              {/* Información del usuario */}
              <div className="flex-1 min-w-0 pt-2">
                <h2 className="text-2xl font-bold text-white truncate">
                  {formData.first_name || formData.last_name
                    ? `${formData.first_name} ${formData.last_name}`.trim()
                    : "Usuario"}
                </h2>
                <p className="text-white/80 mt-1 truncate">{formData.email}</p>
                <div className="mt-3 flex items-center gap-2 text-white/70 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">Pasa el cursor sobre tu foto para cambiarla o eliminarla</span>
                  <span className="sm:hidden">Toca tu foto para editarla</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Mensajes */}
            {message && (
              <div
                className={`p-4 rounded-md ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    {message.type === "success" ? (
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{message.text}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Campos del formulario */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-accent focus:border-brand-accent"
                  placeholder="Juan"
                  required
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-accent focus:border-brand-accent"
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo Electrónico
                </label>
                <button
                  type="button"
                  onClick={() => setIsEmailUnlocked(!isEmailUnlocked)}
                  className="flex items-center space-x-1 text-xs text-brand-dark hover:text-brand-accent transition-colors"
                >
                  {isEmailUnlocked ? (
                    <>
                      <Unlock className="h-3 w-3" />
                      <span>Bloquear</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      <span>Desbloquear correo</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly={!isEmailUnlocked}
                  className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-brand-accent focus:border-brand-accent ${
                    !isEmailUnlocked ? "bg-gray-50 cursor-not-allowed" : ""
                  }`}
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>
              {isEmailUnlocked && (
                <p className="mt-1 text-xs text-orange-600 font-medium">
                  ⚠️ Si cambias tu correo, recibirás un mensaje de confirmación en la nueva dirección y deberás verificarlo.
                </p>
              )}
              {!isEmailUnlocked && (
                <p className="mt-1 text-xs text-gray-500">
                  El correo está bloqueado para prevenir cambios accidentales. Haz clic en &quot;Desbloquear&quot; para editarlo.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <PhoneInput
                phoneCountry={formData.phoneCountry}
                phoneNumber={formData.phoneNumber}
                onCountryChange={(value) => setFormData((prev) => ({ ...prev, phoneCountry: value }))}
                onNumberChange={(value) => setFormData((prev) => ({ ...prev, phoneNumber: value }))}
                required
                placeholder="1234567890"
                className="border-gray-300 bg-white"
              />
            </div>

            {/* Separador de seguridad */}
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Lock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Verificación de seguridad</h3>
                    <p className="mt-1 text-xs text-yellow-700">
                      Por tu seguridad, debes ingresar tu contraseña actual para guardar cualquier cambio en tu perfil.
                    </p>
                  </div>
                </div>
              </div>

              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña Actual <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-brand-accent focus:border-brand-accent"
                  placeholder="Ingresa tu contraseña actual"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                ¿Quieres cambiar tu contraseña?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/change-password")}
                  className="text-brand-dark hover:text-brand-accent font-medium"
                >
                  Haz clic aquí
                </button>
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-dark border border-transparent rounded-md hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Cambios</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Información importante</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Los cambios en tu perfil se reflejarán en todo el sistema.</li>
                  <li>Tu correo electrónico se utiliza para iniciar sesión y recibir notificaciones.</li>
                  <li>Mantén tu información actualizada para un mejor servicio.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Historial de Sesiones */}
        <div className="mt-8">
          <SessionHistory 
            sessionHistory={sessionMetadata?.sessionHistory} 
            currentSession={sessionMetadata?.currentSession}
          />
        </div>
      </div>
    </div>
  );
}
