'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Menu, X, ChevronDown } from 'lucide-react';
import Image from 'next/image'; // Import Image from next/image

export const PublicNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);
  const router = useRouter();

  const menuItems = [
    { name: 'Inicio', path: '/' },
    {
      name: 'Acerca de Nosotros',
      path: '/about',
      submenu: [
        { name: 'Nuestra Historia', path: '/about' },
        { name: 'Beneficios', path: '/benefits' }
      ]
    },
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
              <div className="relative h-8 sm:h-10 flex-shrink-0">
              <Image 
              src="/images/logo-web-dark.png" 
              alt="PSP logo" 
              width={240} 
              height={80} 
              className="h-8 sm:h-10 w-auto object-contain" 
              priority
              quality={100}
              unoptimized
              />
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <div key={item.path} className="relative group">
                <Link
                  href={item.path}
                  className="text-gray-700 hover:text-brand-accent px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
                >
                  {item.name}
                  {item.submenu && <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform" />}
                </Link>

                {/* Desktop Submenu */}
                {item.submenu && (
                  <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-50">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.path}
                        href={subitem.path}
                        className="block px-4 py-2 text-sm text-gray-700 hover:text-brand-accent hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors"
                      >
                        {subitem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={() => router.push('/auth')}
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
              <div key={item.path}>
                <div className="flex items-center justify-between">
                  <Link
                    href={item.path}
                    className="block flex-1 px-3 py-2 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md"
                    onClick={() => {
                      if (!item.submenu) setIsOpen(false);
                    }}
                  >
                    {item.name}
                  </Link>
                  {item.submenu && (
                    <button
                      onClick={() => setOpenSubmenu(openSubmenu === item.path ? null : item.path)}
                      className="px-2 py-2 text-gray-700 hover:text-brand-accent"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          openSubmenu === item.path ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* Mobile Submenu */}
                {item.submenu && openSubmenu === item.path && (
                  <div className="bg-gray-50 rounded-md pl-4">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.path}
                        href={subitem.path}
                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-100 rounded-md"
                        onClick={() => {
                          setIsOpen(false);
                          setOpenSubmenu(null);
                        }}
                      >
                        {subitem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
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
