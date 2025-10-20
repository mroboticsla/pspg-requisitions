"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User, Building2, CheckCircle2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import PhoneInput, { composePhoneCountryValue } from "@/app/components/PhoneInput";

export default function RegisterPartnerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Personal, 2: Empresa (opcional)
  
  // Información personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(() => composePhoneCountryValue("MX", "+52"));
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Información de empresa (opcional)
  const [companyName, setCompanyName] = useState("");
  const [companyLegalName, setCompanyLegalName] = useState("");
  const [companyTaxId, setCompanyTaxId] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const industries = [
    "Tecnología",
    "Finanzas",
    "Salud",
    "Educación",
    "Manufactura",
    "Retail",
    "Servicios Profesionales",
    "Construcción",
    "Alimentos y Bebidas",
    "Otro"
  ];

  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden");
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFormLoading(true);

    try {
      const response = await fetch("/api/auth/register/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phoneCountry,
          phoneNumber,
          companyName: companyName || null,
          companyLegalName: companyLegalName || null,
          companyTaxId: companyTaxId || null,
          companyIndustry: companyIndustry || null,
          companyWebsite: companyWebsite || null,
          companyPhone: companyPhone || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la cuenta");
      }

      // Redirigir a login con mensaje de éxito
      router.push("/auth?success=true&message=" + encodeURIComponent("Cuenta creada exitosamente. Por favor, verifica tu correo e inicia sesión."));
      
    } catch (error: any) {
      setErrorMsg(error.message || "Error al crear la cuenta");
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-secondary via-white to-surface-secondary">
      <div className="grid lg:grid-cols-2 min-h-screen">
        
        {/* Panel izquierdo - Imagen hero */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:items-center bg-blue-600 p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-blue-800/80 z-10"></div>
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-700 to-blue-900"></div>

          <div className="relative z-20 text-white max-w-lg">
            <div className="mb-8">
              <Building2 className="h-16 w-16 mb-4" />
            </div>
            
            <h1 className="text-4xl font-bold mb-4">
              Cuenta Empresarial
            </h1>
            <p className="text-lg text-blue-100 mb-8">
              Crea tu cuenta empresarial y comienza a gestionar tus requisiciones de personal de manera eficiente.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Publicación ilimitada</h3>
                  <p className="text-sm text-blue-100">Publica todas las vacantes que necesites sin restricciones</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Panel de gestión completo</h3>
                  <p className="text-sm text-blue-100">Administra requisiciones, candidatos y procesos de contratación</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Base de datos de talento</h3>
                  <p className="text-sm text-blue-100">Acceso a nuestra base de candidatos cualificados</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div className="flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md space-y-6">
            
            {/* Logo móvil */}
            <div className="lg:hidden flex justify-center mb-8">
              <Image
                src="/logo.svg"
                alt="PSP Group Logo"
                width={80}
                height={80}
                className="h-16 w-auto"
              />
            </div>

            {/* Botón regresar */}
            <button
              onClick={() => step === 1 ? router.back() : setStep(1)}
              className="flex items-center gap-2 text-neutral-600 hover:text-brand-dark transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Regresar</span>
            </button>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`h-2 w-20 rounded-full transition-colors ${step >= 1 ? 'bg-blue-600' : 'bg-neutral-300'}`} />
              <div className={`h-2 w-20 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-neutral-300'}`} />
            </div>

            {/* Título */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-brand-dark mb-2">
                {step === 1 ? "Información Personal" : "Información de Empresa (Opcional)"}
              </h1>
              <p className="text-neutral-600">
                {step === 1 ? "Paso 1 de 2" : "Paso 2 de 2 - Puedes omitir este paso"}
              </p>
            </div>

            {/* Formulario */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-neutral-200">
              
              {/* Paso 1: Información Personal */}
              {step === 1 && (
                <form onSubmit={handleStep1Continue} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-semibold text-neutral-700 mb-2">
                        Nombre*
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-semibold text-neutral-700 mb-2">
                        Apellido*
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Correo Electrónico*
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-neutral-400" />
                      </span>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="tu@empresa.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Teléfono*
                    </label>
                    <PhoneInput
                      phoneCountry={phoneCountry}
                      phoneNumber={phoneNumber}
                      onCountryChange={setPhoneCountry}
                      onNumberChange={setPhoneNumber}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Contraseña*
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-neutral-400" />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Mínimo 8 caracteres"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-700"
                      >
                        {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Confirmar Contraseña*
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-neutral-400" />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-300">
                      <p className="text-sm text-red-800">{errorMsg}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02]"
                  >
                    Continuar
                  </button>
                </form>
              )}

              {/* Paso 2: Información de Empresa */}
              {step === 2 && (
                <form onSubmit={handleFinalSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Nombre de la Empresa
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-neutral-400" />
                      </span>
                      <input
                        type="text"
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Mi Empresa S.A."
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="companyLegalName" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Razón Social
                    </label>
                    <input
                      type="text"
                      id="companyLegalName"
                      value={companyLegalName}
                      onChange={(e) => setCompanyLegalName(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="companyTaxId" className="block text-sm font-semibold text-neutral-700 mb-2">
                      RFC
                    </label>
                    <input
                      type="text"
                      id="companyTaxId"
                      value={companyTaxId}
                      onChange={(e) => setCompanyTaxId(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="ABC123456XYZ"
                      maxLength={13}
                    />
                  </div>

                  <div>
                    <label htmlFor="companyIndustry" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Industria
                    </label>
                    <select
                      id="companyIndustry"
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option value="">Selecciona una industria</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="companyWebsite" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      id="companyWebsite"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="https://www.miempresa.com"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-300">
                      <p className="text-sm text-red-800">{errorMsg}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        // Omitir datos de empresa y crear cuenta directamente
                        await handleFinalSubmit(new Event('submit') as any);
                      }}
                      disabled={formLoading}
                      className="flex-1 py-3 px-4 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold rounded-lg transition-all"
                    >
                      Omitir
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {formLoading ? "Creando cuenta..." : "Crear Cuenta"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Info adicional */}
            <div className="text-center">
              <p className="text-sm text-neutral-600">
                ¿Ya tienes una cuenta?{" "}
                <a href="/auth" className="font-medium text-brand-accent hover:text-brand-dark transition-colors">
                  Inicia sesión
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
