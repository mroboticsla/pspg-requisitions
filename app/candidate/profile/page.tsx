"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { supabase } from "../../../lib/supabaseClient";
import { Eye, EyeOff } from "lucide-react";
import PhoneInput, { COUNTRY_CODES, getUnformattedPhone, formatPhoneNumber, composePhoneCountryValue, parsePhoneCountryValue, getCountryByValue } from "../../components/PhoneInput";
import SessionHistory from "../../components/SessionHistory";
import { SessionMetadata } from "../../../lib/sessionTracking";

export default function CandidateProfilePage() {
  const { user, profile, loading } = useAuth();
  
  const [activeSection, setActiveSection] = useState<'personal' | 'security' | 'activity'>('personal');

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phoneCountry: composePhoneCountryValue("MX", "+52"),
    phoneNumber: "",
    email: "",
    currentPassword: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata | null>(null);

  // Cargar datos del perfil cuando estén disponibles
  useEffect(() => {
    if (profile && user) {
      // Separar el código de país del número de teléfono
      const phone = profile.phone || "";
      let countryCode = "+52";
      let number = "";
      
      if (phone) {
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

      const formattedNumber = number ? formatPhoneNumber(number, phoneCountryValue) : "";
      
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phoneCountry: phoneCountryValue,
        phoneNumber: formattedNumber,
        email: user?.email || "",
        currentPassword: "",
      });
      
      setSessionMetadata(profile.metadata || null);
    }
  }, [profile, user]);

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

      const phoneDigits = getUnformattedPhone(formData.phoneNumber);
      const { dialCode } = parsePhoneCountryValue(formData.phoneCountry);
      const phonePrefix = dialCode || formData.phoneCountry;
      const fullPhone = `${phonePrefix}${phoneDigits}`.trim();

      const countryConfig = getCountryByValue(formData.phoneCountry);
      if (countryConfig && phoneDigits.length !== countryConfig.length) {
        throw new Error(`El número de teléfono debe tener ${countryConfig.length} dígitos para ${countryConfig.name}`);
      }

      // Actualizar perfil
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
      }

      setMessage({
        type: "success",
        text: "Perfil actualizado exitosamente.",
      });

      setFormData((prev) => ({ ...prev, currentPassword: "" }));

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona tu información personal y configuración de seguridad
        </p>
      </div>

      {/* Navegación de pestañas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveSection('personal')}
            className={`flex-1 whitespace-nowrap py-4 px-6 text-center text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'personal'
                ? 'border-brand-accent text-brand-dark bg-brand-light/10'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Información Personal
          </button>
          <button
            onClick={() => setActiveSection('security')}
            className={`flex-1 whitespace-nowrap py-4 px-6 text-center text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'security'
                ? 'border-brand-accent text-brand-dark bg-brand-light/10'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Seguridad
          </button>
          <button
            onClick={() => setActiveSection('activity')}
            className={`flex-1 whitespace-nowrap py-4 px-6 text-center text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'activity'
                ? 'border-brand-accent text-brand-dark bg-brand-light/10'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Actividad
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {activeSection === 'personal' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Información Personal</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Actualiza tu información básica de contacto.
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {message && (
                  <div
                    className={`p-4 rounded-md ${
                      message.type === "success"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                      Apellido
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <PhoneInput
                    phoneCountry={formData.phoneCountry}
                    phoneNumber={formData.phoneNumber}
                    onCountryChange={(value: string) =>
                      setFormData((prev) => ({ ...prev, phoneCountry: value }))
                    }
                    onNumberChange={(value: string) =>
                      setFormData((prev) => ({ ...prev, phoneNumber: value }))
                    }
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Para cambiar tu correo, contacta al administrador.
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Confirmar cambios
                  </h4>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      placeholder="Ingresa tu contraseña actual"
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-accent focus:border-brand-accent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-brand-dark text-white rounded-md hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === 'security' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Seguridad de la Cuenta</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Gestiona la contraseña y seguridad de tu cuenta.
                </p>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Contraseña</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        ••••••••••
                      </p>
                    </div>
                    <button
                      onClick={() => window.location.href = '/change-password'}
                      className="px-4 py-2 text-sm font-medium text-brand-dark border border-brand-dark rounded-md hover:bg-brand-light transition-colors"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Consejo de Seguridad:</strong> Usa una contraseña única y segura. 
                    Combina mayúsculas, minúsculas, números y símbolos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'activity' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Historial de Actividad</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Revisa tus sesiones y actividad reciente.
                </p>
              </div>

              <SessionHistory 
                sessionHistory={sessionMetadata?.sessionHistory || []} 
                currentSession={sessionMetadata?.currentSession}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
