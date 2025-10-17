'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicNavbar } from '../components/public/layout/PublicNavbar';
import { PublicFooter } from '../components/public/layout/PublicFooter';
import { Search, MapPin, Briefcase, DollarSign, Clock, Building } from 'lucide-react';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  posted: string;
}

const mockJobs: Job[] = [
  {
    id: 1,
    title: 'Gerente de Operaciones',
    company: 'Empresa Líder en Logística',
    location: 'Ciudad de México, México',
    type: 'Tiempo Completo',
    salary: '$45,000 - $65,000 MXN',
    description: 'Buscamos un profesional con experiencia en gestión de operaciones logísticas.',
    requirements: ['5+ años de experiencia', 'Título universitario', 'Liderazgo de equipos'],
    posted: 'Hace 2 días'
  },
  {
    id: 2,
    title: 'Director Financiero',
    company: 'Corporación Internacional',
    location: 'Ciudad de México, México',
    type: 'Tiempo Completo',
    salary: '$80,000 - $110,000 MXN',
    description: 'Responsable de dirigir la estrategia financiera de la organización.',
    requirements: ['10+ años de experiencia', 'MBA o CPA', 'Experiencia internacional'],
    posted: 'Hace 5 días'
  },
  {
    id: 3,
    title: 'Gerente de Ventas Regional',
    company: 'Empresa Tecnológica',
    location: 'Ciudad de México, México / Remoto',
    type: 'Híbrido',
    salary: '$55,000 - $75,000 MXN + Comisiones',
    description: 'Liderarás el equipo de ventas en la región latinoamericana.',
    requirements: ['7+ años en ventas B2B', 'Gestión de equipos', 'Inglés avanzado'],
    posted: 'Hace 1 semana'
  },
  {
    id: 4,
    title: 'Director de Recursos Humanos',
    company: 'Grupo Empresarial',
    location: 'Ciudad de México, México',
    type: 'Tiempo Completo',
    salary: '$65,000 - $90,000 MXN',
    description: 'Diseño e implementación de estrategias de talento humano.',
    requirements: ['8+ años en RRHH', 'Gestión del cambio', 'Certificaciones en RRHH'],
    posted: 'Hace 3 días'
  },
  {
    id: 5,
    title: 'Gerente de Marketing Digital',
    company: 'Agencia de Publicidad',
    location: 'Ciudad de México, México',
    type: 'Tiempo Completo',
    salary: '$40,000 - $60,000 MXN',
    description: 'Liderar estrategias de marketing digital y gestión de campañas.',
    requirements: ['5+ años en marketing digital', 'Google Ads & Meta Ads', 'Analytics'],
    posted: 'Hace 4 días'
  },
  {
    id: 6,
    title: 'Arquitecto de Soluciones Cloud',
    company: 'Empresa de TI',
    location: 'Remoto',
    type: 'Remoto',
    salary: '$70,000 - $95,000 MXN',
    description: 'Diseño de arquitecturas cloud y liderazgo técnico en proyectos.',
    requirements: ['6+ años en cloud', 'AWS/Azure certificado', 'Liderazgo técnico'],
    posted: 'Hace 1 día'
  }
];

export default function JobsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const filteredJobs = mockJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'all' || job.type === selectedType;
    const matchesLocation =
      selectedLocation === 'all' || job.location.includes(selectedLocation);

    return matchesSearch && matchesType && matchesLocation;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-brand-dark via-[#003A5C] to-brand-dark text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/10 to-transparent"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-10">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
                Portal de <span className="text-brand-accent">Empleos</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
                Conectamos talento excepcional con oportunidades profesionales que transforman carreras
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-2xl p-6 border-t-4 border-brand-accent">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por título, empresa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-gray-900 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-gray-900 transition-all"
                    >
                      <option value="all">Todos los tipos</option>
                      <option value="Tiempo Completo">Tiempo Completo</option>
                      <option value="Híbrido">Híbrido</option>
                      <option value="Remoto">Remoto</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-gray-900 transition-all"
                    >
                      <option value="all">Todas las ubicaciones</option>
                      <option value="Ciudad de México">Ciudad de México</option>
                      <option value="Remoto">Remoto</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Jobs List */}
        <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <p className="text-lg text-gray-700">
                Mostrando <span className="font-bold text-brand-accent text-xl">{filteredJobs.length}</span>{' '}
                {filteredJobs.length === 1 ? 'oportunidad' : 'oportunidades'} disponibles
              </p>
            </div>

            <div className="space-y-6">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-l-4 border-brand-accent hover:border-l-8"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-grow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-2xl font-bold text-brand-dark mb-2 hover:text-brand-accent transition-colors">
                            {job.title}
                          </h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <Building className="h-5 w-5 mr-2 text-brand-accent" />
                            <span className="font-medium">{job.company}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 mb-5">
                        <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                          <MapPin className="h-4 w-4 mr-2 text-brand-accent" />
                          <span className="text-sm font-medium">{job.location}</span>
                        </div>
                        <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                          <Briefcase className="h-4 w-4 mr-2 text-brand-accent" />
                          <span className="text-sm font-medium">{job.type}</span>
                        </div>
                        <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                          <DollarSign className="h-4 w-4 mr-2 text-brand-accent" />
                          <span className="text-sm font-medium">{job.salary}</span>
                        </div>
                        <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                          <Clock className="h-4 w-4 mr-2 text-brand-accent" />
                          <span className="text-sm font-medium">{job.posted}</span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-5 leading-relaxed">{job.description}</p>

                      <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-brand-dark mb-3 flex items-center">
                          <span className="w-1 h-5 bg-brand-accent mr-2 rounded"></span>
                          Requisitos principales:
                        </h4>
                        <ul className="space-y-2">
                          {job.requirements.map((req, index) => (
                            <li key={index} className="text-gray-700 flex items-start">
                              <span className="text-brand-accent mr-2 font-bold">•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="lg:ml-6 mt-4 lg:mt-0">
                      <button 
                        onClick={() => router.push('/contact')}
                        className="w-full lg:w-auto bg-brand-accent text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-accentDark transition-all duration-300 whitespace-nowrap shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        Aplicar Ahora
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredJobs.length === 0 && (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
                  <Search className="h-20 w-20 text-brand-accent mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-brand-dark mb-3">
                    No se encontraron resultados
                  </h3>
                  <p className="text-gray-600 text-lg">
                    Intenta ajustar tus filtros de búsqueda o términos de búsqueda
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-brand-dark to-[#003A5C] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/5 to-transparent"></div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ¿No encuentras lo que <span className="text-brand-accent">buscas</span>?
            </h2>
            <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
              Envíanos tu CV y te contactaremos cuando tengamos oportunidades que se
              ajusten a tu perfil profesional
            </p>
            <button 
              onClick={() => router.push('/contact')}
              className="bg-brand-accent text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-brand-accentDark transition-all duration-300 shadow-2xl hover:shadow-brand-accent/50 transform hover:-translate-y-1"
            >
              Enviar CV
            </button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
