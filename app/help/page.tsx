"use client";

import React from "react";
import { useAuth } from "../providers/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HelpPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redireccionar si no hay usuario autenticado
  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

  const faqs = [
    {
      question: "¿Cómo creo una nueva requisición?",
      answer: "Ve a la sección de 'Requisiciones' y haz clic en el botón 'Nueva Requisición'. Llena el formulario con los detalles requeridos y envíalo para su aprobación.",
    },
    {
      question: "¿Cómo puedo editar mi perfil?",
      answer: "Puedes editar tu perfil haciendo clic en tu avatar en la esquina superior derecha y seleccionando 'Mi Perfil'. Ahí podrás actualizar tu información personal.",
    },
    {
      question: "¿Qué hago si olvidé mi contraseña?",
      answer: "En la página de inicio de sesión, haz clic en '¿Olvidaste tu contraseña?' y sigue las instrucciones para restablecerla.",
    },
    {
      question: "¿Cómo puedo ver el estado de mis requisiciones?",
      answer: "En el Dashboard o en la sección de 'Requisiciones' podrás ver todas tus requisiciones y su estado actual (pendiente, aprobada, rechazada, etc.).",
    },
    {
      question: "¿Puedo descargar reportes?",
      answer: "Sí, en la sección de 'Reportes' puedes generar y descargar diferentes tipos de reportes en formato PDF o Excel.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Centro de Ayuda</h1>
          <p className="mt-2 text-sm text-gray-600">
            Encuentra respuestas a las preguntas más frecuentes y obtén soporte
          </p>
        </div>

        {/* Búsqueda */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar en la ayuda..."
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
            />
            <svg
              className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Tarjetas de contacto rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Email</h3>
            <p className="text-sm text-gray-500 mb-3">Contacta con soporte</p>
            <a
              href="mailto:soporte@pspgroup.com"
              className="text-sm text-brand-dark hover:text-brand-accent font-medium"
            >
              soporte@pspgroup.com
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Teléfono</h3>
            <p className="text-sm text-gray-500 mb-3">Lun-Vie 9am-6pm</p>
            <a href="tel:+525512345678" className="text-sm text-brand-dark hover:text-brand-accent font-medium">
              +52 (55) 1234-5678
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Chat en Vivo</h3>
            <p className="text-sm text-gray-500 mb-3">Respuesta inmediata</p>
            <button className="text-sm text-brand-dark hover:text-brand-accent font-medium">
              Iniciar chat
            </button>
          </div>
        </div>

        {/* Preguntas Frecuentes */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Preguntas Frecuentes</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {faqs.map((faq, index) => (
              <details key={index} className="group">
                <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                  <svg
                    className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-sm text-gray-600">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>

        {/* Recursos adicionales */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/docs"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow flex items-start space-x-4"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Documentación</h3>
              <p className="text-sm text-gray-500">Guías completas y tutoriales detallados</p>
            </div>
          </Link>

          <Link
            href="/tutorials"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow flex items-start space-x-4"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Video Tutoriales</h3>
              <p className="text-sm text-gray-500">Aprende viendo ejemplos paso a paso</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
