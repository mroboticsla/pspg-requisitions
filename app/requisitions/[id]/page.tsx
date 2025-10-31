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
import { ArrowLeft, FileText, Users, Calendar, Briefcase, CheckCircle, XCircle, Clock, Trash2, Edit, AlertCircle } from 'lucide-react';
import { useToast } from '@/lib/useToast';
import { useAuth } from '@/app/providers/AuthProvider';
import ConfirmModal from '@/app/components/ConfirmModal';

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
  draft: 'bg-neutral-100 text-neutral-800 border border-neutral-300',
  submitted: 'bg-blue-50 text-brand-dark border border-blue-200',
  in_review: 'bg-amber-50 text-amber-800 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  rejected: 'bg-red-50 text-red-800 border border-red-200',
  cancelled: 'bg-neutral-100 text-neutral-700 border border-neutral-300',
  filled: 'bg-pink-50 text-brand-accent border border-pink-200',
};

export default function RequisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requisitionId = params.id as string;
  const { success, error, warning, info } = useToast();

  const [requisition, setRequisition] = useState<RequisitionComplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<RequisitionStatus | null>(null);
  const { user, profile } = useAuth();

  const isAdminRole = (profile?.roles?.name === 'admin' || profile?.roles?.name === 'superadmin');
  const isOwner = !!(user?.id && requisition?.created_by && user.id === requisition.created_by);
  const isDraft = requisition?.status === 'draft';

  const loadRequisition = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRequisitionById(requisitionId);
      setRequisition(data);
    } catch (err: any) {
      console.error('Error loading requisition:', err);
      error(err?.message || 'Error al cargar la requisición');
    } finally {
      setLoading(false);
    }
  }, [requisitionId, error]);

  useEffect(() => {
    loadRequisition();
  }, [loadRequisition]);

  async function handleStatusChange(newStatus: RequisitionStatus) {
    if (!requisition) return;

    const statusMessages: Record<RequisitionStatus, string> = {
      draft: 'movida a borrador',
      submitted: 'enviada',
      in_review: 'marcada en revisión',
      approved: 'aprobada',
      rejected: 'rechazada',
      cancelled: 'cancelada',
      filled: 'marcada como cubierta',
    };

    try {
      await updateRequisitionStatus(requisitionId, newStatus);
      success(`¡Requisición ${statusMessages[newStatus]} exitosamente!`);
      loadRequisition();
    } catch (err: any) {
      console.error('Error updating status:', err);
      error(err?.message || 'Error al cambiar el estado de la requisición');
    }
  }

  function requestStatusChange(newStatus: RequisitionStatus) {
    // Solo mostramos modal si la requisición está en 'submitted'
    if (requisition?.status === 'submitted') {
      setPendingStatus(newStatus);
      setShowConfirm(true);
      return;
    }
    // Para otros estados, proceder directamente
    handleStatusChange(newStatus);
  }

  async function handleDelete() {
    if (!confirm('¿Está seguro de eliminar esta requisición? Esta acción no se puede deshacer.')) return;

    try {
      await deleteRequisition(requisitionId);
      success('¡Requisición eliminada exitosamente!');
      router.push('/requisitions');
    } catch (err: any) {
      console.error('Error deleting requisition:', err);
      error(err?.message || 'Error al eliminar la requisición');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles de la requisición...</p>
        </div>
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg font-semibold">Requisición no encontrada</p>
          <button
            onClick={() => router.push('/requisitions')}
            className="mt-4 px-4 py-2 bg-brand-dark text-white rounded-lg hover:bg-[#003d66] transition-colors"
          >
            Volver a Requisiciones
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 p-4 sm:p-6">
        {/* Botón Volver */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-brand-dark hover:text-[#003d66] font-medium transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Requisiciones</span>
        </button>

        {/* Header con título y estado */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <Briefcase className="w-8 h-8 text-brand-dark flex-shrink-0 mt-1" />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {requisition.puesto_requerido || 'Requisición'}
                  </h1>
                  <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    ID: {requisition.id.substring(0, 8)}...
                  </p>
                </div>
              </div>
            </div>

            <span className={`px-4 py-2 text-sm font-semibold rounded-lg ${statusColors[requisition.status]} flex-shrink-0`}>
              {statusLabels[requisition.status]}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-dark" />
            Acciones Disponibles
          </h2>
          <div className="flex flex-wrap gap-3">
            {/* Cambio de estado: solo admin/superadmin */}
            {isAdminRole && requisition.status === 'submitted' && (
              <>
                <button
                  onClick={() => requestStatusChange('in_review')}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
                >
                  <Clock className="w-4 h-4" />
                  Marcar en Revisión
                </button>
                <button
                  onClick={() => requestStatusChange('approved')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprobar
                </button>
                <button
                  onClick={() => requestStatusChange('rejected')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Rechazar
                </button>
              </>
            )}

            {/* Dueño puede regresar Enviada -> Borrador */}
            {isOwner && requisition.status === 'submitted' && (
              <button
                onClick={() => requestStatusChange('draft')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
              >
                <Clock className="w-4 h-4" />
                Regresar a Borrador
              </button>
            )}

            {isAdminRole && requisition.status === 'in_review' && (
              <>
                <button
                  onClick={() => handleStatusChange('approved')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprobar
                </button>
                <button
                  onClick={() => handleStatusChange('rejected')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Rechazar
                </button>
              </>
            )}

            {isAdminRole && requisition.status === 'approved' && (
              <button
                onClick={() => handleStatusChange('filled')}
                className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accentDark transition-colors shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar como Cubierta
              </button>
            )}

            {/* Edición/Eliminación: creador con borrador, o admin */}
            {isDraft && (isOwner || isAdminRole) && (
              <>
                <button
                  onClick={() => router.push(`/request?edit=${requisition.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </>
            )}

            {/* Mensaje de restricción para no admin/no dueño */}
            {!isAdminRole && !isDraft && !(isOwner && requisition.status === 'submitted') && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Solo los administradores pueden cambiar el estado. Puede revisar la información enviada.
              </p>
            )}
          </div>
        </div>

        {/* Datos Generales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-dark" />
            Datos Generales
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Departamento</p>
              <p className="text-sm text-gray-900 font-medium">{requisition.departamento || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Número de Vacantes
              </p>
              <p className="text-sm text-gray-900 font-medium">{requisition.numero_vacantes || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Fecha de Creación
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {new Date(requisition.created_at).toLocaleString()}
              </p>
            </div>
            {requisition.submitted_at && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Fecha de Envío
                </p>
                <p className="text-sm text-gray-900 font-medium">
                  {new Date(requisition.submitted_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Información del Puesto */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-dark" />
            Información del Puesto
          </h2>
          <div className="space-y-4">
            {requisition.motivo_puesto && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Motivo</p>
                <p className="text-sm text-gray-900">{requisition.motivo_puesto}</p>
              </div>
            )}
            {requisition.nombre_empleado_reemplaza && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Empleado a Reemplazar</p>
                <p className="text-sm text-gray-900">{requisition.nombre_empleado_reemplaza}</p>
              </div>
            )}
          </div>
        </div>

        {/* Funciones Principales */}
        {requisition.funciones_principales && requisition.funciones_principales.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-brand-dark" />
              Funciones Principales del Puesto
            </h2>
            <ol className="list-decimal list-inside space-y-3">
              {requisition.funciones_principales.map((funcion, index) => (
                <li key={index} className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {funcion}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Perfil del Puesto */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-dark" />
            Perfil del Puesto
          </h2>
          
          {requisition.formacion_academica && Object.keys(requisition.formacion_academica).length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Formación Académica</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(requisition.formacion_academica).map(([key, value]) => (
                  value && (
                    <span key={key} className="px-3 py-1.5 bg-blue-50 text-brand-dark border border-blue-200 rounded-lg text-sm font-medium">
                      {key}
                    </span>
                  )
                ))}
              </div>
            </div>
          )}

          {requisition.idioma_ingles && (
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Inglés Requerido</p>
              <p className="text-sm text-emerald-700 font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Sí
              </p>
            </div>
          )}
        </div>

        {/* Secciones Personalizadas */}
        {requisition.custom_responses && requisition.custom_responses.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-brand-dark" />
              Información Adicional
            </h2>
            {requisition.custom_responses.map((response) => {
              const section = requisition.template_snapshot?.sections?.find(
                (s: any) => s.id === response.section_id
              );

              if (!section) return null;

              return (
                <div key={response.section_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {section.name}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(response.responses).map(([fieldName, value]) => {
                      const field = section.fields?.find((f: any) => f.name === fieldName);
                      if (!field) return null;

                      return (
                        <div key={fieldName} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{field.label}</p>
                          <p className="text-sm text-gray-900">
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

      {/* Modal de confirmación para cambios desde "Enviada" */}
      <ConfirmModal
        isOpen={showConfirm}
        title="Confirmar cambio de estado"
        message={
          pendingStatus === 'draft'
            ? (
                <span>
                  Esta requisición está <strong>Enviada</strong>.
                  Al regresar a <strong>Borrador</strong>, podrás editarla nuevamente y deberás volver a enviarla para su revisión/aprobación.
                  ¿Deseas continuar?
                </span>
              )
            : (
                <span>
                  Esta requisición está <strong>Enviada</strong>. ¿Deseas cambiar su estado a <strong>{pendingStatus ? statusLabels[pendingStatus] : ''}</strong>?
                </span>
              )
        }
        confirmText="Sí, cambiar estado"
        cancelText="Cancelar"
        type="warning"
        onConfirm={() => {
          setShowConfirm(false);
          if (pendingStatus) {
            handleStatusChange(pendingStatus);
          }
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
