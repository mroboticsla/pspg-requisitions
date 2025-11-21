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
import { ArrowLeft, FileText, Users, Calendar, Briefcase, CheckCircle, XCircle, Clock, Trash2, Edit, AlertCircle, Laptop, Wrench, Building2, Mail, Phone, Globe, User, ClipboardCopy } from 'lucide-react';
import { useToast } from '@/lib/useToast';
import { useAuth } from '@/app/providers/AuthProvider';
import ConfirmModal from '@/app/components/ConfirmModal';
import { CURRENCIES, type CurrencyValue } from '@/app/components/CurrencyInput';
import type { FormField } from '@/lib/types/requisitions';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentUserRole } from '@/lib/getCurrentUserRole';

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
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyContact, setCompanyContact] = useState<{ email?: string; phone?: string; mobile?: string; website?: string } | null>(null);
  const [creatorContact, setCreatorContact] = useState<{ first_name?: string | null; last_name?: string | null; phone?: string | null; email?: string | null; role?: string | null } | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  const isAdminRole = (profile?.roles?.name === 'admin' || profile?.roles?.name === 'superadmin');
  const isOwner = !!(user?.id && requisition?.created_by && user.id === requisition.created_by);
  const isDraft = requisition?.status === 'draft';

  const loadRequisition = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRequisitionById(requisitionId);

      // Validación de permisos
      if (data) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          throw new Error('Debe iniciar sesión para visualizar esta requisición.');
        }

        const role = await getCurrentUserRole();
        const isAdmin = role === 'admin' || role === 'superadmin';
        const isCreator = data.created_by === currentUser.id;

        if (!isAdmin && !isCreator) {
          // Verificar acceso a la empresa
          const { data: hasAccess } = await supabase.rpc('user_has_company_access', {
            p_company_id: data.company_id
          });

          if (!hasAccess) {
            throw new Error('No tiene permisos para visualizar esta requisición.');
          }
        }
      }

      setRequisition(data);
      // Cargar nombre de la empresa si procede
      if (data?.company_id) {
        try {
          const { data: comp, error: compErr } = await supabase
            .from('companies')
            .select('name')
            .eq('id', data.company_id)
            .single();
          if (!compErr && comp?.name) {
            setCompanyName(comp.name);
          } else {
            setCompanyName(null);
          }
        } catch (e) {
          console.warn('No se pudo obtener el nombre de la empresa', e);
          setCompanyName(null);
        }
      } else {
        setCompanyName(null);
      }
      // Cargar contacto extendido si rol admin
      if (data && isAdminRole) {
        setContactLoading(true);
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          if (token) {
            // Empresa
            if (data.company_id) {
              try {
                const res = await fetch(`/api/companies/${data.company_id}/contact`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                  const json = await res.json();
                  const contact = json.company?.contact_info || {};
                  setCompanyContact({
                    email: contact.email,
                    phone: contact.phone,
                    mobile: contact.mobile,
                    website: json.company?.website || undefined,
                  });
                } else {
                  setCompanyContact(null);
                }
              } catch (err) {
                console.warn('Error obteniendo contacto empresa', err);
                setCompanyContact(null);
              }
            }
            // Creador
            if (data.created_by) {
              try {
                const res = await fetch(`/api/users/${data.created_by}/contact`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                  const json = await res.json();
                  setCreatorContact(json.user || null);
                } else {
                  setCreatorContact(null);
                }
              } catch (err) {
                console.warn('Error obteniendo contacto creador', err);
                setCreatorContact(null);
              }
            }
          }
        } finally {
          setContactLoading(false);
        }
      }
    } catch (err: any) {
      console.error('Error loading requisition:', err);
      error(err?.message || 'Error al cargar la requisición');
    } finally {
      setLoading(false);
    }
  }, [requisitionId, error, isAdminRole]);

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
    // Mostrar confirmación SIEMPRE, independientemente del estado actual
    setPendingStatus(newStatus);
    setShowConfirm(true);
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
                  {/* Empresa visible para todos */}
                  <p className="mt-2 text-sm text-admin-text-secondary flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Empresa: {companyName || requisition.company_id || '—'}
                  </p>
                  {/* ID visible solo para admin/superadmin */}
                  {isAdminRole && (
                    <p className="mt-1 text-sm text-admin-text-secondary flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      ID: {requisition.id}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <span className={`px-4 py-2 text-sm font-semibold rounded-lg ${statusColors[requisition.status]} flex-shrink-0`}>
              {statusLabels[requisition.status]}
            </span>
          </div>
          {/* Bloque de contacto rápido para admin */}
          {isAdminRole && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">
                <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-3 flex items-center gap-1"><Building2 className="w-3 h-3" />Contacto Empresa</p>
                {contactLoading ? (
                  <p className="text-xs text-admin-text-secondary">Cargando contacto...</p>
                ) : companyContact ? (
                  <div className="space-y-2 text-sm">
                    {companyContact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-admin-primary" />
                        <a href={`mailto:${companyContact.email}`} className="text-admin-primary underline break-all">{companyContact.email}</a>
                        <button
                          aria-label="Copiar email"
                          onClick={() => navigator.clipboard.writeText(companyContact.email || '')}
                          className="p-1 rounded-admin-sm hover:bg-admin-bg-hover transition"
                        >
                          <ClipboardCopy className="w-3.5 h-3.5 text-admin-text-muted" />
                        </button>
                      </div>
                    )}
                    {(companyContact.phone || companyContact.mobile) && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-admin-primary" />
                        <a href={`tel:${companyContact.phone || companyContact.mobile}`} className="text-admin-text-primary">
                          {companyContact.phone || companyContact.mobile}
                        </a>
                        <button
                          aria-label="Copiar teléfono"
                          onClick={() => navigator.clipboard.writeText(companyContact.phone || companyContact.mobile || '')}
                          className="p-1 rounded-admin-sm hover:bg-admin-bg-hover transition"
                        >
                          <ClipboardCopy className="w-3.5 h-3.5 text-admin-text-muted" />
                        </button>
                      </div>
                    )}
                    {companyContact.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-admin-primary" />
                        <a href={companyContact.website.startsWith('http') ? companyContact.website : `https://${companyContact.website}`} target="_blank" rel="noopener noreferrer" className="text-admin-primary underline break-all">
                          {companyContact.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {!companyContact.email && !companyContact.phone && !companyContact.mobile && !companyContact.website && (
                      <p className="text-xs text-admin-text-secondary">Sin datos de contacto registrados.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-admin-text-secondary">No disponible</p>
                )}
              </div>
              <div className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">
                <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-3 flex items-center gap-1"><User className="w-3 h-3" />Contacto Solicitante</p>
                {contactLoading ? (
                  <p className="text-xs text-admin-text-secondary">Cargando contacto...</p>
                ) : creatorContact ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-admin-primary" />
                      <span className="text-admin-text-primary font-medium">{[creatorContact.first_name, creatorContact.last_name].filter(Boolean).join(' ') || '—'}</span>
                      {creatorContact.role && (
                        <span className="px-2 py-0.5 rounded-full bg-admin-bg-hover text-xs font-semibold text-admin-text-secondary border border-admin-border-DEFAULT">{creatorContact.role}</span>
                      )}
                    </div>
                    {creatorContact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-admin-primary" />
                        <a href={`mailto:${creatorContact.email}`} className="text-admin-primary underline break-all">{creatorContact.email}</a>
                        <button
                          aria-label="Copiar email"
                          onClick={() => navigator.clipboard.writeText(creatorContact.email || '')}
                          className="p-1 rounded-admin-sm hover:bg-admin-bg-hover transition"
                        >
                          <ClipboardCopy className="w-3.5 h-3.5 text-admin-text-muted" />
                        </button>
                      </div>
                    )}
                    {creatorContact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-admin-primary" />
                        <a href={`tel:${creatorContact.phone}`} className="text-admin-text-primary">{creatorContact.phone}</a>
                        <button
                          aria-label="Copiar teléfono"
                          onClick={() => navigator.clipboard.writeText(creatorContact.phone || '')}
                          className="p-1 rounded-admin-sm hover:bg-admin-bg-hover transition"
                        >
                          <ClipboardCopy className="w-3.5 h-3.5 text-admin-text-muted" />
                        </button>
                      </div>
                    )}
                    {!creatorContact.email && !creatorContact.phone && (
                      <p className="text-xs text-admin-text-secondary">Sin datos de contacto registrados.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-admin-text-secondary">No disponible</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sección superior de contacto (solo partners) */}
      {(profile?.roles?.name === 'partner') && (() => {
          // Datos estructurados para evitar duplicación y permitir escalabilidad
          const emailSubject = encodeURIComponent(`Consulta sobre Requisición ${requisition.id}`);
          const emailBody = encodeURIComponent(
            `Hola equipo PSP,\n\nSolicito información sobre la requisición:\n- ID: ${requisition.id}\n- Puesto: ${requisition.puesto_requerido || ''}\n- Empresa: ${companyName || requisition.company_id || ''}\n\nDetalle / Motivo: (agrega aquí)\n\nGracias.\n`
          );
          const contacts = [
            {
              key: 'support',
              label: 'Atención al Cliente',
              email: 'contacto@pspgroup.com.mx',
              Icon: Mail,
              description: 'Soporte general y dudas funcionales.'
            },
            {
              key: 'recruiting',
              label: 'Reclutamiento',
              email: 'reclutamientopsp@pspgroup.com.mx',
              Icon: Briefcase,
              description: 'Seguimiento del proceso y estado de vacantes.'
            }
          ];
          return (
            <div className="px-admin-md sm:px-admin-lg pt-admin-md">
              <div className="rounded-admin border border-admin-border-DEFAULT overflow-hidden bg-admin-bg-card">
                {/* Banda decorativa en colores de marca */}
                <div className="h-14 sm:h-16 bg-gradient-to-r from-admin-primary to-admin-accent" />
                {/* Contenido */}
                <div className="p-admin-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h2 className="text-lg font-semibold text-admin-text-primary flex items-center gap-2">
                      <Mail className="w-5 h-5 text-admin-primary" />
                      Información de Contacto
                    </h2>
                    <p className="text-[11px] text-admin-text-muted max-w-xl">Incluye siempre ID, empresa y contexto claro para acelerar la respuesta.</p>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
                    {contacts.map(({ key, label, email, Icon, description }) => (
                      <li key={key} className="group relative rounded-admin border border-admin-border-DEFAULT bg-surface-tertiary p-4 flex items-start gap-3 hover:shadow-sm transition-shadow focus-within:shadow-sm">
                        <div className="flex-shrink-0 p-2 rounded-admin bg-admin-accent text-white shadow-sm">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-admin-text-primary leading-tight">{label}</p>
                          <p className="text-[11px] text-admin-text-muted mb-1 line-clamp-2">{description}</p>
                          <p className="text-sm text-admin-text-secondary break-all" aria-label={`Email de ${label}`}>{email}</p>
                          <div className="mt-2 flex gap-2 flex-wrap">
                            <a
                              href={`mailto:${email}?subject=${emailSubject}&body=${emailBody}`}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-admin bg-admin-accent text-white hover:bg-admin-accentHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent/60 transition-colors font-medium shadow-sm"
                            >
                              Enviar correo
                            </a>
                            <button
                              type="button"
                              onClick={() => { navigator.clipboard.writeText(email); success('Correo copiado'); }}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-admin border border-admin-border-DEFAULT bg-admin-bg-card hover:bg-admin-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary/60 text-admin-text-primary transition-colors"
                              aria-label={`Copiar correo ${email}`}
                            >
                              Copiar
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })()}

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

            {isAdminRole && requisition.status === 'approved' && (
              <button
                onClick={() => requestStatusChange('filled')}
                className="flex items-center gap-2 px-4 py-2 bg-admin-accent text-white rounded-admin hover:bg-admin-accentHover transition-colors shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar como Cubierta
              </button>
            )}

            {/* Edición: admin/superadmin pueden editar SIEMPRE; dueño solo en borrador */}
            {isAdminRole ? (
              <>
                <button
                  onClick={() => router.push(`/request?edit=${requisition.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-admin-secondary text-white rounded-admin hover:opacity-90 transition-colors shadow-sm"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                {isDraft && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-admin-danger text-white rounded-admin hover:bg-admin-dangerHover transition-colors shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                )}
              </>
            ) : (
              isDraft && isOwner && (
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
              )
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
                  const t = (requisition.tipo_puesto || {}) as any;
                  const map: Array<[keyof typeof t, string]> = [
                    ['nuevaCreacion', 'Nueva creación'],
                    ['reemplazoTemporal', 'Reemplazo temporal'],
                    ['reestructuracionPuesto', 'Reestructuración del puesto'],
                    ['reemplazoDefinitivo', 'Reemplazo definitivo'],
                    ['renunciaVoluntaria', 'Renuncia voluntaria'],
                    ['promocion', 'Promoción'],
                    ['incapacidad', 'Incapacidad'],
                    ['cancelacionContrato', 'Cancelación del contrato'],
                    ['licencia', 'Licencia'],
                    ['vacaciones', 'Vacaciones'],
                    ['incrementoLabores', 'Incremento de labores'],
                    ['licenciaMaternidad', 'Licencia de maternidad'],
                    // Compatibilidad con posible clave histórica
                    ['incrementoPlantilla', 'Incremento de plantilla'],
                  ] as any;
                  const chips = map
                    .filter(([k]) => !!t?.[k])
                    .map(([, lbl]) => lbl as string)
                    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
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
              {(() => {
                const fa = requisition.formacion_academica as any;
                const labelMap: Record<string, string> = {
                  bachiller: 'Bachiller',
                  tecnico: 'Técnico',
                  profesional: 'Profesional',
                  especializacion: 'Especialización',
                  estudianteUniversitario: 'Estudiante universitario',
                };
                const chips = Object.keys(labelMap)
                  .filter((k) => !!fa?.[k])
                  .map((k) => labelMap[k])
                  .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
                return (
                  <div className="flex flex-wrap gap-2">
                    {chips.length > 0 ? (
                      chips.map((label) => (
                        <span key={label} className="px-3 py-1.5 bg-admin-bg-hover text-admin-text-primary border border-admin-border-DEFAULT rounded-admin text-sm font-medium">
                          {label}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-admin-text-secondary">—</p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {requisition.otros_estudios && requisition.otros_estudios.trim() !== '' && (
            <div className="mb-6">
              <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-2">Otros estudios</p>
              <div className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">
                <p className="text-sm text-admin-text-primary whitespace-pre-line">{requisition.otros_estudios}</p>
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
                ['base_datos', 'Base de datos'],
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
                  {(hi?.sistema_operativo?.windows || hi?.sistema_operativo?.otros) && (
                    <div className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">
                      <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-2">Sistema Operativo</p>
                      <div className="flex flex-wrap gap-2">
                        {hi?.sistema_operativo?.windows && (
                          <span className="px-2.5 py-1 rounded-admin-sm bg-admin-bg-hover text-admin-text-primary border border-admin-border-DEFAULT text-xs font-medium">Windows</span>
                        )}
                        {hi?.sistema_operativo?.otros && (
                          <span className="px-2.5 py-1 rounded-admin-sm bg-admin-bg-hover text-admin-text-primary border border-admin-border-DEFAULT text-xs font-medium">Otros</span>
                        )}
                      </div>
                    </div>
                  )}
                  {Array.isArray(hi?.software_especifico) && hi.software_especifico.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-2">Software específico</p>
                      <div className="flex flex-wrap gap-2">
                        {[...hi.software_especifico]
                          .sort((a: any, b: any) => String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es', { sensitivity: 'base' }))
                          .map((s: any, idx: number) => (
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
              const baseItems: Array<[string, string, boolean]> = [
                ['informacion', 'Información', !!ht?.informacion],
                ['maquinariaEquipos', 'Maquinaria y equipos', !!ht?.maquinariaEquipos],
                ['decisiones', 'Decisiones', !!ht?.decisiones],
                ['supervisionPersonal', 'Supervisión personal a cargo', !!ht?.supervisionPersonal],
              ];
              const enabled = baseItems.filter(([, , v]) => v);
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
                  {(ht?.responsabilidades?.confidencial || ht?.responsabilidades?.restringida) && (
                    <div className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">
                      <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-2">Responsabilidades</p>
                      <div className="flex flex-wrap gap-2">
                        {ht?.responsabilidades?.confidencial && (
                          <span className="px-2.5 py-1 rounded-admin-sm bg-admin-bg-hover text-admin-text-primary border border-admin-border-DEFAULT text-xs font-medium">Confidencial</span>
                        )}
                        {ht?.responsabilidades?.restringida && (
                          <span className="px-2.5 py-1 rounded-admin-sm bg-admin-bg-hover text-admin-text-primary border border-admin-border-DEFAULT text-xs font-medium">Restringida</span>
                        )}
                      </div>
                    </div>
                  )}
                  {(ht?.supervision?.directa || ht?.supervision?.indirecta) && (
                    <div className="bg-surface-tertiary rounded-admin p-admin-sm border border-admin-border-DEFAULT">
                      <p className="text-xs font-medium text-admin-text-muted uppercase tracking-wide mb-2">Supervisión</p>
                      <div className="flex flex-wrap gap-2">
                        {ht?.supervision?.directa && (
                          <span className="px-2.5 py-1 rounded-admin-sm bg-admin-bg-hover text-admin-text-primary border border-admin-border-DEFAULT text-xs font-medium">Directa</span>
                        )}
                        {ht?.supervision?.indirecta && (
                          <span className="px-2.5 py-1 rounded-admin-sm bg-admin-bg-hover text-admin-text-primary border border-admin-border-DEFAULT text-xs font-medium">Indirecta</span>
                        )}
                      </div>
                    </div>
                  )}
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
        message={(
          <span>
            Estado actual: <strong>{statusLabels[requisition.status]}</strong>.
            {pendingStatus === 'draft' ? (
              <>
                {' '}Al regresar a <strong>{statusLabels['draft']}</strong>, podrás editarla nuevamente y deberás volver a enviarla para su revisión/aprobación.
                {' '}¿Deseas continuar?
              </>
            ) : (
              <>
                {' '}¿Deseas cambiar su estado a <strong>{pendingStatus ? statusLabels[pendingStatus] : ''}</strong>?
              </>
            )}
          </span>
        )}
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
