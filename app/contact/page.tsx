'use client';

import React from 'react';
import { PublicNavbar } from '../components/public/layout/PublicNavbar';
import { PublicFooter } from '../components/public/layout/PublicFooter';
import { ContactForm } from '../components/public/home/ContactForm';
import { MapPin, Phone, Mail, Clock, ArrowRight, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />
      <main className="flex-grow">
        {/* Hero Section - Rediseñado con colores de marca */}
        <section className="relative bg-gradient-to-br from-brand-dark via-[#003358] to-brand-dark text-white py-24 overflow-hidden">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-72 h-72 bg-brand-accent rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-accent rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <MessageCircle className="h-4 w-4 text-brand-accent" />
                <span className="text-sm font-medium">Estamos para servirte</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Conectemos
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Tu próximo gran talento está a una conversación de distancia.
                <span className="block mt-2 text-lg text-gray-400">
                  Contáctanos y descubre cómo podemos ayudarte.
                </span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                <a 
                  href="#contact-form" 
                  className="group bg-brand-accent hover:bg-brand-accentDark text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-brand-accent/50 flex items-center gap-2"
                >
                  Enviar Mensaje
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a 
                  href="/about" 
                  className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 border border-white/20 hover:border-white/40"
                >
                  Ver Información
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Contact Info - Rediseñado */}
        <section id="contact-info" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">
                Múltiples Formas de Contactarnos
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-brand-accent to-brand-accentDark mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group bg-brand-dark rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-center border-2 border-brand-dark hover:border-brand-accent transform hover:-translate-y-2">
                <div className="relative mb-6">
                  <div className="bg-gradient-to-br from-brand-accent to-brand-accentDark w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl group-hover:shadow-brand-accent/50 transition-all duration-300 group-hover:scale-110">
                    <MapPin className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-brand-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
                </div>
                <h3 className="font-bold text-xl text-white mb-3">Dirección</h3>
                <p className="text-gray-200 leading-relaxed font-medium">
                  Ciudad de México, México<br />
                  <span className="text-gray-300">Edificio Empresarial, Piso 10</span>
                </p>
              </div>

              <div className="group bg-brand-dark rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-center border-2 border-brand-dark hover:border-brand-accent transform hover:-translate-y-2">
                <div className="relative mb-6">
                  <div className="bg-gradient-to-br from-brand-accent to-brand-accentDark w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl group-hover:shadow-brand-accent/50 transition-all duration-300 group-hover:scale-110">
                    <Phone className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-brand-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
                </div>
                <h3 className="font-bold text-xl text-white mb-3">Teléfono</h3>
                <a href="tel:+525526622966" className="text-gray-200 hover:text-brand-accent transition-colors font-semibold text-base">
                  +52 55 2662 2966
                </a>
              </div>

              <div className="group bg-brand-dark rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-center border-2 border-brand-dark hover:border-brand-accent transform hover:-translate-y-2">
                <div className="relative mb-6">
                  <div className="bg-gradient-to-br from-brand-accent to-brand-accentDark w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl group-hover:shadow-brand-accent/50 transition-all duration-300 group-hover:scale-110">
                    <Mail className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-brand-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
                </div>
                <h3 className="font-bold text-xl text-white mb-3">Email</h3>
                <a href="mailto:info@pspgroup.com.mx" className="text-gray-200 hover:text-brand-accent transition-colors font-semibold text-base break-all">
                  info@pspgroup.com.mx
                </a>
              </div>

              <div className="group bg-brand-dark rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-center border-2 border-brand-dark hover:border-brand-accent transform hover:-translate-y-2">
                <div className="relative mb-6">
                  <div className="bg-gradient-to-br from-brand-accent to-brand-accentDark w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl group-hover:shadow-brand-accent/50 transition-all duration-300 group-hover:scale-110">
                    <Clock className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-brand-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
                </div>
                <h3 className="font-bold text-xl text-white mb-3">Horario</h3>
                <p className="text-gray-200 leading-relaxed font-medium">
                  Lun - Vie: <span className="font-semibold text-white">8AM - 6PM</span><br />
                  Sábados: <span className="font-semibold text-white">9AM - 1PM</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form - Con diseño mejorado */}
        <section id="contact-form" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ContactForm />
          </div>
        </section>

        {/* Map Section - Rediseñado */}
        <section className="relative py-0 bg-gray-50">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent z-10"></div>
          <div className="w-full h-[500px] relative">
            <div className="absolute inset-0 bg-brand-dark/10 z-10 pointer-events-none"></div>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d240836.19217733363!2d-99.28292279999999!3d19.390519!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85ce0026db097507%3A0x54061076265ee841!2sCiudad%20de%20M%C3%A9xico%2C%20CDMX%2C%20M%C3%A9xico!5e0!3m2!1ses!2smx!4v1697582400000!5m2!1ses!2smx"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="filter grayscale-[30%]"
            ></iframe>
          </div>
        </section>

        {/* FAQ Section - Rediseñado */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-brand-dark/5 px-4 py-2 rounded-full mb-6">
                <span className="text-sm font-semibold text-brand-dark">FAQ</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">
                Preguntas Frecuentes
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Encuentra respuestas rápidas a las dudas más comunes sobre nuestros servicios
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-brand-accent to-brand-accentDark mx-auto rounded-full mt-4"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  question: '¿Cuánto tiempo toma el proceso de reclutamiento?',
                  answer:
                    'El proceso varía según la posición, pero típicamente toma entre 2-4 semanas desde la solicitud inicial hasta la presentación de candidatos.',
                  icon: '⏱️'
                },
                {
                  question: '¿Cobran algún costo a los candidatos?',
                  answer:
                    'No, nuestros servicios son completamente gratuitos para los candidatos. Las empresas son quienes pagan por nuestros servicios de reclutamiento.',
                  icon: '💰'
                },
                {
                  question: '¿Qué industrias cubren?',
                  answer:
                    'Trabajamos con empresas de todas las industrias, incluyendo tecnología, finanzas, manufactura, servicios, comercio y más.',
                  icon: '🏢'
                },
                {
                  question: '¿Ofrecen posiciones remotas?',
                  answer:
                    'Sí, tenemos oportunidades presenciales, híbridas y completamente remotas dependiendo de las necesidades de nuestros clientes.',
                  icon: '🌐'
                }
              ].map((faq, index) => (
                <div 
                  key={index} 
                  className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-brand-accent/20"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-brand-dark to-[#003358] rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:shadow-xl group-hover:shadow-brand-accent/30 transition-all duration-300">
                      {faq.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-brand-dark mb-3 leading-tight">
                        {faq.question}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA adicional */}
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-br from-brand-dark to-[#003358] rounded-2xl p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-accent/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    ¿No encuentras lo que buscas?
                  </h3>
                  <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                    Nuestro equipo está listo para responder todas tus preguntas y ayudarte a encontrar la solución perfecta
                  </p>
                  <a 
                    href="#contact-form"
                    className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-accentDark text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-brand-accent/50"
                  >
                    Contactar Ahora
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
