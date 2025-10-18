'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

const slides: Slide[] = [
  {
    title: 'Head Hunters Profesionales',
    subtitle: 'Conectando Talento con Oportunidades',
    description: 'Especialistas en reclutamiento ejecutivo y búsqueda de talento de alto nivel',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1920&q=80'
  },
  {
    title: '20+ Años de Innovación',
    subtitle: 'Experiencia que Transforma Carreras',
    description: 'Más de una década construyendo puentes entre profesionales y empresas líderes',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80'
  },
  {
    title: 'Tu Próximo Paso Profesional',
    subtitle: 'Comienza Aquí',
    description: 'Descubre oportunidades exclusivas que impulsan tu crecimiento profesional',
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1920&q=80'
  }
];

export const HeroSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative h-[600px] overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-50" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center justify-center">
            <div className="max-w-4xl mx-auto px-4 text-center text-white">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in">
                {slide.title}
              </h1>
              <p className="text-2xl md:text-3xl mb-6 animate-fade-in-delay">
                {slide.subtitle}
              </p>
              <p className="text-lg md:text-xl mb-8 animate-fade-in-delay-2">
                {slide.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-3">
                <a href="/jobs" className="bg-brand-accent text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-brand-accentDark transition-colors inline-block">
                  Ver Empleos Disponibles
                </a>
                <button 
                  onClick={() => window.location.href = '/about'} 
                  className="bg-white text-brand-dark px-8 py-3 rounded-md text-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Conocer Más
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full transition-all"
        aria-label="Slide anterior"
      >
        <ChevronLeft className="h-8 w-8" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full transition-all"
        aria-label="Siguiente slide"
      >
        <ChevronRight className="h-8 w-8" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-white w-8'
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
            aria-label={`Ir al slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
