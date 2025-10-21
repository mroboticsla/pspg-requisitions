'use client';

import React from 'react';
import { PublicNavbar } from '../components/public/layout/PublicNavbar';
import { PublicFooter } from '../components/public/layout/PublicFooter';
import { TrendingUp, Zap, Shield, BarChart3, Lock, Target, CheckCircle2, ArrowRight } from 'lucide-react';

export default function BenefitsPage() {
  const benefits = [
    {
      icon: TrendingUp,
      title: 'Incremento en la Rentabilidad',
      description: 'Incremento en la rentabilidad de la empresa',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Zap,
      title: 'Reducción de Costos',
      description: 'Reducción de costos operativos',
      color: 'from-yellow-500 to-amber-600'
    },
    {
      icon: Target,
      title: 'Optimización de Procesos',
      description: 'Optimización de procesos',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: BarChart3,
      title: 'Mejora en Productividad',
      description: 'Mejor gestión y aumento en la productividad asegurando un mayor enfoque a su negocio',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      icon: Zap,
      title: 'Flexibilidad y Escalabilidad',
      description: 'Flexibilidad y escalabilidad',
      color: 'from-orange-500 to-red-600'
    },
    {
      icon: Shield,
      title: 'Seguridad y Transparencia',
      description: 'Seguridad, confiabilidad y transparencia',
      color: 'from-red-500 to-pink-600'
    }
  ];

  const rpsServices = [
    {
      title: 'STP',
      subtitle: '(Sistema de Transferencias y Pagos)',
      description: 'STP (Sistema de Transferencias y Pagos) nos permite realizar los movimientos eliminando los riesgos y tiempos de la banca empresarial.',
      icon: '🏦'
    },
    {
      title: 'Paquetería Interna',
      description: 'Nos apoya con la generación de cálculos como nóminas, aguinaldos entre otros.',
      icon: '📦'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <PublicNavbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-brand-dark via-brand-dark to-[#003d5c] text-white py-24 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-accent/5 rounded-full blur-3xl"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                Beneficios <span className="text-brand-accent">PSP Group</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
                Descubre cómo nuestros servicios contribuyen al crecimiento y éxito de tu empresa
              </p>
              <div className="mt-8 flex justify-center">
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">Nuestros Beneficios</h2>
              <div className="flex justify-center items-center gap-2 mb-4">
                <div className="w-12 h-1 bg-brand-accent"></div>
                <div className="w-3 h-3 bg-brand-accent rounded-full"></div>
                <div className="w-12 h-1 bg-brand-accent"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-neutral-100 hover:border-brand-accent/20 hover:-translate-y-1 overflow-hidden"
                >
                  {/* Background gradient */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${benefit.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`}></div>
                  
                  <div className="relative">
                    <div className={`bg-gradient-to-br ${benefit.color} w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <benefit.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-dark mb-2 group-hover:text-brand-accent transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RPS Services Section */}
        <section className="py-20 bg-gradient-to-b from-neutral-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">Servicios RPS</h2>
              <div className="flex justify-center items-center gap-2 mb-4">
                <div className="w-12 h-1 bg-brand-accent"></div>
                <div className="w-3 h-3 bg-brand-accent rounded-full"></div>
                <div className="w-12 h-1 bg-brand-accent"></div>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Soluciones integrales para la gestión financiera y de nómina de tu empresa
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {rpsServices.map((service, index) => (
                <div
                  key={index}
                  className="group relative bg-gradient-to-br from-white to-neutral-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-neutral-100 hover:border-brand-accent/20 overflow-hidden"
                >
                  {/* Decorative background */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-brand-accent/5 rounded-full blur-3xl group-hover:bg-brand-accent/10 transition-colors"></div>
                  
                  <div className="relative">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-5xl">{service.icon}</div>
                      <div>
                        <h3 className="text-2xl font-bold text-brand-dark group-hover:text-brand-accent transition-colors">
                          {service.title}
                        </h3>
                        {service.subtitle && (
                          <p className="text-sm text-gray-600 mt-1">{service.subtitle}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-base">
                      {service.description}
                    </p>

                    {/* Chevron icon */}
                    <div className="mt-6 inline-flex items-center gap-2 text-brand-accent font-semibold group-hover:gap-3 transition-all">
                      <span>Conocer más</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features List Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Features */}
              <div>
                <div className="inline-block mb-6">
                  <span className="inline-block px-4 py-2 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-sm font-semibold text-brand-dark">
                    POR QUÉ ELEGIR PSP GROUP
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-6 leading-tight">
                  Todo lo que necesitas en un solo lugar
                </h2>
                <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                  Somos tu socio estratégico en soluciones de talento y gestión empresarial, comprometidos con tu crecimiento.
                </p>

                <div className="space-y-4">
                  {[
                    'Profesionales altamente capacitados',
                    'Tecnología de punta y plataformas digitales',
                    'Atención personalizada a tus necesidades',
                    'Soluciones a medida para tu empresa',
                    'Experiencia de más de 20 años',
                    'Cumplimiento legal y normativo garantizado'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-4 group">
                      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-brand-accent to-brand-accentDark rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium group-hover:text-brand-dark transition-colors">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right side - Visual */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/20 to-brand-accent/5 rounded-2xl blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-brand-dark to-[#003d5c] rounded-2xl p-12 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/10 rounded-full blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      +20
                    </div>
                    <p className="text-gray-300 text-xl mb-8 leading-relaxed">
                      años de experiencia sirviendo a empresas en toda Latinoamérica
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-white mb-2">1000+</div>
                        <div className="text-sm text-gray-300">Colocaciones exitosas</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-2xl font-bold text-white mb-2">500+</div>
                        <div className="text-sm text-gray-300">Empresas confían en nosotros</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 bg-gradient-to-br from-brand-dark via-brand-dark to-[#003d5c] text-white overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-accent/10 rounded-full blur-3xl"></div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block mb-6">
              <span className="inline-block px-4 py-2 bg-brand-accent/20 border border-brand-accent/30 rounded-full text-sm font-semibold tracking-wide">
                PRÓXIMO PASO
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              ¿Listo para potenciar tu empresa?
            </h2>
            <p className="text-xl text-gray-200 mb-10 leading-relaxed">
              Contáctanos hoy mismo y descubre cómo nuestros servicios pueden transformar tu negocio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => (window.location.href = '/contact')}
                className="group relative px-8 py-4 bg-brand-accent text-white rounded-lg font-semibold hover:bg-brand-accentDark transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105">
                <span className="relative z-10">Contactar Ahora</span>
              </button>
              <button
                onClick={() => (window.location.href = '/about')}
                className="group relative px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-brand-dark transition-all duration-300 shadow-lg hover:shadow-2xl">
                <span className="relative z-10">Conocer Más</span>
              </button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
