'use client';

import React, { useState } from 'react';
import { Mail, User, Phone, MessageSquare, Send, CheckCircle } from 'lucide-react';

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular envío del formulario
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Contáctenos
          </h2>
          <div className="w-20 h-1 bg-brand-accent mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            ¿Tienes alguna pregunta o necesitas más información? Completa el formulario
            y nos pondremos en contacto contigo a la brevedad posible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <div className="bg-gray-50 rounded-2xl p-8 shadow-lg">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:ring-brand-accent focus:border-brand-accent"
                      placeholder="Juan Pérez"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:ring-brand-accent focus:border-brand-accent"
                      placeholder="juan@ejemplo.com"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:ring-brand-accent focus:border-brand-accent"
                      placeholder="+52 55 2662 2966"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-brand-accent focus:border-brand-accent"
                  >
                    <option value="">Selecciona un asunto</option>
                    <option value="Información General">Información General</option>
                    <option value="Buscar Empleo">Buscar Empleo</option>
                    <option value="Contratar Talento">Contratar Talento</option>
                    <option value="Consultoría">Consultoría</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje *
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MessageSquare className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:ring-brand-accent focus:border-brand-accent"
                      placeholder="Escribe tu mensaje aquí..."
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-accent text-white px-6 py-3 rounded-md font-medium hover:bg-brand-accentDark transition-colors flex items-center justify-center disabled:bg-brand-accent/70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Enviar Mensaje
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-20 w-20 text-green-500 mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  ¡Mensaje Enviado!
                </h3>
                <p className="text-gray-600 text-center">
                  Gracias por contactarnos. Te responderemos a la brevedad posible.
                </p>
              </div>
            )}
          </div>

          {/* Contact Info and Map */}
          <div className="space-y-8">
            {/* Contact Cards */}
            <div className="bg-gradient-to-br from-brand-dark/90 to-brand-dark rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Información de Contacto</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold mb-1">Teléfonos</h4>
                    <p className="text-gray-100">+52 55 2662 2966</p>
                    <p className="text-gray-100">+507 6000-0001</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold mb-1">Emails</h4>
                    <p className="text-gray-100">info@pspgroup.com.mx</p>
                    <p className="text-gray-100">contact@pspg.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold mb-1">Dirección</h4>
                    <p className="text-gray-100">
                      Ciudad de México, México<br />
                      Edificio Empresarial, Piso 10
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-gray-200 rounded-2xl overflow-hidden shadow-lg h-64">
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
          </div>
        </div>
      </div>
    </section>
  );
};

