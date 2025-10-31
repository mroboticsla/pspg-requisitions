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
import { ArrowLeft, FileText, Users, Calendar, Briefcase, CheckCircle, XCircle, Clock, Trash2, Edit, AlertCircle, Laptop, Wrench } from 'lucide-react';
import { useToast } from '@/lib/useToast';
import { useAuth } from '@/app/providers/AuthProvider';
import ConfirmModal from '@/app/components/ConfirmModal';
import { CURRENCIES, type CurrencyValue } from '@/app/components/CurrencyInput';
import type { FormField } from '@/lib/types/requisitions';

const statusLabels: Record<RequisitionStatus, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  in_review: 'En Revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  filled: 'Cubierta',
};

// Paleta de estados con colores de marca (alineado a admin palette)
const statusColors: Record<RequisitionStatus, string> = {
  draft: 'bg-surface-tertiary text-admin-text-secondary border border-admin-border-DEFAULT',
  submitted: 'bg-admin-info/10 text-blue-800 border border-admin-info',
  in_review: 'bg-admin-warning/10 text-yellow-800 border border-admin-warning',
  approved: 'bg-admin-success/10 text-green-800 border border-admin-success',
  rejected: 'bg-red-50 text-red-800 border border-red-300',
  cancelled: 'bg-neutral-100 text-neutral-700 border border-admin-border-DEFAULT',
  filled: 'bg-brand-accent/10 text-brand-accent border border-brand-accent',
};

// Helpers de formato para campos personalizados en modo lectura
function formatCurrencyValue(value?: CurrencyValue): string {
  if (!value || value.amount == null) return '-';
  try {
    const formatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: value.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value.amount);
    // Agregar código para mayor claridad (p. ej., $12,345.00 MXN)
    return `${formatted} ${value.currency}`.trim();
  } catch {
    // Fallback manual si Intl falla con algún código
    const cur = CURRENCIES.find(c => c.code === (value.currency || 'USD'));
    const parts = value.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${cur?.symbol || ''}${parts} ${value.currency || ''}`.trim();
  }
}

function renderFieldValue(field: FormField, rawValue: any) {
  const label = (
    <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-2">{field.label}</p>
  );

  const container = (children: React.ReactNode) => (
    <div className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">{children}</div>
  );

  const valueOrDash = (v: any) => (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0) ? '—' : v);

  switch (field.field_type) {
    case 'text':
    case 'textarea':
      return (
        <div>
          {label}
          {container(<p className="text-sm text-admin-text-primary">{valueOrDash(String(rawValue || ''))}</p>)}
        </div>
      );
    case 'email':
      return (
        <div>
          {label}
          {container(
            rawValue ? (
              <a href={`mailto:${rawValue}`} className="text-sm text-admin-primary underline break-all">{rawValue}</a>
            ) : (
              <p className="text-sm text-admin-text-secondary">—</p>
            )
          )}
        </div>
      );
    case 'phone':
      return (
        <div>
          {label}
          {container(
            rawValue ? (
              <a href={`tel:${rawValue}`} className="text-sm text-admin-text-primary">{rawValue}</a>
            ) : (
              <p className="text-sm text-admin-text-secondary">—</p>
            )
          )}
        </div>
      );
    case 'number':
      return (
        <div>
          {label}
          {container(<p className="text-sm text-admin-text-primary">{rawValue != null ? Number(rawValue).toLocaleString('es-MX') : '—'}</p>)}
        </div>
      );
    case 'date':
      return (
        <div>
          {label}
          {container(<p className="text-sm text-admin-text-primary">{rawValue ? new Date(rawValue).toLocaleDateString() : '—'}</p>)}
        </div>
      );
    case 'select':
    case 'radio':
      return (
        <div>
          {label}
          {container(<p className="text-sm text-admin-text-primary">{valueOrDash(String(rawValue || ''))}</p>)}
        </div>
      );
    case 'multi-select':
      return (
        <div>
          {label}
          {container(
            Array.isArray(rawValue) && rawValue.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {rawValue.map((opt: string) => (
                  <span key={opt} className="px-2.5 py-1 rounded-admin-sm bg-admin-bg-hover text-admin-text-primary border border-admin-border-DEFAULT text-xs font-medium">{opt}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-admin-text-secondary">—</p>
            )
          )}
        </div>
      );
    case 'checkbox':
      return (
        <div>
          {label}
          {container(
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${rawValue ? 'bg-admin-success/10 text-admin-success border border-admin-success' : 'bg-red-50 text-red-700 border border-red-300'}`}>
              {rawValue ? 'Sí' : 'No'}
            </span>
          )}
        </div>
      );
    case 'currency': {
      const val: CurrencyValue | undefined = rawValue;
      return (
        <div>
          {label}
          {container(<p className="text-sm text-admin-text-primary">{formatCurrencyValue(val)}</p>)}
        </div>
      );
    }
    default:
      return (
        <div>
          {label}
          {container(<p className="text-sm text-admin-text-secondary">—</p>)}
        </div>
      );
  }
}

