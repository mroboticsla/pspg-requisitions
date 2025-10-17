'use client';

import React, { useState } from 'react';
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
    location: 'Ciudad de Panamá',
    type: 'Tiempo Completo',
    salary: '$3,500 - $5,000',
    description: 'Buscamos un profesional con experiencia en gestión de operaciones logísticas.',
    requirements: ['5+ años de experiencia', 'Título universitario', 'Liderazgo de equipos'],
    posted: 'Hace 2 días'
  },
  {
    id: 2,
    title: 'Director Financiero',
    company: 'Corporación Internacional',
    location: 'Ciudad de Panamá',
    type: 'Tiempo Completo',
    salary: '$6,000 - $8,000',
    description: 'Responsable de dirigir la estrategia financiera de la organización.',
    requirements: ['10+ años de experiencia', 'MBA o CPA', 'Experiencia internacional'],
    posted: 'Hace 5 días'
  },
  {
    id: 3,
    title: 'Gerente de Ventas Regional',
    company: 'Empresa Tecnológica',
    location: 'Panamá / Remoto',
    type: 'Híbrido',
    salary: '$4,000 - $6,000 + Comisiones',
    description: 'Liderarás el equipo de ventas en la región centroamericana.',
    requirements: ['7+ años en ventas B2B', 'Gestión de equipos', 'Inglés avanzado'],
    posted: 'Hace 1 semana'
  },
  {
    id: 4,
    title: 'Director de Recursos Humanos',
    company: 'Grupo Empresarial',
    location: 'Ciudad de Panamá',
    type: 'Tiempo Completo',
    salary: '$5,000 - $7,000',
    description: 'Diseño e implementación de estrategias de talento humano.',
    requirements: ['8+ años en RRHH', 'Gestión del cambio', 'Certificaciones en RRHH'],
    posted: 'Hace 3 días'
  },
  {
    id: 5,
    title: 'Gerente de Marketing Digital',
    company: 'Agencia de Publicidad',
    location: 'Ciudad de Panamá',
    type: 'Tiempo Completo',
    salary: '$3,000 - $4,500',
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
    salary: '$5,500 - $7,500',
    description: 'Diseño de arquitecturas cloud y liderazgo técnico en proyectos.',
    requirements: ['6+ años en cloud', 'AWS/Azure certificado', 'Liderazgo técnico'],
    posted: 'Hace 1 día'
  }
];

export default function JobsPage() {
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
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold mb-4">Portal de Empleos</h1>
              <p className="text-xl text-blue-100">
                Descubre oportunidades profesionales que transforman carreras
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por título, empresa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="all">Todas las ubicaciones</option>
                      <option value="Ciudad de Panamá">Ciudad de Panamá</option>
                      <option value="Remoto">Remoto</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Jobs List */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <p className="text-gray-600">
                Mostrando <span className="font-semibold">{filteredJobs.length}</span>{' '}
                {filteredJobs.length === 1 ? 'oportunidad' : 'oportunidades'}
              </p>
            </div>

            <div className="space-y-6">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-grow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {job.title}
                          </h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <Building className="h-4 w-4 mr-2" />
                            <span>{job.company}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Briefcase className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{job.type}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{job.salary}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-blue-600" />
                          <span>{job.posted}</span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{job.description}</p>

                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Requisitos principales:
                        </h4>
                        <ul className="list-disc list-inside space-y-1">
                          {job.requirements.map((req, index) => (
                            <li key={index} className="text-gray-600">
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="lg:ml-6 mt-4 lg:mt-0">
                      <button className="w-full lg:w-auto bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors whitespace-nowrap">
                        Aplicar Ahora
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredJobs.length === 0 && (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No se encontraron resultados
                  </h3>
                  <p className="text-gray-600">
                    Intenta ajustar tus filtros de búsqueda o términos de búsqueda
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿No encuentras lo que buscas?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Envíanos tu CV y te contactaremos cuando tengamos oportunidades que se
              ajusten a tu perfil
            </p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors">
              Enviar CV
            </button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
