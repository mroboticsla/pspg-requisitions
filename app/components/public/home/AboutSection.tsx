"use client";

import React, { useEffect, useRef, useState } from "react";
import { Users, Building2, TrendingUp, MapPin, Award, Target } from "lucide-react";

export const AboutSection: React.FC = () => {
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elementId = entry.target.getAttribute("data-animate");
            if (elementId) {
              setVisibleElements((prev) => new Set(prev).add(elementId));
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      }
    );

    if (sectionRef.current) {
      const animatedElements = sectionRef.current.querySelectorAll("[data-animate]");
      animatedElements.forEach((element) => observer.observe(element));
    }

    return () => observer.disconnect();
  }, []);

  const isVisible = (id: string) => visibleElements.has(id);
  const features = [
    {
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
      title: "ASESORÍA",
      description: "Siempre buscamos la mejor estrategia que se adapte a las necesidades y características de nuestros clientes, elaborando la estrategia ideal.",
      icon: Target,
    },
    {
      image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80",
      title: "INTEGRAL",
      description: "Beneficios estratégicos y balanceados para los empresarios y colaboradores, contamos con un portafolio extenso que está basado en la economía.",
      icon: Award,
    },
  ];

  const valueProps = [
    {
      icon: Users,
      title: "Más de 10,000 colaboradores",
      highlight: "10,000 colaboradores",
      description: "Alcance nacional con una amplia red de profesionales en diversas industrias.",
    },
    {
      icon: MapPin,
      title: "Presencia Nacional",
      highlight: "Nacional",
      description: "Cobertura en todo el territorio con soluciones adaptadas a cada región.",
    },
    {
      icon: Building2,
      title: "Soluciones por industria",
      highlight: "industria",
      description: "Experiencia especializada en diferentes sectores económicos.",
    },
    {
      icon: TrendingUp,
      title: "Soluciones por tamaño de empresa",
      highlight: "tamaño de empresa",
      description: "Servicios escalables desde PyMEs hasta grandes corporaciones.",
    },
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          data-animate="header"
          className={`text-center mb-20 transition-all duration-1000 ${
            isVisible("header") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Acerca de <span className="text-brand-accent">PSP Group</span>
          </h2>
          <div className="w-20 h-1 bg-brand-accent mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Somos una empresa con capital intelectual con más de 20 años de experiencia en asesoría fiscal con vocación de
            asesoría integral a nuestros clientes.
          </p>
        </div>

        {/* Features Grid - Layout Alternado */}
        <div className="space-y-16 mb-24">
          {features.map((feature, index) => (
            <div
              key={index}
              data-animate={`feature-${index}`}
              className={`flex flex-col ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              } gap-10 items-center transition-all duration-1000 ${
                isVisible(`feature-${index}`)
                  ? "opacity-100 translate-x-0"
                  : `opacity-0 ${index % 2 === 0 ? "-translate-x-10" : "translate-x-10"}`
              }`}
            >
              {/* Image Side */}
              <div className="w-full md:w-1/2">
                <div className="relative rounded-2xl overflow-hidden shadow-xl group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-brand-dark/10 group-hover:bg-brand-dark/20 transition-all duration-300"></div>
                </div>
              </div>

              {/* Content Side */}
              <div className="w-full md:w-1/2 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-brand-accent/10 p-3 rounded-xl">
                    <feature.icon className="h-8 w-8 text-brand-accent" strokeWidth={2} />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Propuesta de Valor Section */}
        <div className="bg-gray-100 rounded-2xl md:rounded-3xl p-6 md:p-16">
          <div
            data-animate="value-header"
            className={`text-center mb-8 md:mb-14 transition-all duration-1000 ${
              isVisible("value-header") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h3 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">Nuestra Propuesta de Valor</h3>
            <div className="w-16 md:w-20 h-1 bg-brand-accent mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-12">
            {valueProps.map((prop, index) => (
              <div
                key={index}
                data-animate={`value-${index}`}
                className={`bg-white p-5 md:p-8 rounded-xl md:rounded-2xl hover:shadow-xl transition-all duration-700 group border border-gray-100 ${
                  isVisible(`value-${index}`)
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="flex items-start gap-4 md:gap-5">
                  <div className="bg-brand-dark w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <prop.icon className="h-6 w-6 md:h-8 md:w-8 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base md:text-xl font-bold text-gray-900 mb-1.5 md:mb-2 leading-snug">
                      {prop.title.split(prop.highlight).map((part, i, arr) => (
                        <React.Fragment key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <span className="text-brand-accent">{prop.highlight}</span>
                          )}
                        </React.Fragment>
                      ))}
                    </h4>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">{prop.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            data-animate="cta-button"
            className={`text-center transition-all duration-1000 ${
              isVisible("cta-button") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <button className="bg-brand-accent text-white px-8 md:px-10 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-brand-accentDark hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              Conocer Más Sobre Nosotros
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
