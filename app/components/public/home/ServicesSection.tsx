'use client';

import React from 'react';
import { Search, Briefcase, UserCheck, LineChart, Building, Lightbulb } from 'lucide-react';

export const ServicesSection: React.FC = () => {
  const services = [
    {
      icon: Search,
      title: 'Head Hunting',
      description: 'Búsqueda especializada de ejecutivos y profesionales de alto nivel para posiciones estratégicas'
    },
    {
      icon: Briefcase,
      title: 'Reclutamiento Masivo',
      description: 'Soluciones eficientes para la contratación de grandes volúmenes de personal calificado'
    },
    {
      icon: UserCheck,
      title: 'Evaluación de Talento',
      description: 'Procesos de assessment y evaluación de competencias para identificar el mejor talento'
    },
    {
      icon: LineChart,
      title: 'Consultoría de RRHH',
      description: 'Asesoría estratégica en gestión de talento y optimización de procesos de reclutamiento'
    },
    {
      icon: Building,
      title: 'Outsourcing de Personal',
      description: 'Gestión integral de personal temporal y permanente para tu organización'
    },
    {
      icon: Lightbulb,
      title: 'Capacitación Empresarial',
      description: 'Programas de formación y desarrollo para potenciar el talento de tu equipo'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Nuestros Servicios
          </h2>
          <div className="w-20 h-1 bg-brand-accent mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ofrecemos soluciones integrales de reclutamiento y gestión de talento
            adaptadas a las necesidades específicas de tu organización
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="group bg-white border border-gray-200 rounded-lg p-8 hover:shadow-xl hover:border-brand-accent transition-all duration-300"
            >
              <div className="bg-gradient-to-br from-red-50 to-red-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <service.icon className="h-8 w-8 text-brand-accent" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-brand-accent transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-brand-dark to-brand-dark/90 rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            ¿Necesitas una solución personalizada?
          </h3>
          <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
            Nuestro equipo de expertos está listo para ayudarte a encontrar
            la solución perfecta para tus necesidades de reclutamiento
          </p>
          <button className="bg-brand-accent text-white px-8 py-3 rounded-md font-semibold hover:bg-brand-accentDark transition-colors">
            Solicitar Consulta Gratuita
          </button>
        </div>
      </div>
    </section>
  );
};