export default function RequisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requisitionId = params.id as string;
  const { success, error, warning, info } = useToast();

  const [requisition, setRequisition] = useState<RequisitionComplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<RequisitionStatus | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-primary mx-auto mb-4"></div>
          <p className="text-admin-text-secondary">Cargando detalles de la requisición...</p>
        </div>
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-admin-danger mx-auto mb-4" />
          <p className="text-admin-danger text-lg font-semibold">Requisición no encontrada</p>
          <button
            onClick={() => router.push('/requisitions')}
            className="mt-4 px-4 py-2 bg-admin-primary text-white rounded-admin hover:bg-admin-accent transition-colors"
          >
            Volver a Requisiciones
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 p-admin-md sm:p-admin-lg">
        {/* Botón Volver */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-admin-primary hover:text-admin-accent font-medium transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Requisiciones</span>
        </button>

        {/* Header con título y estado */}
        <div className="bg-admin-bg-card rounded-admin shadow-sm border border-admin-border-DEFAULT p-admin-lg">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <Briefcase className="w-8 h-8 text-admin-primary flex-shrink-0 mt-1" />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-admin-text-primary">
                    {requisition.puesto_requerido || 'Requisición'}
                  </h1>
                  <p className="mt-2 text-sm text-admin-text-secondary flex items-center gap-2">
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
        <div className="bg-admin-bg-card rounded-admin shadow-sm border border-admin-border-DEFAULT p-admin-lg">
          <h2 className="text-lg font-semibold text-admin-text-primary mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-admin-primary" />
            Acciones Disponibles
          </h2>
          <div className="flex flex-wrap gap-3">
            {/* Cambio de estado: solo admin/superadmin */}
            {isAdminRole && requisition.status === 'submitted' && (
              <>
                <button
                  onClick={() => requestStatusChange('in_review')}
                  className="flex items-center gap-2 px-4 py-2 bg-admin-warning text-white rounded-admin hover:bg-amber-600 transition-colors shadow-sm"
                >
                  <Clock className="w-4 h-4" />
                  Marcar en Revisión
                </button>
                <button
                  onClick={() => requestStatusChange('approved')}
                  className="flex items-center gap-2 px-4 py-2 bg-admin-success text-white rounded-admin hover:bg-admin-successHover transition-colors shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprobar
                </button>
                <button
                  onClick={() => requestStatusChange('rejected')}
                  className="flex items-center gap-2 px-4 py-2 bg-admin-danger text-white rounded-admin hover:bg-admin-dangerHover transition-colors shadow-sm"
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
                className="flex items-center gap-2 px-4 py-2 bg-neutral-600 text-white rounded-admin hover:bg-neutral-700 transition-colors shadow-sm"
              >
                <Clock className="w-4 h-4" />
                Regresar a Borrador
              </button>
            )}

            {isAdminRole && requisition.status === 'in_review' && (
              <>
                <button
                  onClick={() => handleStatusChange('approved')}
                  className="flex items-center gap-2 px-4 py-2 bg-admin-success text-white rounded-admin hover:bg-admin-successHover transition-colors shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprobar
                </button>
                <button
                  onClick={() => handleStatusChange('rejected')}
                  className="flex items-center gap-2 px-4 py-2 bg-admin-danger text-white rounded-admin hover:bg-admin-dangerHover transition-colors shadow-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Rechazar
                </button>
              </>
            )}

            {isAdminRole && requisition.status === 'approved' && (
              <button
                onClick={() => handleStatusChange('filled')}
                className="flex items-center gap-2 px-4 py-2 bg-admin-accent text-white rounded-admin hover:bg-admin-accentHover transition-colors shadow-sm"
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
                  className="flex items-center gap-2 px-4 py-2 bg-admin-secondary text-white rounded-admin hover:opacity-90 transition-colors shadow-sm"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-admin-danger text-white rounded-admin hover:bg-admin-dangerHover transition-colors shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </>
            )}

            {/* Mensaje de restricción para no admin/no dueño */}
            {!isAdminRole && !isDraft && !(isOwner && requisition.status === 'submitted') && (
              <p className="text-sm text-admin-text-secondary flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-admin-warning" />
                Solo los administradores pueden cambiar el estado. Puede revisar la información enviada.
              </p>
            )}
          </div>
        </div>

        {/* Datos Generales */}
        <div className="bg-admin-bg-card rounded-admin shadow-sm border border-admin-border-DEFAULT p-admin-lg">
          <h2 className="text-xl font-semibold text-admin-text-primary mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-admin-primary" />
            Datos Generales
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">
              <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-1">Departamento</p>
              <p className="text-sm text-admin-text-primary font-medium">{requisition.departamento || '—'}</p>
            </div>
            <div className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">
              <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Número de Vacantes
              </p>
              <p className="text-sm text-admin-text-primary font-medium">{requisition.numero_vacantes || 0}</p>
            </div>
            <div className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">
              <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Fecha de Creación
              </p>
              <p className="text-sm text-admin-text-primary font-medium">
                {new Date(requisition.created_at).toLocaleString()}
              </p>
            </div>
            {requisition.submitted_at && (
              <div className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">
                <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Fecha de Envío
                </p>
                <p className="text-sm text-admin-text-primary font-medium">
                  {new Date(requisition.submitted_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Información del Puesto */}
        <div className="bg-admin-bg-card rounded-admin shadow-sm border border-admin-border-DEFAULT p-admin-lg">
          <h2 className="text-xl font-semibold text-admin-text-primary mb-6 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-admin-primary" />
            Información del Puesto
          </h2>
          <div className="space-y-4">
            {requisition.tipo_puesto && (
              <div className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">
                <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-2">Tipo de Puesto</p>
                {(() => {
                  const t = requisition.tipo_puesto || {} as any;
                  const chips: string[] = [];
                  if (t.nuevaCreacion) chips.push('Nueva creación');
                  if (t.reemplazoTemporal) chips.push('Reemplazo temporal');
                  if (t.reemplazoDefinitivo) chips.push('Reemplazo definitivo');
                  if (t.incrementoPlantilla) chips.push('Incremento de plantilla');
                  return (
                    <div className="flex flex-wrap gap-2">
                      {chips.length > 0 ? chips.map((txt) => (
                        <span key={txt} className="px-2.5 py-1 rounded-admin-sm bg-admin-bg-hover text-admin-text-primary border border-admin-border-DEFAULT text-xs font-medium">{txt}</span>
                      )) : <p className="text-sm text-admin-text-secondary">—</p>}
                    </div>
                  );
                })()}
              </div>
            )}
            {requisition.motivo_puesto && (
              <div className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">
                <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-2">Motivo</p>
                <p className="text-sm text-admin-text-primary">{requisition.motivo_puesto}</p>
              </div>
            )}
            {requisition.nombre_empleado_reemplaza && (
              <div className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">
                <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-2">Empleado a Reemplazar</p>
                <p className="text-sm text-admin-text-primary">{requisition.nombre_empleado_reemplaza}</p>
              </div>
            )}
          </div>
        </div>

        {/* Funciones Principales */}
        {requisition.funciones_principales && requisition.funciones_principales.length > 0 && (
          <div className="bg-admin-bg-card rounded-admin shadow-sm border border-admin-border-DEFAULT p-admin-lg">
            <h2 className="text-xl font-semibold text-admin-text-primary mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-admin-primary" />
              Funciones Principales del Puesto
            </h2>
            <ol className="list-decimal list-inside space-y-3">
              {requisition.funciones_principales.map((funcion, index) => (
                <li key={index} className="text-sm text-admin-text-primary bg-surface-tertiary p-3 rounded-admin border border-admin-border-DEFAULT">
                  {funcion}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Perfil del Puesto */}
        <div className="bg-admin-bg-card rounded-admin shadow-sm border border-admin-border-DEFAULT p-admin-lg">
          <h2 className="text-xl font-semibold text-admin-text-primary mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-admin-primary" />
            Perfil del Puesto
          </h2>
          
          {requisition.formacion_academica && Object.keys(requisition.formacion_academica).length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-3">Formación Académica</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(requisition.formacion_academica).map(([key, value]) => (
                  value && (
                    <span key={key} className="px-3 py-1.5 bg-admin-bg-hover text-admin-text-primary border border-admin-border-DEFAULT rounded-admin text-sm font-medium">
                      {key}
                    </span>
                  )
                ))}
              </div>
            </div>
          )}

          {requisition.idioma_ingles && (
            <div className="bg-admin-success/10 rounded-admin p-admin-sm border border-admin-success">
              <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-1">Inglés Requerido</p>
              <p className="text-sm text-admin-success font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Sí
              </p>
            </div>
          )}
        </div>

        {/* Habilidad Informática */}
        {requisition.habilidad_informatica && (
          <div className="bg-admin-bg-card rounded-admin shadow-sm border border-admin-border-DEFAULT p-admin-lg">
            <h2 className="text-xl font-semibold text-admin-text-primary mb-6 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-admin-primary" />
              Habilidad Informática
            </h2>
            {(() => {
              const hi = requisition.habilidad_informatica as any;
              const nivelLabel: Record<string, string> = {
                basico: 'Básico',
                intermedio: 'Intermedio',
                avanzado: 'Avanzado',
                experto: 'Experto',
              };
              const nivelClass: Record<string, string> = {
                basico: 'bg-surface-tertiary text-admin-text-secondary border border-admin-border-DEFAULT',
                intermedio: 'bg-admin-info/10 text-blue-800 border border-admin-info',
                avanzado: 'bg-admin-warning/10 text-yellow-800 border border-admin-warning',
                experto: 'bg-admin-success/10 text-green-800 border border-admin-success',
              };
              const simpleSkills: Array<[string, string]> = [
                ['word', 'Word'],
                ['excel', 'Excel'],
                ['powerpoint', 'PowerPoint'],
                ['outlook', 'Outlook'],
                ['internet', 'Internet'],
              ];
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {simpleSkills.map(([key, label]) => {
                      const lvl = hi?.[key];
                      if (!lvl) return null;
                      return (
                        <div key={key} className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">
                          <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-2">{label}</p>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${nivelClass[lvl] || 'bg-surface-tertiary border border-admin-border-DEFAULT text-admin-text-secondary'}`}>
                            {nivelLabel[lvl] || lvl}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {Array.isArray(hi?.software_especifico) && hi.software_especifico.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-2">Software específico</p>
                      <div className="flex flex-wrap gap-2">
                        {hi.software_especifico.map((s: any, idx: number) => (
                          <span key={`${s.nombre}-${idx}`} className="px-2.5 py-1 rounded-admin-sm bg-admin-bg-hover text-admin-text-primary border border-admin-border-DEFAULT text-xs font-medium">
                            {s.nombre} {s.nivel ? `• ${nivelLabel[s.nivel] || s.nivel}` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Habilidades y Conocimientos Técnicos */}
        {requisition.habilidades_tecnicas && (
          <div className="bg-admin-bg-card rounded-admin shadow-sm border border-admin-border-DEFAULT p-admin-lg">
            <h2 className="text-xl font-semibold text-admin-text-primary mb-6 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-admin-primary" />
              Habilidades y Conocimientos Técnicos
            </h2>
            {(() => {
              const ht = requisition.habilidades_tecnicas as any;
              const items: Array<[string, string, boolean]> = [
                ['informacion', 'Información', !!ht?.informacion],
                ['maquinariaEquipos', 'Maquinaria y equipos', !!ht?.maquinariaEquipos],
                ['idiomas', 'Idiomas', !!ht?.idiomas],
                ['certificaciones', 'Certificaciones', !!ht?.certificaciones],
                ['licencias', 'Licencias', !!ht?.licencias],
              ];
              const enabled = items.filter(([, , v]) => v);
              return (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {enabled.length > 0 ? (
                      enabled.map(([key, label]) => (
                        <span key={key} className="px-2.5 py-1 rounded-admin-sm bg-surface-tertiary text-admin-text-primary border border-admin-border-DEFAULT text-xs font-medium">{label}</span>
                      ))
                    ) : (
                      <p className="text-sm text-admin-text-secondary">—</p>
                    )}
                  </div>
                  {ht?.detalles && (
                    <div className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">
                      <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-2">Detalles</p>
                      <p className="text-sm text-admin-text-primary whitespace-pre-line">{ht.detalles}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Secciones Personalizadas */}
        {requisition.custom_responses && requisition.custom_responses.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-admin-text-primary flex items-center gap-2">
              <FileText className="w-6 h-6 text-admin-primary" />
              Información Adicional
            </h2>
            {(() => {
              // Mapear respuestas por sección para acceso O(1)
              const responsesBySection = new Map<string, Record<string, any>>();
              requisition.custom_responses.forEach((resp) => {
                responsesBySection.set(resp.section_id, resp.responses || {});
              });

              // Iterar las secciones del snapshot en orden y sus campos en orden
              const sections = (requisition.template_snapshot?.sections || []).slice().sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));

              return sections.map((section: any) => {
                const sectionValues = responsesBySection.get(section.id) || {};
                return (
                  <div key={section.id} className="bg-admin-bg-card rounded-admin shadow-sm border border-admin-border-DEFAULT p-admin-lg">
                    <h3 className="text-lg font-semibold text-admin-text-primary mb-4">{section.name}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.fields
                        ?.slice()
                        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
                        .map((field: FormField) => (
                          <div key={field.id}>{renderFieldValue(field, sectionValues[field.name])}</div>
                        ))}
                    </div>
                  </div>
                );
              });
            })()}
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

      {/* Modal de confirmación para eliminación */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Eliminar requisición"
        message={
          <span>
            Esta acción <strong>no se puede deshacer</strong>. Se eliminará la solicitud de forma permanente.
            ¿Deseas continuar?
          </span>
        }
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDelete();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
