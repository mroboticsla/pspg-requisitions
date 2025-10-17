'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Mail, Phone, MapPin, Facebook, Linkedin, Twitter } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-dark text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="h-8 w-8 text-brand-accent" />
              <span className="text-xl font-bold text-white">PSP Group</span>
            </div>
            <p className="text-sm mb-4">
              Head Hunters profesionales con más de 15 años de experiencia conectando talento con oportunidades excepcionales.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-brand-accent transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-brand-accent transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-brand-accent transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-white font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm hover:text-brand-accent transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm hover:text-brand-accent transition-colors">
                  Acerca de Nosotros
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="text-sm hover:text-brand-accent transition-colors">
                  Portal de Empleos
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm hover:text-brand-accent transition-colors">
                  Contáctenos
                </Link>
              </li>
            </ul>
          </div>

          {/* Información de contacto */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-brand-accent flex-shrink-0 mt-0.5" />
                <span className="text-sm">Ciudad de México, México</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-brand-accent flex-shrink-0" />
                <span className="text-sm">+52 55 2662 2966</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-brand-accent flex-shrink-0" />
                <span className="text-sm">info@pspgroup.com.mx</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria y copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">
              © {currentYear} PSPG Group. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-sm hover:text-brand-accent transition-colors">
                Política de Privacidad
              </Link>
              <Link href="/terms" className="text-sm hover:text-brand-accent transition-colors">
                Términos y Condiciones
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
