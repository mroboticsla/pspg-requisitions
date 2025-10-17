'use client';

import React from 'react';
import { PublicNavbar } from '../components/public/layout/PublicNavbar';
import { PublicFooter } from '../components/public/layout/PublicFooter';
import { Award, Target, Users, Heart, TrendingUp, Globe } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Compromiso',
      description: 'Dedicación total a cada cliente y candidato'
    },
    {
      icon: Target,
      title: 'Excelencia',
      description: 'Búsqueda constante de la perfección en cada proceso'
    },
    {
      icon: Users,
      title: 'Colaboración',
      description: 'Trabajo en equipo con todos nuestros stakeholders'
    },
    {
      icon: TrendingUp,
      title: 'Innovación',
      description: 'Adaptación continua a las tendencias del mercado'
    },
    {
      icon: Globe,
      title: 'Visión Global',
      description: 'Perspectiva internacional con enfoque local'
    },
    {
      icon: Award,
      title: 'Integridad',
      description: 'Transparencia y honestidad en todas nuestras acciones'
    }
  ];

  const milestones = [
    { year: '2010', event: 'Fundación de PSP Group' },
    { year: '2013', event: 'Expansión a mercados internacionales' },
    { year: '2016', event: 'Alcanzamos 1,000 colocaciones exitosas' },
    { year: '2019', event: 'Lanzamiento de plataforma digital' },
    { year: '2022', event: 'Certificación ISO en procesos de RRHH' },
    { year: '2025', event: 'Líder regional en head hunting ejecutivo' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-6">Acerca de Nosotros</h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Más de 15 años construyendo puentes entre el talento excepcional y las
                oportunidades que transforman carreras y empresas.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
                <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Nuestra Misión</h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Conectar talento excepcional con oportunidades transformadoras mediante
                  procesos de reclutamiento innovadores y personalizados, generando valor
                  sostenible para nuestros clientes, candidatos y la sociedad.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8">
                <div className="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Nuestra Visión</h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Ser la firma de reclutamiento ejecutivo líder en la región, reconocida
                  por nuestra excelencia, innovación y compromiso con el desarrollo del
                  talento humano y el crecimiento empresarial.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Nuestros Valores</h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow"
                >
                  <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                    <value.icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Nuestra Trayectoria
              </h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-blue-200"></div>

              {/* Timeline Items */}
              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className={`flex items-center ${
                      index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                    }`}
                  >
                    <div className="w-1/2 pr-8 text-right">
                      {index % 2 === 0 && (
                        <>
                          <h3 className="text-2xl font-bold text-blue-600 mb-2">
                            {milestone.year}
                          </h3>
                          <p className="text-gray-700 text-lg">{milestone.event}</p>
                        </>
                      )}
                    </div>

                    <div className="relative z-10 flex items-center justify-center">
                      <div className="bg-blue-600 w-6 h-6 rounded-full border-4 border-white shadow-lg"></div>
                    </div>

                    <div className="w-1/2 pl-8">
                      {index % 2 !== 0 && (
                        <>
                          <h3 className="text-2xl font-bold text-blue-600 mb-2">
                            {milestone.year}
                          </h3>
                          <p className="text-gray-700 text-lg">{milestone.event}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Nuestro Equipo</h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Profesionales apasionados comprometidos con tu éxito
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((member) => (
                <div
                  key={member}
                  className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  <img
                    src={`https://images.unsplash.com/photo-${
                      member === 1
                        ? '1560250097-0b93528c311a'
                        : member === 2
                        ? '1573496359142-b8d87734a5a2'
                        : '1519085360753-af0119f7b3cd'
                    }?auto=format&fit=crop&w=400&q=80`}
                    alt={`Team member ${member}`}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {member === 1
                        ? 'María González'
                        : member === 2
                        ? 'Carlos Rodríguez'
                        : 'Ana Martínez'}
                    </h3>
                    <p className="text-blue-600 mb-3">
                      {member === 1
                        ? 'Directora Ejecutiva'
                        : member === 2
                        ? 'Director de Operaciones'
                        : 'Gerente de Talento'}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Especialista en reclutamiento ejecutivo con más de 10 años de
                      experiencia en la industria.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6">¿Listo para dar el siguiente paso?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Únete a las empresas y profesionales que confían en nosotros para alcanzar
              sus objetivos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors">
                Ver Oportunidades
              </button>
              <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                Contactar
              </button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
