"use client";

import React from "react";
import { PublicNavbar } from "../components/public/layout/PublicNavbar";
import { PublicFooter } from "../components/public/layout/PublicFooter";
import { Award, Target, Users, Heart, TrendingUp, Globe } from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: "Compromiso",
      description: "Dedicación total a cada cliente y candidato",
    },
    {
      icon: Target,
      title: "Excelencia",
      description: "Búsqueda constante de la perfección en cada proceso",
    },
    {
      icon: Users,
      title: "Colaboración",
      description: "Trabajo en equipo con todos nuestros stakeholders",
    },
    {
      icon: TrendingUp,
      title: "Innovación",
      description: "Adaptación continua a las tendencias del mercado",
    },
    {
      icon: Globe,
      title: "Visión Global",
      description: "Perspectiva internacional con enfoque local",
    },
    {
      icon: Award,
      title: "Integridad",
      description: "Transparencia y honestidad en todas nuestras acciones",
    },
  ];

  const milestones = [
    { year: "2010", event: "Fundación de PSP Group" },
    { year: "2013", event: "Expansión a mercados internacionales" },
    { year: "2016", event: "Alcanzamos 1,000 colocaciones exitosas" },
    { year: "2019", event: "Lanzamiento de plataforma digital" },
    { year: "2022", event: "Certificación ISO en procesos de RRHH" },
    { year: "2025", event: "Líder regional en head hunting ejecutivo" },
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
                Somos <span className="text-brand-accent">PSP Group</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
                Con más de 20 años de experiencia en asesoría fiscal con vocación de asesoría integral a nuestros clientes.
              </p>
              <div className="mt-8 flex justify-center">
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 bg-white" id="vision">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Mission Card */}
              <div className="group relative bg-gradient-to-br from-neutral-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-neutral-100">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-2xl group-hover:bg-brand-accent/10 transition-colors"></div>
                <div className="relative">
                  <div className="bg-gradient-to-br from-brand-dark to-brand-dark/90 w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-brand-dark mb-4">Nuestra Misión</h2>
                  <div className="w-16 h-1 bg-brand-accent mb-6"></div>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Brindar siempre un servicio de calidad, rapidez, eficacia, excelencia y perfeccionismo para nuestros clientes.
                  </p>
                </div>
              </div>

              {/* Vision Card */}
              <div className="group relative bg-gradient-to-br from-neutral-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-neutral-100">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-2xl group-hover:bg-brand-accent/10 transition-colors"></div>
                <div className="relative">
                  <div className="bg-gradient-to-br from-brand-accent to-brand-accentDark w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-brand-dark mb-4">Nuestra Visión</h2>
                  <div className="w-16 h-1 bg-brand-accent mb-6"></div>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Seguir siendo reconocidos como una firma de servicios profesionales integra y de excelencia en su ramo, siempre innovando a los cambios y necesidades que se presentan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-gradient-to-b from-neutral-50 to-white" id="values">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">Nuestros Valores</h2>
              <div className="flex justify-center items-center gap-2 mb-4">
                <div className="w-12 h-1 bg-brand-accent"></div>
                <div className="w-3 h-3 bg-brand-accent rounded-full"></div>
                <div className="w-12 h-1 bg-brand-accent"></div>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Los principios que guían cada una de nuestras decisiones y acciones
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="group bg-white rounded-xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 border border-neutral-100 hover:border-brand-accent/20 hover:-translate-y-1">
                  <div className="bg-gradient-to-br from-brand-dark to-brand-dark/90 w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <value.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-dark mb-2 group-hover:text-brand-accent transition-colors">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              ))}
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
                ÚNETE A NOSOTROS
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              ¿Listo para dar el siguiente paso?
            </h2>
            <p className="text-xl text-gray-200 mb-10 leading-relaxed">
              Únete a las empresas y profesionales que confían en nosotros para alcanzar sus objetivos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => (window.location.href = "/jobs")}
                className="group relative px-8 py-4 bg-brand-accent text-white rounded-lg font-semibold hover:bg-brand-accentDark transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105">
                <span className="relative z-10">Ver Oportunidades</span>
              </button>
              <button
                onClick={() => (window.location.href = "/contact")}
                className="group relative px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-brand-dark transition-all duration-300 shadow-lg hover:shadow-2xl">
                <span className="relative z-10">Contactar</span>
              </button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
