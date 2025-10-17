'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Menu, X } from 'lucide-react';
import Image from 'next/image'; // Import Image from next/image

export const PublicNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();

  const menuItems = [
    { name: 'Inicio', path: '/' },
    { name: 'Acerca de Nosotros', path: '/about' },
    { name: 'Portal de Empleos', path: '/jobs' },
    { name: 'Contáctenos', path: '/contact' },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center min-w-0 flex-1">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <Image src="/images/favicon.png" alt="PSP logo" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0" priority />
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">PSP Group</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Sistema de Requisiciones</p>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="text-gray-700 hover:text-brand-accent px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-brand-accent text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-accentDark transition-colors"
            >
              Consola de Administración
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-brand-accent"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/auth');
              }}
              className="w-full text-left px-3 py-2 text-base font-medium bg-brand-accent text-white rounded-md hover:bg-brand-accentDark"
            >
              Consola de Administración
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
