'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { listRequisitions } from '@/lib/requisitions';
import type { Requisition, RequisitionStatus } from '@/lib/types/requisitions';
import { FileText, Plus, Eye, Edit, Users, Calendar, Briefcase } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';

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

export default function MyRequisitionsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
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
      const requisitionsData = await listRequisitions({ created_by: profile.id });
      setRequisitions(requisitionsData);
    } catch (error) {
      console.error('Error loading requisitions:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mis requisiciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mis Requisiciones</h1>
          <p className="text-gray-600 mt-1">
            Tienes {requisitions.length} {requisitions.length === 1 ? 'requisición' : 'requisiciones'}
          </p>
        </div>
        <button 
          onClick={() => router.push('/request')}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-accent text-white hover:bg-brand-accentDark transition-colors w-full sm:w-auto shadow-sm text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Requisición</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { status: 'draft', label: 'Borradores', color: 'bg-gray-100 text-gray-800' },
          { status: 'submitted', label: 'Enviadas', color: 'bg-blue-100 text-blue-800' },
          { status: 'in_review', label: 'En Revisión', color: 'bg-yellow-100 text-yellow-800' },
          { status: 'approved', label: 'Aprobadas', color: 'bg-green-100 text-green-800' },
        ].map(({ status, label, color }) => {
          const count = requisitions.filter(r => r.status === status).length;
          return (
            <div key={status} className={`rounded-lg p-4 ${color}`}>
              <p className="text-xs font-medium">{label}</p>
              <p className="text-2xl font-bold mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
      </div>

      <div className="space-y-3">
        {filteredRequisitions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchTerm.trim() || statusFilter
                ? 'No se encontraron requisiciones con los criterios de búsqueda'
                : 'Aún no has creado ninguna requisición'}
            </p>
            {!searchTerm && !statusFilter && (
              <button
                onClick={() => router.push('/request')}
                className="mt-4 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accentDark transition-colors text-sm"
              >
                Crear mi primera requisición
              </button>
            )}
          </div>
        ) : (
          filteredRequisitions.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-brand-dark flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {req.puesto_requerido || 'Sin especificar'}
                      </h3>
                      {req.departamento && (
                        <p className="text-sm text-gray-600 mt-0.5">{req.departamento}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {req.numero_vacantes || 0} vacantes
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[req.status]}`}
                  >
                    {statusLabels[req.status]}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/requisitions/${req.id}`)}
                      className="p-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {req.status === 'draft' && (
                      <button
                        onClick={() => router.push(`/request?edit=${req.id}`)}
                        className="p-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
