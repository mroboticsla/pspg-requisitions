"use client";

import { Search, MapPin, DollarSign, Briefcase } from 'lucide-react';

export default function CandidateJobsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Búsqueda de Empleos</h1>
            <p className="text-sm text-gray-500 mt-1">
              Encuentra oportunidades que se ajusten a tu perfil profesional
            </p>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por puesto, habilidades o empresa..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent focus:border-transparent"
            />
          </div>
          <button className="px-6 py-2 bg-brand-dark text-white rounded-md hover:bg-brand-accent transition-colors">
            Buscar
          </button>
        </div>

        {/* Filtros rápidos */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 hover:bg-gray-50">
            <MapPin className="inline h-3 w-3 mr-1" />
            Ubicación
          </button>
          <button className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 hover:bg-gray-50">
            <DollarSign className="inline h-3 w-3 mr-1" />
            Salario
          </button>
          <button className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 hover:bg-gray-50">
            <Briefcase className="inline h-3 w-3 mr-1" />
            Tipo de empleo
          </button>
        </div>
      </div>

      {/* Placeholder de resultados */}
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8 text-brand-dark" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Próximamente
          </h3>
          <p className="text-sm text-gray-500">
            Esta sección estará disponible próximamente. Aquí podrás buscar y postularte a ofertas de empleo.
          </p>
        </div>
      </div>
    </div>
  );
}
