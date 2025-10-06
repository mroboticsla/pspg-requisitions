"use client";

import React from "react";

interface AuthTabSwitchProps {
  activeTab: "login" | "register";
  onTabChange: (tab: "login" | "register") => void;
}

export default function AuthTabSwitch({ activeTab, onTabChange }: AuthTabSwitchProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="inline-flex bg-surface-secondary rounded-full p-1 shadow-sm border border-neutral-200">
        <button
          onClick={() => onTabChange("login")}
          className={`
            px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out
            ${
              activeTab === "login"
                ? "bg-brand-dark text-white shadow-md transform scale-105"
                : "text-neutral-600 hover:text-brand-dark hover:bg-surface-primary"
            }
          `}
          aria-pressed={activeTab === "login"}
        >
          Iniciar sesión
        </button>
        <button
          onClick={() => onTabChange("register")}
          className={`
            px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out
            ${
              activeTab === "register"
                ? "bg-brand-accent text-white shadow-md transform scale-105"
                : "text-neutral-600 hover:text-brand-accent hover:bg-surface-primary"
            }
          `}
          aria-pressed={activeTab === "register"}
        >
          Registrarse
        </button>
      </div>
    </div>
  );
}
