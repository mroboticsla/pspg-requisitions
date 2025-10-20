"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Briefcase, ArrowRight, Check, ChevronRight } from "lucide-react";

interface AccountType {
  id: "partner" | "candidate";
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  features: string[];
  color: string;
  bgGradient: string;
  iconBg: string;
  route: string;
}

export default function SelectAccountTypePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<"partner" | "candidate" | null>(null);

  const accountTypes: AccountType[] = [
    {
      id: "partner",
      title: "Cuenta Empresarial",
      subtitle: "Para empresas asociadas",
      description: "Publica vacantes, gestiona requisiciones y encuentra el talento ideal para tu organización.",
      icon: Building2,
      features: [
        "Publicación ilimitada de vacantes",
        "Panel de gestión de requisiciones",
        "Acceso a base de datos de candidatos",
        "Reportes y análisis",
      ],
      color: "brand-dark",
      bgGradient: "from-brand-dark/10 via-brand-dark/5 to-transparent",
      iconBg: "bg-brand-dark/10",
      route: "/auth/register/partner"
    },
    {
      id: "candidate",
      title: "Bolsa de Empleo",
      subtitle: "Para candidatos",
      description: "Accede a oportunidades laborales exclusivas, crea tu perfil profesional y aplica a vacantes.",
      icon: Briefcase,
      features: [
        "Acceso a bolsa de trabajo exclusiva",
        "Perfil profesional personalizado",
        "Aplicación rápida a vacantes",
        "Seguimiento de aplicaciones",
      ],
      color: "brand-accent",
      bgGradient: "from-brand-accent/10 via-brand-accent/5 to-transparent",
      iconBg: "bg-brand-accent/10",
      route: "/auth/register/candidate"
    }
  ];

  const handleContinue = () => {
    if (!selectedType) return;
    const account = accountTypes.find(acc => acc.id === selectedType);
    if (account) {
      router.push(account.route);
    }
  };

  const handleCardClick = (type: "partner" | "candidate") => {
    // En móvil: solo expandir/colapsar la tarjeta
    if (window.innerWidth < 768) {
      setSelectedType(selectedType === type ? null : type);
    } else {
      // En desktop: seleccionar directamente
      setSelectedType(type);
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-3 sm:mb-4">
            Elige el tipo de cuenta
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto mb-4">
            Selecciona la opción que mejor se adapte a tus necesidades.
          </p>
          
          {/* Indicador de flujo en móvil */}
          <div className="md:hidden bg-brand-accent/10 border border-brand-accent/20 rounded-lg p-3 max-w-sm mx-auto">
            <div className="flex items-center justify-center gap-2 text-sm text-brand-dark">
              <div className="bg-brand-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <span className="font-medium">Toca una tarjeta para continuar</span>
            </div>
          </div>
        </div>

        {/* Account Type Cards */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {accountTypes.map((account) => {
            const Icon = account.icon;
            const isSelected = selectedType === account.id;

            return (
              <div
                key={account.id}
                className={`relative group rounded-xl sm:rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                  isSelected
                    ? `border-${account.color} shadow-xl`
                    : `border-neutral-200 hover:border-${account.color}/30 hover:shadow-lg`
                }`}
              >
                {/* Fondo con gradiente de color */}
                <div className={`absolute inset-0 bg-gradient-to-br ${account.bgGradient} ${isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'} transition-opacity duration-300`} />
                
                {/* Contenido de la tarjeta */}
                <button
                  onClick={() => handleCardClick(account.id)}
                  className="relative w-full text-left p-5 sm:p-8 transition-transform duration-200 active:scale-[0.98]"
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className={`absolute top-3 right-3 sm:top-4 sm:right-4 bg-${account.color} text-white rounded-full p-1.5 sm:p-2 shadow-lg z-10`}>
                      <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`inline-flex p-3 sm:p-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6 ${account.iconBg} backdrop-blur-sm`}>
                    <Icon className={`h-8 w-8 sm:h-10 sm:w-10 text-${account.color}`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl sm:text-2xl font-bold text-brand-dark mb-1 sm:mb-2">
                    {account.title}
                  </h3>
                  <p className={`text-xs sm:text-sm font-medium mb-3 sm:mb-4 text-${account.color}`}>
                    {account.subtitle}
                  </p>

                  {/* Description - Visible en desktop siempre, en móvil solo cuando está seleccionada */}
                  <p className={`text-sm sm:text-base text-neutral-700 mb-4 sm:mb-6 leading-relaxed ${!isSelected && 'hidden md:block'}`}>
                    {account.description}
                  </p>

                  {/* Features - Visible en desktop siempre, en móvil solo cuando está seleccionada */}
                  <div className={`space-y-2 sm:space-y-3 ${!isSelected && 'hidden md:block'}`}>
                    {account.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2 sm:gap-3">
                        <div className={`mt-0.5 flex-shrink-0 ${account.iconBg} rounded-full p-1 backdrop-blur-sm`}>
                          <Check className={`h-3 w-3 sm:h-4 sm:w-4 text-${account.color}`} />
                        </div>
                        <span className="text-xs sm:text-sm text-neutral-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mobile: Show arrow when not selected */}
                  {!isSelected && (
                    <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2">
                      <ChevronRight className={`h-6 w-6 text-${account.color}`} />
                    </div>
                  )}
                </button>

                {/* Botón Continuar - Solo visible en móvil cuando está seleccionada */}
                {isSelected && (
                  <div className="md:hidden relative px-5 pb-5">
                    <button
                      onClick={handleContinue}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white bg-${account.color} hover:opacity-90 active:scale-95 transition-all shadow-md`}
                    >
                      Continuar
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Continue Button - Desktop */}
        <div className="hidden md:flex justify-center mb-8">
          <button
            onClick={handleContinue}
            disabled={!selectedType}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform ${
              selectedType
                ? "bg-brand-accent text-white hover:bg-brand-accentDark hover:scale-[1.05] shadow-lg hover:shadow-xl"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            }`}
          >
            Continuar
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Back to login */}
        <div className="text-center">
          <p className="text-sm text-neutral-600">
            ¿Ya tienes una cuenta?{" "}
            <a
              href="/auth"
              className="font-medium text-brand-accent hover:text-brand-dark transition-colors"
            >
              Inicia sesión aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
