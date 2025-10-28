"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Briefcase, CheckCircle2, ArrowLeft } from "lucide-react";
import PhoneInput, { composePhoneCountryValue } from "@/app/components/PhoneInput";

export default function RegisterCandidatePage() {
  const router = useRouter();
  
  // Información personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(() => composePhoneCountryValue("MX", "+52"));
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Información profesional (opcional)
  const [jobTitle, setJobTitle] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const experienceLevels = [
    { value: "junior", label: "Junior (0-2 años)" },
    { value: "mid", label: "Mid (3-5 años)" },
    { value: "senior", label: "Senior (6-10 años)" },
    { value: "expert", label: "Expert (10+ años)" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
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

    setFormLoading(true);

    try {
      const response = await fetch("/api/auth/register/candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phoneCountry,
          phoneNumber,
          jobTitle: jobTitle || null,
          experienceLevel: experienceLevel || null,
          linkedinUrl: linkedinUrl || null
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
    <div className="min-h-screen bg-surface-secondary py-6 sm:py-12">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Beneficios en móvil - Versión compacta */}
        <div className="lg:hidden mb-4 sm:mb-6 bg-surface-primary rounded-xl p-4 sm:p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="h-8 w-8 text-brand-dark flex-shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-brand-dark">Bolsa de Empleo</h1>
              <p className="text-xs text-neutral-600">Accede a oportunidades laborales</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-dark flex-shrink-0" />
              <p className="text-xs text-neutral-700">Ofertas laborales exclusivas</p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-dark flex-shrink-0" />
              <p className="text-xs text-neutral-700">Aplicación rápida a vacantes</p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-dark flex-shrink-0" />
              <p className="text-xs text-neutral-700">Seguimiento de aplicaciones</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-12">
          
          {/* Panel izquierdo - Beneficios (visible en desktop) */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-24">
              <div className="mb-6">
                <Briefcase className="h-12 w-12 text-brand-dark mb-4" />
              </div>
              
              <h1 className="text-3xl font-bold text-brand-dark mb-3">
                Bolsa de Empleo
              </h1>
              <p className="text-neutral-600 mb-8">
                Accede a oportunidades laborales exclusivas y crea tu perfil profesional.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-brand-dark/10 p-2 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-brand-dark" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark">Ofertas exclusivas</h3>
                    <p className="text-sm text-neutral-600">Accede a vacantes de empresas verificadas</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-brand-dark/10 p-2 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-brand-dark" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark">Aplicación rápida</h3>
                    <p className="text-sm text-neutral-600">Aplica a múltiples vacantes con un solo perfil</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-brand-dark/10 p-2 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-brand-dark" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark">Seguimiento completo</h3>
                    <p className="text-sm text-neutral-600">Monitorea el estado de tus aplicaciones</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel derecho - Formulario */}
          <div className="lg:col-span-3 min-w-0">
            <div className="w-full space-y-3 sm:space-y-4">
              
              {/* Título */}
              <div className="text-center mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-dark mb-1">
                  Crear Cuenta de Candidato
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600">
                  Completa tu información para acceder a la bolsa de empleo
                </p>
              </div>

              {/* Formulario */}
              <div className="bg-surface-primary p-4 sm:p-6 lg:p-8 rounded-lg sm:rounded-xl shadow-lg border border-neutral-200">
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  
                  {/* Información Personal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <label htmlFor="firstName" className="block text-sm font-semibold text-neutral-700 mb-2">
                        Nombre*
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark text-sm sm:text-base"
                        required
                      />
                    </div>

                    <div className="min-w-0">
                      <label htmlFor="lastName" className="block text-sm font-semibold text-neutral-700 mb-2">
                        Apellido*
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Correo Electrónico*
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400" />
                      </span>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark text-sm sm:text-base"
                        placeholder="tu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Teléfono*
                    </label>
                    <div className="w-full">
                      <PhoneInput
                        phoneCountry={phoneCountry}
                        phoneNumber={phoneNumber}
                        onCountryChange={setPhoneCountry}
                        onNumberChange={setPhoneNumber}
                        required
                        className="border-neutral-300 bg-surface-secondary w-full"
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Contraseña*
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400" />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark text-sm sm:text-base"
                        placeholder="Mínimo 8 caracteres"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-700"
                      >
                        {showPassword ? <Eye className="h-4 w-4 sm:h-5 sm:w-5" /> : <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Confirmar Contraseña*
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400" />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>

                  {/* Separador */}
                  <div className="border-t border-neutral-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
                    <h3 className="font-semibold text-brand-dark mb-3 text-sm sm:text-base">
                      Información Profesional <span className="text-xs sm:text-sm text-neutral-500 font-normal">(Opcional)</span>
                    </h3>
                  
                    <div className="space-y-3 sm:space-y-4">
                      <div className="min-w-0">
                        <label htmlFor="jobTitle" className="block text-sm font-semibold text-neutral-700 mb-2">
                          Título/Profesión Actual
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400" />
                          </span>
                          <input
                            type="text"
                            id="jobTitle"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark text-sm sm:text-base"
                            placeholder="Ej: Desarrollador Full Stack"
                          />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <label htmlFor="experienceLevel" className="block text-sm font-semibold text-neutral-700 mb-2">
                          Nivel de Experiencia
                        </label>
                        <select
                          id="experienceLevel"
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark text-sm sm:text-base"
                        >
                          <option value="">Selecciona un nivel</option>
                          {experienceLevels.map((level) => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="min-w-0">
                        <label htmlFor="linkedinUrl" className="block text-sm font-semibold text-neutral-700 mb-2">
                          LinkedIn
                        </label>
                        <input
                          type="url"
                          id="linkedinUrl"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark text-sm sm:text-base"
                          placeholder="https://www.linkedin.com/in/tu-perfil"
                        />
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-300">
                      <p className="text-sm text-red-800">{errorMsg}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full py-3 px-4 bg-brand-dark hover:bg-brand-dark/90 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading ? "Creando cuenta..." : "Crear Cuenta"}
                  </button>
                </form>
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
