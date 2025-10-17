'use client';

import React from 'react';
import { PublicNavbar } from '../components/public/layout/PublicNavbar';
import { PublicFooter } from '../components/public/layout/PublicFooter';
import { ContactForm } from '../components/public/home/ContactForm';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold mb-4">Contáctenos</h1>
            <p className="text-xl text-blue-100">
              Estamos aquí para ayudarte. Comunícate con nosotros.
            </p>
          </div>
        </section>

        {/* Quick Contact Info */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-xl transition-shadow">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Dirección</h3>
                <p className="text-gray-600 text-sm">
                  Ciudad de Panamá, Panamá<br />
                  Edificio Empresarial, Piso 10
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-xl transition-shadow">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Teléfono</h3>
                <p className="text-gray-600 text-sm">
                  +507 6000-0000<br />
                  +507 6000-0001
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-xl transition-shadow">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600 text-sm">
                  info@pspg.com<br />
                  contact@pspg.com
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-xl transition-shadow">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Horario</h3>
                <p className="text-gray-600 text-sm">
                  Lun - Vie: 8AM - 6PM<br />
                  Sábados: 9AM - 1PM
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <ContactForm />

        {/* Map Section */}
        <section className="py-0 bg-white">
          <div className="w-full h-96">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126094.47516044226!2d-79.59912743359375!3d8.983333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8faca8f1dbe80363%3A0xaba25df1f042c10e!2zUGFuYW3DoQ!5e0!3m2!1ses!2spa!4v1697582400000!5m2!1ses!2spa"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Preguntas Frecuentes
              </h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
            </div>

            <div className="space-y-6">
              {[
                {
                  question: '¿Cuánto tiempo toma el proceso de reclutamiento?',
                  answer:
                    'El proceso varía según la posición, pero típicamente toma entre 2-4 semanas desde la solicitud inicial hasta la presentación de candidatos.'
                },
                {
                  question: '¿Cobran algún costo a los candidatos?',
                  answer:
                    'No, nuestros servicios son completamente gratuitos para los candidatos. Las empresas son quienes pagan por nuestros servicios de reclutamiento.'
                },
                {
                  question: '¿Qué industrias cubren?',
                  answer:
                    'Trabajamos con empresas de todas las industrias, incluyendo tecnología, finanzas, manufactura, servicios, comercio y más.'
                },
                {
                  question: '¿Ofrecen posiciones remotas?',
                  answer:
                    'Sí, tenemos oportunidades presenciales, híbridas y completamente remotas dependiendo de las necesidades de nuestros clientes.'
                }
              ].map((faq, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
