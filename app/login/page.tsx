"use client";

import { useState } from "react";
import Header from "../components/Header";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica de autenticación
    console.log("Login attempt:", { email, password });
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Contenedor principal del formulario */}
          <div className="bg-surface-primary p-8 rounded-xl shadow-lg border border-neutral-200">
            {/* Header del formulario */}
            <div className="text-center mb-8">
              <div className="h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                <img src="/images/logo-web-dark.png" alt="PSP logo" className="h-10 rounded-lg object-cover" />
              </div>
              <h2 className="text-xl font-bold text-neutral-800 mb-2">Inicia sesión para continuar</h2>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent transition-all duration-200 bg-surface-secondary text-brand-dark"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-neutral-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-600">
                    Recordarme
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-brand-accent hover:text-brand-dark transition-colors">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-dark hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]">
                Iniciar Sesión
              </button>
            </form>

            {/* Footer del formulario */}
            <div className="mt-8 text-center">
              <p className="text-xs text-neutral-500">© 2025 PSP Group. Todos los derechos reservados.</p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="text-center">
            <p className="text-sm text-neutral-600">
              ¿Necesitas ayuda?{" "}
              <a href="#" className="font-medium text-brand-accent hover:text-brand-dark transition-colors">
                Contacta soporte técnico
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
