"use client";

import React from "react";
import { Clock, Calendar, Phone, Mail } from "lucide-react";

export const ScheduleSection: React.FC = () => {
  const scheduleItems = [
    { day: "Lunes - Viernes", hours: "8:00 AM - 6:00 PM" },
    { day: "Fines de Semana y Feriados", hours: "Cerrado" },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Schedule Info */}
          <div>
            <div className="flex items-center mb-6">
              <Clock className="h-12 w-12 text-brand-accent mr-4" />
              <div>
                <h2 className="text-4xl font-bold text-gray-900">Horario de Atención</h2>
                <p className="text-gray-600 mt-2">Estamos disponibles para atenderte</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              {scheduleItems.map((item, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center py-4 ${
                    index !== scheduleItems.length - 1 ? "border-b border-gray-200" : ""
                  }`}>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-brand-accent mr-3" />
                    <span className="font-semibold text-gray-900">{item.day}</span>
                  </div>
                  <span className="text-gray-600">{item.hours}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Image or Additional Info */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80"
                alt="Oficina de atención al cliente"
                className="rounded-lg mb-6"
              />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">¿Necesitas atención inmediata?</h3>
              <p className="text-gray-600 mb-6">
                Nuestro equipo de expertos está listo para atenderte. Agenda una cita para recibir asesoría personalizada.
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => (window.location.href = "/contact")}
                  className="w-full bg-brand-accent text-white px-6 py-3 rounded-md font-medium hover:bg-brand-accentDark transition-colors"
                >
                  Agendar Cita
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
