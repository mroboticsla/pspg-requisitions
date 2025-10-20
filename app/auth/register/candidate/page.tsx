"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Briefcase, CheckCircle2, ArrowLeft } from "lucide-react";
import Image from "next/image";
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
    <div className="min-h-screen bg-gradient-to-br from-surface-secondary via-white to-surface-secondary">
      <div className="grid lg:grid-cols-2 min-h-screen">
        
        {/* Panel izquierdo - Imagen hero */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:items-center bg-green-600 p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/90 to-green-800/80 z-10"></div>
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-green-700 to-green-900"></div>

          <div className="relative z-20 text-white max-w-lg">
            <div className="mb-8">
              <Briefcase className="h-16 w-16 mb-4" />
            </div>
            
            <h1 className="text-4xl font-bold mb-4">
              Bolsa de Empleo
            </h1>
            <p className="text-lg text-green-100 mb-8">
              Crea tu perfil profesional y accede a oportunidades laborales exclusivas en empresas líderes.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Ofertas exclusivas</h3>
                  <p className="text-sm text-green-100">Accede a vacantes de empresas verificadas</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Aplicación rápida</h3>
                  <p className="text-sm text-green-100">Aplica a múltiples vacantes con un solo perfil</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Seguimiento completo</h3>
                  <p className="text-sm text-green-100">Monitorea el estado de tus aplicaciones</p>
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
              onClick={() => router.back()}
              className="flex items-center gap-2 text-neutral-600 hover:text-brand-dark transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Regresar</span>
            </button>

            {/* Título */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-brand-dark mb-2">
                Crear Cuenta de Candidato
              </h1>
              <p className="text-neutral-600">
                Completa tu perfil para acceder a la bolsa de empleo
              </p>
            </div>

            {/* Formulario */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-neutral-200">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Información Personal */}
                <div className="border-b pb-4 mb-4">
                  <h3 className="font-semibold text-brand-dark mb-3">Información Personal*</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-semibold text-neutral-700 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
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
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Correo Electrónico
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
                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="tu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      Teléfono
                    </label>
                    <PhoneInput
                      phoneCountry={phoneCountry}
                      phoneNumber={phoneNumber}
                      onCountryChange={setPhoneCountry}
                      onNumberChange={setPhoneNumber}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Contraseña
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
                        className="w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
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
                      Confirmar Contraseña
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
                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Información Profesional (Opcional) */}
                <div>
                  <h3 className="font-semibold text-brand-dark mb-3">
                    Información Profesional <span className="text-sm text-neutral-500 font-normal">(Opcional)</span>
                  </h3>
                  
                  <div className="mb-4">
                    <label htmlFor="jobTitle" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Título/Profesión Actual
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-neutral-400" />
                      </span>
                      <input
                        type="text"
                        id="jobTitle"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        placeholder="Ej: Desarrollador Full Stack"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="experienceLevel" className="block text-sm font-semibold text-neutral-700 mb-2">
                      Nivel de Experiencia
                    </label>
                    <select
                      id="experienceLevel"
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="">Selecciona un nivel</option>
                      {experienceLevels.map((level) => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="linkedinUrl" className="block text-sm font-semibold text-neutral-700 mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      id="linkedinUrl"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      placeholder="https://www.linkedin.com/in/tu-perfil"
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
                  disabled={formLoading}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {formLoading ? "Creando cuenta..." : "Crear Cuenta"}
                </button>
              </form>
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
