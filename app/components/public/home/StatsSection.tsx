'use client';

import React from 'react';
import { Users, Building, Award, TrendingUp } from 'lucide-react';

export const StatsSection: React.FC = () => {
  const stats = [
    {
      icon: Users,
      value: '5,000+',
      label: 'Profesionales Colocados',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Building,
      value: '300+',
      label: 'Empresas Clientes',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Award,
      value: '15',
      label: 'Años de Experiencia',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: TrendingUp,
      value: '95%',
      label: 'Tasa de Éxito',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Resultados que Hablan por Sí Mismos</h2>
          <p className="text-xl text-gray-300">
            Números que demuestran nuestro compromiso con la excelencia
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative group"
            >
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 text-center hover:bg-opacity-20 transition-all duration-300 transform hover:-translate-y-2">
                <div className={`bg-gradient-to-br ${stat.color} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-10 w-10 text-white" />
                </div>
                <div className="text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-gray-300 text-lg">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
