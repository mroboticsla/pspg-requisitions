'use client';

import React from 'react';
import { Award, Users, TrendingUp, Target } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const features = [
    {
      icon: Award,
      title: '15 Años de Experiencia',
      description: 'Más de una década conectando talento con oportunidades excepcionales'
    },
    {
      icon: Users,
      title: 'Red Global',
      description: 'Acceso a miles de profesionales calificados en diversas industrias'
    },
    {
      icon: TrendingUp,
      title: 'Tasa de Éxito del 95%',
      description: 'Alta efectividad en la colocación de candidatos y satisfacción empresarial'
    },
    {
      icon: Target,
      title: 'Enfoque Personalizado',
      description: 'Soluciones a medida para cada cliente y candidato'
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Acerca de PSP Group
          </h2>
          <div className="w-20 h-1 bg-brand-accent mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Somos líderes en reclutamiento ejecutivo y búsqueda de talento especializado,
            comprometidos con la excelencia y la innovación en cada proceso.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <feature.icon className="h-8 w-8 text-brand-accent" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
              alt="Equipo de trabajo"
              className="rounded-lg shadow-lg"
            />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Nuestra Historia
            </h3>
            <p className="text-gray-600 mb-4">
              Fundada en 2010, PSP Group nació con la visión de transformar
              la manera en que las empresas encuentran talento y los profesionales
              descubren oportunidades.
            </p>
            <p className="text-gray-600 mb-4">
              A lo largo de los años, hemos construido relaciones sólidas con empresas
              líderes y profesionales destacados, estableciéndonos como referentes en
              el sector de reclutamiento ejecutivo.
            </p>
            <p className="text-gray-600 mb-6">
              Nuestro compromiso con la excelencia, la innovación y el servicio
              personalizado nos ha permitido crecer y adaptarnos a las necesidades
              cambiantes del mercado laboral.
            </p>
            <button className="bg-brand-accent text-white px-6 py-3 rounded-md font-medium hover:bg-brand-accentDark transition-colors">
              Conocer Más Sobre Nosotros
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
