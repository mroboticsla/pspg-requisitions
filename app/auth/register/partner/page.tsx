"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Building2, CheckCircle2, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-surface-secondary py-8 sm:py-12 px-4">
      <div className="w-full max-w-5xl mx-auto">
        
        {/* Beneficios en móvil - Versión compacta */}
        <div className="lg:hidden mb-6 bg-surface-primary rounded-xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-8 w-8 text-brand-accent flex-shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-brand-dark">Cuenta Empresarial</h1>
              <p className="text-xs text-neutral-600">Gestiona tus requisiciones</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-accent flex-shrink-0" />
              <p className="text-xs text-neutral-700">Publicación ilimitada de vacantes</p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-accent flex-shrink-0" />
              <p className="text-xs text-neutral-700">Panel de gestión completo</p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-accent flex-shrink-0" />
              <p className="text-xs text-neutral-700">Acceso a base de talento</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Panel izquierdo - Beneficios (visible en desktop) */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-24">
              <div className="mb-6">
                <Building2 className="h-12 w-12 text-brand-accent mb-4" />
              </div>
              
              <h1 className="text-3xl font-bold text-brand-dark mb-3">
                Cuenta Empresarial
              </h1>
              <p className="text-neutral-600 mb-8">
                Gestiona tus requisiciones de personal de manera eficiente.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-brand-accent/10 p-2 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-brand-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark">Publicación ilimitada</h3>
                    <p className="text-sm text-neutral-600">Publica todas las vacantes que necesites</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-brand-accent/10 p-2 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-brand-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark">Panel de gestión</h3>
                    <p className="text-sm text-neutral-600">Administra candidatos y procesos</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-brand-accent/10 p-2 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-brand-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark">Base de talento</h3>
                    <p className="text-sm text-neutral-600">Acceso a candidatos cualificados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel derecho - Formulario */}
          <div className="lg:col-span-3">
            <div className="w-full space-y-4">
              
              {/* Botón regresar */}
              <button
                onClick={() => step === 1 ? router.back() : setStep(1)}
                className="flex items-center gap-2 text-neutral-600 hover:text-brand-dark transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Regresar</span>
              </button>

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={`h-2 flex-1 max-w-[80px] rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-brand-accent' : 'bg-neutral-300'}`} />
                <div className={`h-2 flex-1 max-w-[80px] rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-brand-accent' : 'bg-neutral-300'}`} />
              </div>

              {/* Título */}
              <div className="text-center mb-4">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-dark mb-1">
                  {step === 1 ? "Información Personal" : "Información de Empresa"}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600">
                  {step === 1 ? "Paso 1 de 2" : "Paso 2 de 2 (Opcional)"}
                </p>
              </div>

              {/* Formulario */}
              <div className="bg-surface-primary p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg border border-neutral-200">
                
                {/* Paso 1: Información Personal */}
                {step === 1 && (
                  <form onSubmit={handleStep1Continue} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-semibold text-neutral-700 mb-2">
                          Nombre*
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
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
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
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
                          <Mail className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                        </span>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
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
                        className="border-neutral-300 bg-surface-secondary"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
                        Contraseña*
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
                          placeholder="Mínimo 8 caracteres"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-700 focus:outline-none"
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
                          <Lock className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                        </span>
                        <input
                          type={showPassword ? "text" : "password"}
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
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
                      className="w-full py-3 px-4 bg-brand-accent hover:bg-brand-accentDark text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-sm"
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
                          <Building2 className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                        </span>
                        <input
                          type="text"
                          id="companyName"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
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
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
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
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
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
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
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
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
                        placeholder="https://www.miempresa.com"
                      />
                    </div>

                    {errorMsg && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-300">
                        <p className="text-sm text-red-800">{errorMsg}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await handleFinalSubmit(new Event('submit') as any);
                        }}
                        disabled={formLoading}
                        className="flex-1 py-3 px-4 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Omitir
                      </button>
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="flex-1 py-3 px-4 bg-brand-accent hover:bg-brand-accentDark text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
                      >
                        {formLoading ? "Creando cuenta..." : "Crear Cuenta"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Info adicional */}
              <div className="text-center pt-4">
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
    </div>
  );
}
