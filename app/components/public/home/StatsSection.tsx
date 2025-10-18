'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Building, Award, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

export const StatsSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const stats = [
    {
      icon: Users,
      value: '5,000+',
      label: 'Contrataciones Exitosas',
      description: 'Transfromando Carreras'
    },
    {
      icon: Building,
      value: '300+',
      label: 'Empresas Clientes',
      description: 'Confiando en nosotros'
    },
    {
      icon: Award,
      value: '15',
      label: 'Años de Experiencia',
      description: 'Liderando el mercado'
    },
    {
      icon: TrendingUp,
      value: '95%',
      label: 'Tasa de Éxito',
      description: 'En colocaciones'
    }
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % stats.length);
  }, [stats.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + stats.length) % stats.length);
  }, [stats.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsAutoPlaying(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
        setIsAutoPlaying(false);
      } else if (e.key === 'ArrowRight') {
        nextSlide();
        setIsAutoPlaying(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  return (
    <section className="py-20 bg-gradient-to-br from-brand-dark via-brand-dark to-[#003558] text-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent opacity-5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Resultados que Hablan por Sí Mismos
          </h2>
          <div className="w-20 h-1 bg-brand-accent mx-auto mb-6"></div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Números que demuestran nuestro compromiso con la excelencia y la satisfacción de nuestros clientes
          </p>
        </div>

        {/* Stats Grid - Desktop */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative group"
            >
              {/* Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20 hover:bg-white/15 hover:border-brand-accent/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
                {/* Icon Container */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-brand-accent opacity-20 rounded-xl blur-xl group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-brand-accent to-brand-accentDark w-16 h-16 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    <stat.icon className="h-8 w-8 text-white" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Value */}
                <div className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-br from-white to-gray-200 bg-clip-text text-transparent">
                  {stat.value}
                </div>

                {/* Label */}
                <div className="text-white text-lg font-semibold mb-2">
                  {stat.label}
                </div>

                {/* Description */}
                <div className="text-gray-300 text-sm">
                  {stat.description}
                </div>

                {/* Decorative line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-brand-accent group-hover:w-3/4 transition-all duration-300 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Carousel - Mobile */}
        <div className="md:hidden relative">
          {/* Carousel Container */}
          <div 
            className="relative overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            role="region"
            aria-label="Carrusel de estadísticas"
          >
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="w-full flex-shrink-0 px-4"
                  aria-hidden={currentSlide !== index}
                >
                  {/* Card */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20 shadow-2xl">
                    {/* Icon Container */}
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-brand-accent opacity-20 rounded-xl blur-xl"></div>
                      <div className="relative bg-gradient-to-br from-brand-accent to-brand-accentDark w-20 h-20 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                        <stat.icon className="h-10 w-10 text-white" strokeWidth={2.5} />
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-6xl font-bold mb-3 bg-gradient-to-br from-white to-gray-200 bg-clip-text text-transparent">
                      {stat.value}
                    </div>

                    {/* Label */}
                    <div className="text-white text-xl font-semibold mb-2">
                      {stat.label}
                    </div>

                    {/* Description */}
                    <div className="text-gray-300">
                      {stat.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={() => {
              prevSlide();
              setIsAutoPlaying(false);
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            aria-label="Estadística anterior"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={() => {
              nextSlide();
              setIsAutoPlaying(false);
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            aria-label="Siguiente estadística"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>

          {/* Dot Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {stats.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-accent ${
                  currentSlide === index
                    ? 'w-8 h-2 bg-brand-accent'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Ir a estadística ${index + 1}`}
                aria-current={currentSlide === index}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-300 text-lg mb-6">
            ¿Listo para formar parte de estas estadísticas?
          </p>
          <button className="bg-brand-accent text-white px-8 py-3 rounded-md font-semibold hover:bg-brand-accentDark transition-all duration-300 hover:shadow-lg hover:scale-105">
            Únete a Nosotros
          </button>
        </div>
      </div>
    </section>
  );
};
