"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";

interface AuthTabSwitchProps {
  activeTab: "login" | "register";
  onTabChange: (tab: "login" | "register") => void;
}

export default function AuthTabSwitch({ activeTab, onTabChange }: AuthTabSwitchProps) {
  const router = useRouter();

  const handleRegisterClick = () => {
    // Redirigir a la página de selección de tipo de cuenta
    router.push("/auth/select-account-type");
  };

  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex gap-3 p-1 bg-neutral-100 rounded-lg w-full max-w-md">
        <button
          onClick={() => onTabChange("login")}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200
            ${
              activeTab === "login"
                ? "bg-white text-brand-dark shadow-md"
                : "text-neutral-600 hover:text-brand-dark"
            }
          `}
          aria-pressed={activeTab === "login"}
        >
          <LogIn className="h-4 w-4" />
          <span>Iniciar Sesión</span>
        </button>
        <button
          onClick={handleRegisterClick}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200
            ${
              activeTab === "register"
                ? "bg-white text-brand-accent shadow-md"
                : "text-neutral-600 hover:text-brand-accent"
            }
          `}
        >
          <UserPlus className="h-4 w-4" />
          <span>Crear Cuenta</span>
        </button>
      </div>
    </div>
  );
}
