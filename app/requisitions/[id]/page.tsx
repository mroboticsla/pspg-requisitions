'use client';

// =====================================================
// Página de Detalle de Requisición
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getRequisitionById,
  updateRequisitionStatus,
  deleteRequisition,
} from '@/lib/requisitions';
import type { RequisitionComplete, RequisitionStatus } from '@/lib/types/requisitions';

const statusLabels: Record<RequisitionStatus, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  in_review: 'En Revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  filled: 'Cubierta',
};

export default function RequisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requisitionId = params.id as string;

  const [requisition, setRequisition] = useState<RequisitionComplete | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRequisition = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRequisitionById(requisitionId);
      setRequisition(data);
    } catch (error) {
      console.error('Error loading requisition:', error);
    } finally {
      setLoading(false);
    }
  }, [requisitionId]);

  useEffect(() => {
    loadRequisition();
  }, [loadRequisition]);

  async function handleStatusChange(newStatus: RequisitionStatus) {
    if (!requisition) return;

    try {
      await updateRequisitionStatus(requisitionId, newStatus);
      loadRequisition();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al cambiar el estado');
    }
  }

  async function handleDelete() {
    if (!confirm('¿Está seguro de eliminar esta requisición?')) return;

    try {
      await deleteRequisition(requisitionId);
      router.push('/requisitions');
    } catch (error: any) {
      console.error('Error deleting requisition:', error);
      alert(error.message || 'Error al eliminar');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Requisición no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Volver a Requisiciones
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {requisition.puesto_requerido || 'Requisición'}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                ID: {requisition.id.substring(0, 8)}...
              </p>
            </div>

            <span className="px-4 py-2 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
              {statusLabels[requisition.status]}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Acciones</h2>
          <div className="flex flex-wrap gap-3">
            {requisition.status === 'submitted' && (
              <>
                <button
                  onClick={() => handleStatusChange('in_review')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Marcar en Revisión
                </button>
                <button
                  onClick={() => handleStatusChange('approved')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => handleStatusChange('rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Rechazar
                </button>
              </>
            )}

            {requisition.status === 'in_review' && (
              <>
                <button
                  onClick={() => handleStatusChange('approved')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => handleStatusChange('rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Rechazar
                </button>
              </>
            )}

            {requisition.status === 'approved' && (
              <button
                onClick={() => handleStatusChange('filled')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Marcar como Cubierta
              </button>
            )}

            {requisition.status === 'draft' && (
              <>
                <button
                  onClick={() => router.push(`/request?edit=${requisition.id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Eliminar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Datos Generales */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Datos Generales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Departamento</p>
              <p className="mt-1 text-gray-900">{requisition.departamento || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Número de Vacantes</p>
              <p className="mt-1 text-gray-900">{requisition.numero_vacantes || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Fecha de Creación</p>
              <p className="mt-1 text-gray-900">
                {new Date(requisition.created_at).toLocaleString()}
              </p>
            </div>
            {requisition.submitted_at && (
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha de Envío</p>
                <p className="mt-1 text-gray-900">
                  {new Date(requisition.submitted_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Información del Puesto */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Información del Puesto</h2>
          {requisition.motivo_puesto && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Motivo</p>
              <p className="mt-1 text-gray-900">{requisition.motivo_puesto}</p>
            </div>
          )}
          {requisition.nombre_empleado_reemplaza && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Empleado a Reemplazar</p>
              <p className="mt-1 text-gray-900">{requisition.nombre_empleado_reemplaza}</p>
            </div>
          )}
        </div>

        {/* Funciones Principales */}
        {requisition.funciones_principales && requisition.funciones_principales.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Funciones Principales del Puesto</h2>
            <ol className="list-decimal list-inside space-y-2">
              {requisition.funciones_principales.map((funcion, index) => (
                <li key={index} className="text-gray-900">
                  {funcion}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Perfil del Puesto */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Perfil del Puesto</h2>
          
          {requisition.formacion_academica && Object.keys(requisition.formacion_academica).length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Formación Académica</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(requisition.formacion_academica).map(([key, value]) => (
                  value && (
                    <span key={key} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {key}
                    </span>
                  )
                ))}
              </div>
            </div>
          )}

          {requisition.idioma_ingles && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Inglés Requerido</p>
              <p className="mt-1 text-green-600 font-medium">Sí</p>
            </div>
          )}
        </div>

        {/* Secciones Personalizadas */}
        {requisition.custom_responses && requisition.custom_responses.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Información Adicional</h2>
            {requisition.custom_responses.map((response) => {
              const section = requisition.template_snapshot?.sections?.find(
                (s: any) => s.id === response.section_id
              );

              if (!section) return null;

              return (
                <div key={response.section_id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {section.name}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(response.responses).map(([fieldName, value]) => {
                      const field = section.fields?.find((f: any) => f.name === fieldName);
                      if (!field) return null;

                      return (
                        <div key={fieldName}>
                          <p className="text-sm font-medium text-gray-500">{field.label}</p>
                          <p className="mt-1 text-gray-900">
                            {Array.isArray(value) ? value.join(', ') : String(value || '-')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
