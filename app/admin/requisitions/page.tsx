'use client';

// =====================================================
// Página de Gestión de Requisiciones (ADMIN)
// =====================================================
// Vista completa para administradores con todas las requisiciones
// del sistema, estadísticas globales y filtros avanzados

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { listRequisitions, getRequisitionStats } from '@/lib/requisitions';
import type { Requisition, RequisitionStatus, RequisitionStats } from '@/lib/types/requisitions';
import { FileText, Eye, Users, Calendar, Briefcase, Download, Filter, Edit } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useToast } from '@/lib/useToast';

const statusLabels: Record<RequisitionStatus, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  in_review: 'En Revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  filled: 'Cubierta',
};

const statusColors: Record<RequisitionStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  filled: 'bg-purple-100 text-purple-800',
};

export default function AdminRequisitionsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { error } = useToast();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [stats, setStats] = useState<RequisitionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequisitionStatus | ''>('');

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      const matchesStatus = !statusFilter || req.status === statusFilter;
      const matchesSearch = !searchTerm.trim() || 
        req.puesto_requerido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.departamento?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [requisitions, statusFilter, searchTerm]);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      
      // Admins ven TODAS las requisiciones del sistema
      const [requisitionsData, statsData] = await Promise.all([
        listRequisitions({}),
        getRequisitionStats(),
      ]);

      setRequisitions(requisitionsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      error(err?.message || 'Error al cargar los datos de requisiciones');
    } finally {
      setLoading(false);
    }
  }, [profile?.id, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Requisiciones</h1>
            <p className="text-gray-600 mt-1">Panel de control administrativo - Total: {requisitions.length} requisiciones</p>
          </div>
          <div className="flex gap-2">
            <button 
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium"
              onClick={() => alert('Funcionalidad de exportación próximamente')}
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Estadísticas completas */}
        {stats && stats.by_status && (
          <>
            {/* Mobile: Carrusel horizontal con scroll */}
            <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-3 pb-2">
                {Object.entries(statusLabels).map(([status, label]) => {
                  const count = stats.by_status?.[status as RequisitionStatus] ?? 0;
                  const colors = {
                    draft: 'from-neutral-500 to-neutral-600',
                    submitted: 'from-brand-dark to-[#003d66]',
                    in_review: 'from-amber-600 to-amber-700',
                    approved: 'from-emerald-600 to-emerald-700',
                    rejected: 'from-neutral-600 to-neutral-700',
                    cancelled: 'from-neutral-400 to-neutral-500',
                    filled: 'from-brand-accent to-brand-accentDark',
                  };
                  
                  return (
                    <div 
                      key={status}
                      className={`bg-gradient-to-br ${colors[status as RequisitionStatus]} rounded-lg shadow-md p-5 text-white flex-shrink-0 w-[280px] cursor-pointer hover:scale-105 transition-transform`}
                      onClick={() => setStatusFilter(statusFilter === status ? '' : status as RequisitionStatus)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-white text-sm font-medium">{label}</p>
                          <p className="text-4xl font-bold mt-2">{count}</p>
                        </div>
                        <FileText className="w-16 h-16 text-white opacity-40" />
                      </div>
                      <div className="flex items-center text-white text-xs border-t border-white/20 pt-3">
                        <FileText className="w-4 h-4 mr-1.5" />
                        <span>Requisiciones</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop: Grid tradicional */}
            <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(statusLabels).map(([status, label]) => {
                const count = stats.by_status?.[status as RequisitionStatus] ?? 0;
                const colors = {
                  draft: 'from-neutral-500 to-neutral-600',
                  submitted: 'from-brand-dark to-[#003d66]',
                  in_review: 'from-amber-600 to-amber-700',
                  approved: 'from-emerald-600 to-emerald-700',
                  rejected: 'from-neutral-600 to-neutral-700',
                  cancelled: 'from-neutral-400 to-neutral-500',
                  filled: 'from-brand-accent to-brand-accentDark',
                };
                
                return (
                  <div 
                    key={status}
                    className={`bg-gradient-to-br ${colors[status as RequisitionStatus]} rounded-lg shadow-md p-6 text-white cursor-pointer hover:scale-105 transition-transform`}
                    onClick={() => setStatusFilter(statusFilter === status ? '' : status as RequisitionStatus)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">{label}</p>
                        <p className="text-3xl font-bold mt-2">{count}</p>
                      </div>
                      <FileText className="w-12 h-12 text-white opacity-80" />
                    </div>
                    <div className="mt-4 flex items-center text-white text-sm">
                      <FileText className="w-4 h-4 mr-1" />
                      Requisiciones
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Filtros avanzados */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filtros</h3>
            {(searchTerm || statusFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                }}
                className="ml-auto text-sm text-brand-accent hover:text-brand-accentDark transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Búsqueda
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por puesto o departamento..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RequisitionStatus | '')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
              >
                <option value="">Todos los estados</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredRequisitions.length > 0 && (
            <p className="text-sm text-gray-600 mt-3">
              Mostrando {filteredRequisitions.length} de {requisitions.length} requisiciones
            </p>
          )}
        </div>

        {/* Listado de requisiciones - diseño compacto */}
        <div className="rounded-lg shadow-sm overflow-hidden border border-gray-200">
          {/* Header de tabla solo en desktop */}
          <div className="hidden lg:block bg-gradient-to-r from-brand-dark to-[#003d66] text-white px-4 py-2.5 border-b border-gray-300">
            <div className="flex items-center gap-4">
              <div className="w-24 flex-shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wide">Estado</span>
              </div>
              <div className="flex-1 min-w-[200px]">
                <span className="text-xs font-semibold uppercase tracking-wide">Puesto</span>
              </div>
              <div className="w-32 flex-shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wide">Departamento</span>
              </div>
              <div className="w-24 flex-shrink-0 text-center">
                <span className="text-xs font-semibold uppercase tracking-wide">Vacantes</span>
              </div>
              <div className="w-32 flex-shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wide">Fecha</span>
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wide">Acciones</span>
              </div>
            </div>
          </div>
          
          <div>
            {filteredRequisitions.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm bg-white">
                {searchTerm.trim() || statusFilter
                  ? 'No se encontraron requisiciones con los criterios de búsqueda'
                  : 'No hay requisiciones registradas aún'}
              </div>
            )}
            {filteredRequisitions.map((req, index) => {
              // Efecto striped: alternar entre blanco y gris claro
              const isEven = index % 2 === 0;
              const bgColor = isEven ? 'bg-white' : 'bg-gray-100';
              const hoverColor = isEven ? 'hover:bg-gray-50' : 'hover:bg-gray-200';
              
              return (
                <div
                  key={req.id}
                  className={`p-3 sm:p-4 ${bgColor} ${hoverColor} transition-colors border-b border-gray-200 last:border-b-0`}
                >
                  {/* Mobile: Layout compacto vertical */}
                  <div className="flex flex-col gap-2 lg:hidden">
                    {/* Header con puesto y estado */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Briefcase className="w-4 h-4 text-brand-dark flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-gray-900 leading-tight">
                            {req.puesto_requerido || 'Sin especificar'}
                          </h3>
                          {req.departamento && (
                            <p className="text-xs text-gray-600 leading-tight mt-0.5">{req.departamento}</p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`flex-shrink-0 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusColors[req.status]
                        }`}
                      >
                        {statusLabels[req.status]}
                      </span>
                    </div>
                    
                    {/* Info condensada en una línea */}
                    <div className="flex items-center gap-3 text-xs text-gray-600 ml-6">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {req.numero_vacantes || 0} vacantes
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Botón de ver detalles */}
                    <div className="mt-1">
                      <button
                        onClick={() => router.push(`/requisitions/${req.id}`)}
                        className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Detalles</span>
                      </button>
                    </div>
                  </div>

                  {/* Desktop: Layout horizontal tipo tabla */}
                  <div className="hidden lg:flex lg:items-center lg:gap-4">
                    {/* Columna 1: Estado */}
                    <div className="w-24 flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          statusColors[req.status]
                        }`}
                      >
                        {statusLabels[req.status]}
                      </span>
                    </div>

                    {/* Columna 2: Puesto */}
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-brand-dark flex-shrink-0" />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 truncate">
                            {req.puesto_requerido || 'Sin especificar'}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Columna 3: Departamento */}
                    <div className="w-32 flex-shrink-0">
                      <p className="text-xs text-gray-600 truncate">
                        {req.departamento || <span className="text-gray-400">Sin departamento</span>}
                      </p>
                    </div>

                    {/* Columna 4: Vacantes */}
                    <div className="w-24 flex-shrink-0 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-900">{req.numero_vacantes || 0}</span>
                      </div>
                    </div>

                    {/* Columna 5: Fecha */}
                    <div className="w-32 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <p className="text-xs text-gray-600">
                          {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Columna 6: Acciones */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => router.push(`/requisitions/${req.id}`)}
                        className="p-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
