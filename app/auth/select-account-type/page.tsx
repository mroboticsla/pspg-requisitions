"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Briefcase, ArrowRight, Check } from "lucide-react";
import Image from "next/image";

interface AccountType {
  id: "partner" | "candidate";
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  features: string[];
  color: string;
  hoverColor: string;
  borderColor: string;
  textColor: string;
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
        "Reportes y análisis de contratación",
        "Gestión de múltiples empresas"
      ],
      color: "bg-blue-600",
      hoverColor: "hover:bg-blue-50",
      borderColor: "border-blue-500",
      textColor: "text-blue-600",
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
        "Notificaciones de nuevas oportunidades",
        "Seguimiento de aplicaciones"
      ],
      color: "bg-green-600",
      hoverColor: "hover:bg-green-50",
      borderColor: "border-green-500",
      textColor: "text-green-600",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-secondary via-white to-surface-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.svg"
              alt="PSP Group Logo"
              width={80}
              height={80}
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-brand-dark mb-4">
            Elige el tipo de cuenta
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Selecciona la opción que mejor se adapte a tus necesidades. Podrás gestionar tu perfil completo después del registro.
          </p>
        </div>

        {/* Account Type Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {accountTypes.map((account) => {
            const Icon = account.icon;
            const isSelected = selectedType === account.id;

            return (
              <button
                key={account.id}
                onClick={() => setSelectedType(account.id)}
                className={`relative group text-left p-8 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl ${
                  isSelected
                    ? `${account.borderColor} bg-white shadow-xl ring-4 ring-opacity-50`
                    : `border-neutral-200 bg-white ${account.hoverColor}`
                }`}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className={`absolute top-4 right-4 ${account.color} text-white rounded-full p-2`}>
                    <Check className="h-5 w-5" />
                  </div>
                )}

                {/* Icon */}
                <div className={`inline-flex p-4 rounded-xl mb-6 ${account.color} bg-opacity-10`}>
                  <Icon className={`h-10 w-10 ${account.textColor}`} />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-brand-dark mb-2">
                  {account.title}
                </h3>
                <p className={`text-sm font-medium mb-4 ${account.textColor}`}>
                  {account.subtitle}
                </p>

                {/* Description */}
                <p className="text-neutral-600 mb-6 leading-relaxed">
                  {account.description}
                </p>

                {/* Features */}
                <div className="space-y-3">
                  {account.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex-shrink-0 ${account.color} bg-opacity-10 rounded-full p-1`}>
                        <Check className={`h-4 w-4 ${account.textColor}`} />
                      </div>
                      <span className="text-sm text-neutral-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Hover effect overlay */}
                <div className={`absolute inset-0 rounded-2xl ${account.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedType}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform ${
              selectedType
                ? "bg-brand-accent text-white hover:bg-brand-dark hover:scale-[1.05] shadow-lg hover:shadow-xl"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            }`}
          >
            Continuar
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Back to login */}
        <div className="text-center mt-8">
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
