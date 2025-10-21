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

        {/* KLU Card Section */}
        <section className="py-20 bg-gradient-to-b from-neutral-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Text Content */}
              <div>
                <div className="inline-block mb-6">
                  <span className="inline-block px-4 py-2 bg-blue-100 border border-blue-300 rounded-full text-sm font-semibold text-blue-900">
                    TARJETA EMPRESARIAL KLU
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-6 leading-tight">
                  Beneficios: Tarjeta Empresarial (KLU)
                </h2>
                <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                  Como parte de nuestra cartera de servicios decidimos añadir una nueva herramienta que está aquí para apoyarnos a revolucionar las ideas convencionales que tenemos de los bancos.
                </p>
                <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                  Es una plataforma diseñada para tus necesidades y soluciones empresariales desde una cuenta corporativa contando con una interfaz amigable que te permite navegar en tu cuenta.
                </p>
                <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                  Esta nueva herramienta nos permite generar un mejor control con los gastos corrientes que generamos empresarialmente mediante un plástico master card internacional facilitándonos el pago de los gastos corrientes como:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {[
                    'Viáticos',
                    'Hoteles',
                    'Restaurantes',
                    'Tiendas departamentales',
                    'Tiendas de autoservicio',
                    'Insumos',
                    'Transporte',
                    'Pagos en plataformas',
                    'Gasolina',
                    'Gastos generales',
                    'Disposición de efectivo'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-gray-700 font-medium">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-600 italic">
                  * aplica comisión del banco
                </p>
              </div>

              {/* Right side - Images and Logo */}
              <div className="relative">
                <div className="relative flex flex-col items-center justify-center space-y-8">
                  {/* KLU Cards Visual */}
                  <div className="relative w-full max-w-sm h-96 perspective">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-600/10 rounded-3xl blur-3xl"></div>
                    
                    {/* Card stack effect */}
                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-64 h-40 bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl shadow-2xl border border-blue-700 transform -rotate-12 opacity-80">
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-white mb-2">klu.</div>
                          <div className="flex gap-2 justify-center">
                            <div className="w-8 h-5 bg-red-500 rounded"></div>
                            <div className="w-8 h-5 bg-yellow-500 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-64 h-40 bg-gradient-to-br from-blue-800 to-blue-700 rounded-2xl shadow-2xl border border-blue-600 transform rotate-0 z-10">
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-white mb-2">klu.</div>
                          <div className="flex gap-2 justify-center">
                            <div className="w-8 h-5 bg-red-500 rounded"></div>
                            <div className="w-8 h-5 bg-yellow-500 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phone Visual */}
                  <div className="relative w-32 h-64 mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-blue-950 rounded-3xl shadow-2xl border-2 border-blue-700 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-4">klu.</div>
                        <div className="w-12 h-8 bg-yellow-500 rounded-lg mx-auto mb-4"></div>
                        <p className="text-xs text-blue-200">Mobile App</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        
        {/* Employee Benefits Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">Beneficios para Colaboradores</h2>
              <div className="flex justify-center items-center gap-2 mb-4">
                <div className="w-12 h-1 bg-brand-accent"></div>
                <div className="w-3 h-3 bg-brand-accent rounded-full"></div>
                <div className="w-12 h-1 bg-brand-accent"></div>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Contamos con beneficios exclusivos para nuestros colaboradores y sus familias
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* CADI Card Benefits */}
              <div className="group relative bg-gradient-to-br from-white to-neutral-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-neutral-100 hover:border-brand-accent/20 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors"></div>
                
                <div className="relative">
                  <div className="inline-block mb-4 px-4 py-2 bg-red-100 border border-red-300 rounded-full text-xs font-bold text-red-900 uppercase">
                    Tarjeta CADI (Desclub)
                  </div>
                  
                  <h3 className="text-2xl font-bold text-brand-dark mb-6">Descuentos y Beneficios Exclusivos</h3>
                  
                  <div className="space-y-3 mb-8">
                    {[
                      'Envío de ambulancia',
                      'Envío de médico a domicilio',
                      'Descuentos en laboratorios',
                      'Descuento en hospitales a nivel nacional',
                      'Telemédica',
                      'Descuentos comerciales (Red Desclub)',
                      'Estudio en laboratorio',
                      'Cine 2x1',
                      'Limpieza dental'
                    ].map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mt-0.5">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-700 font-medium">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-600 italic">
                    * Se entrega 3 meses después de estar dados de alta con nosotros
                  </p>
                </div>
              </div>

              {/* Bipromedic Card Benefits */}
              <div className="group relative bg-gradient-to-br from-white to-neutral-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-neutral-100 hover:border-brand-accent/20 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors"></div>
                
                <div className="relative">
                  <div className="inline-block mb-4 px-4 py-2 bg-green-100 border border-green-300 rounded-full text-xs font-bold text-green-900 uppercase">
                    Tarjeta Electrónica Bipromedic
                  </div>
                  
                  <h3 className="text-2xl font-bold text-brand-dark mb-6">Cobertura Médica Integral</h3>
                  
                  <div className="mb-6">
                    <h4 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Cobertura
                    </h4>
                    <div className="space-y-2">
                      {[
                        'Indemnización por fallecimiento accidental: $200,000.00',
                        'Reembolso de gastos médicos por accidente: $25,000.00',
                        'Invalidez por accidente total: $200,000.00',
                        'Pérdidas orgánicas escala "B": $200,000.00',
                        'Indemnización diaria por hospitalización por accidente: $300.00 (hasta 90 días)',
                        'Muerte por asalto: $20,000.00 en exceso de la suma por muerte accidental',
                        'Quemaduras graves: $3,000.00',
                        'Fractura de hueso por accidente: $3,000.00'
                      ].map((coverage, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-gray-700 text-sm">
                            {coverage}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600">
                    Certificado: 173093710 | Vigencia: 17-07-2023 a 17-07-2024
                  </p>
                </div>
              </div>
            </div>

            {/* Additional note */}
            <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200">
              <p className="text-gray-700 text-center">
                <span className="font-bold text-brand-dark">Estos beneficios</span> están diseñados para garantizar la tranquilidad y bienestar de nuestros colaboradores y sus familias, brindando acceso a servicios de salud, descuentos en comercios y protección en caso de accidentes.
              </p>
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
