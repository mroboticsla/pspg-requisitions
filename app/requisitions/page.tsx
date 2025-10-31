"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { listRequisitions } from "@/lib/requisitions";
import type { Requisition, RequisitionStatus } from "@/lib/types/requisitions";
import { FileText, Plus, Eye, Edit, Users, Calendar, Briefcase } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToast } from "@/lib/useToast";
import { supabase } from "@/lib/supabaseClient";
import type { Company } from "@/lib/types/company";

const statusLabels: Record<RequisitionStatus, string> = {
  draft: "Borrador",
  submitted: "Enviada",
  in_review: "En Revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
  filled: "Cubierta",
};

const statusColors: Record<RequisitionStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  in_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
  filled: "bg-purple-100 text-purple-800",
};

export default function MyRequisitionsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { error } = useToast();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequisitionStatus | "">("");
  
  const userRole = (profile as any)?.roles?.name || null;

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      const matchesStatus = !statusFilter || req.status === statusFilter;
      const matchesSearch =
        !searchTerm.trim() ||
        req.puesto_requerido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.departamento?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [requisitions, statusFilter, searchTerm]);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      let requisitionsData: Requisition[] = [];

      // Admin/Superadmin: ver todas las requisiciones (RLS limitará si aplica)
      if (userRole === 'admin' || userRole === 'superadmin') {
        requisitionsData = await listRequisitions({});
      } else {
        // Otros roles: obtener empresas asignadas y filtrar por ellas
        const { data: userCompanies, error: companiesAccessError } = await supabase.rpc('get_user_companies');
        if (companiesAccessError) {
          console.error('Error al obtener empresas del usuario:', companiesAccessError);
          throw new Error('No se pudo verificar el acceso a empresas');
        }

        const companyIds = (userCompanies || []).map((c: any) => c.company_id).filter(Boolean);

        if (companyIds.length === 0) {
          requisitionsData = [];
        } else {
          requisitionsData = await listRequisitions({ company_ids: companyIds });
        }
      }

      setRequisitions(requisitionsData);

      // Cargar nombres de empresas para las tarjetas
      const uniqueCompanyIds = Array.from(new Set((requisitionsData || []).map((r) => r.company_id).filter(Boolean)));
      if (uniqueCompanyIds.length > 0) {
        const { data: companies, error: companiesError } = await supabase
          .from("companies")
          .select("id, name")
          .in("id", uniqueCompanyIds);

        if (companiesError) {
          console.warn("No se pudieron cargar los nombres de empresas:", companiesError.message);
        } else if (companies) {
          const map: Record<string, string> = {};
          (companies as Pick<Company, "id" | "name">[]).forEach((c) => {
            map[c.id] = c.name;
          });
          setCompanyNames(map);
        }
      } else {
        setCompanyNames({});
      }
    } catch (err: any) {
      console.error("Error loading requisitions:", err);
      error(err?.message || "Error al cargar las requisiciones");
    } finally {
      setLoading(false);
    }
  }, [profile?.id, userRole, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark mx-auto mb-4"></div>
          <p className="text-admin-text-secondary">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-admin-text-primary">Solicitudes</h1>
          <p className="text-admin-text-secondary mt-1">
            Tienes {requisitions.length} {requisitions.length === 1 ? "requisición" : "requisiciones"} accesible{requisitions.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          onClick={() => router.push("/request")}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-accent text-white hover:bg-brand-accentDark transition-colors w-full sm:w-auto shadow-sm text-sm font-medium">
          <Plus className="w-4 h-4" />
          <span>Nueva Requisición</span>
        </button>
      </div>

      {/* Timeline de Estados */}
      <div className="bg-admin-bg-card rounded-lg shadow-sm border border-admin-border-DEFAULT p-6 overflow-x-auto">
        <div className="flex items-center justify-between min-w-max">
          {[
            {
              status: "draft",
              label: "Borradores",
              icon: FileText,
              bgColor: "bg-neutral-400",
              lightBg: "bg-neutral-100",
              textColor: "text-neutral-800",
              borderColor: "border-neutral-400",
            },
            {
              status: "submitted",
              label: "Enviadas",
              icon: Users,
              bgColor: "bg-admin-info",
              lightBg: "bg-blue-100",
              textColor: "text-blue-800",
              borderColor: "border-admin-info",
            },
            {
              status: "in_review",
              label: "En Revisión",
              icon: Eye,
              bgColor: "bg-admin-warning",
              lightBg: "bg-yellow-100",
              textColor: "text-yellow-800",
              borderColor: "border-admin-warning",
            },
            {
              status: "approved",
              label: "Aprobadas",
              icon: Briefcase,
              bgColor: "bg-admin-success",
              lightBg: "bg-green-100",
              textColor: "text-green-800",
              borderColor: "border-admin-success",
            },
          ].map(({ status, label, icon: Icon, bgColor, lightBg, textColor, borderColor }, index, array) => {
            const count = requisitions.filter((r) => r.status === status).length;
            const isActive = count > 0;
            const nextStatus = array[index + 1]?.status;
            const hasNextItems = nextStatus ? requisitions.filter((r) => r.status === nextStatus).length > 0 : false;

            return (
              <div key={status} className="flex items-center" style={{ minWidth: "200px" }}>
                {/* Timeline Item */}
                <div className="flex flex-col items-center">
                  {/* Círculo con ícono */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${
                      isActive ? `${bgColor} shadow-lg` : "bg-neutral-200"
                    }`}>
                    <Icon className={`w-7 h-7 ${isActive ? "text-white" : "text-neutral-400"}`} />

                    {/* Contador Badge */}
                    {isActive && (
                      <div
                        className={`absolute -top-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full ${lightBg} ${textColor} border-2 border-white font-bold text-xs shadow-md`}>
                        {count}
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-3 text-center">
                    <p className={`text-sm font-semibold ${isActive ? "text-admin-text-primary" : "text-admin-text-muted"}`}>
                      {label}
                    </p>
                    <p className={`text-xs mt-0.5 ${isActive ? "text-admin-text-secondary" : "text-admin-text-muted"}`}>
                      {count} {count === 1 ? "requisición" : "requisiciones"}
                    </p>
                  </div>
                </div>

                {/* Línea conectora */}
                {index < array.length - 1 && (
                  <div className="flex-1 flex items-center px-4" style={{ minWidth: "80px" }}>
                    <div className="relative h-1 w-full rounded bg-admin-border-DEFAULT overflow-hidden">
                      {/* Línea de fondo estática cuando está activo */}
                      {isActive && <div className={`absolute inset-0 rounded ${bgColor} opacity-30`} />}
                      {/* Línea animada cuando el paso actual tiene items */}
                      {isActive && (
                        <div
                          className={`absolute inset-0 rounded ${bgColor}`}
                          style={{
                            animation: "fillLine 2s ease-in-out infinite",
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-admin-bg-card rounded-lg shadow-sm border border-admin-border-DEFAULT p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-2">Búsqueda</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por puesto o departamento..."
              className="w-full rounded-md border border-admin-border-DEFAULT px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-sm bg-admin-bg-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-text-secondary mb-2">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequisitionStatus | "")}
              className="w-full rounded-md border border-admin-border-DEFAULT px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-sm bg-admin-bg-input">
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
          <div className="bg-admin-bg-card rounded-lg shadow-sm border border-admin-border-DEFAULT p-8 text-center">
            <FileText className="w-12 h-12 text-admin-text-muted mx-auto mb-3" />
            <p className="text-admin-text-secondary">
              {searchTerm.trim() || statusFilter
                ? "No se encontraron requisiciones con los criterios de búsqueda"
                : "No hay requisiciones disponibles para las empresas a las que tienes acceso"}
            </p>
            {!searchTerm && !statusFilter && (
              <button
                onClick={() => router.push("/request")}
                className="mt-4 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accentDark transition-colors text-sm">
                Crear mi primera requisición
              </button>
            )}
          </div>
        ) : (
          filteredRequisitions.map((req, idx) => (
            <div
              key={req.id}
              className={`rounded-lg shadow-sm border border-admin-border-DEFAULT p-4 hover:shadow-md transition-shadow ${
                idx % 2 === 0 ? "bg-admin-bg-card" : "bg-surface-secondary"
              }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-admin-text-primary">
                        {req.puesto_requerido || "Sin especificar"}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ml-2 ${statusColors[req.status]}`}>
                          {statusLabels[req.status]}
                        </span>
                      </h3>
                      {req.departamento && <p className="text-sm text-admin-text-secondary mt-0.5">{req.departamento}</p>}
                      {req.motivo_puesto && (
                        <p className="text-xs text-admin-text-muted mt-1 truncate" title={req.motivo_puesto}>
                          {req.motivo_puesto}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-admin-text-muted">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {req.numero_vacantes || 0} vacantes
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Información adicional solicitada */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-xs">
                        <div className="bg-surface-tertiary border border-admin-border-DEFAULT rounded-md p-2">
                          <p className="text-admin-text-muted">Empresa</p>
                          <p
                            className="text-admin-text-primary font-medium truncate"
                            title={companyNames[req.company_id] || req.company_id}>
                            {companyNames[req.company_id] || "—"}
                          </p>
                        </div>
                        <div className="bg-surface-tertiary border border-admin-border-DEFAULT rounded-md p-2">
                          <p className="text-admin-text-muted">Tipo de Puesto</p>
                          <p className="text-admin-text-primary font-medium truncate" title={formatTipoPuesto(req)}>
                            {formatTipoPuesto(req) || "—"}
                          </p>
                        </div>
                        <div className="bg-surface-tertiary border border-admin-border-DEFAULT rounded-md p-2">
                          <p className="text-admin-text-muted">Nivel educativo requerido</p>
                          <p className="text-admin-text-primary font-medium truncate" title={formatNivelEducativo(req)}>
                            {formatNivelEducativo(req) || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/requisitions/${req.id}`)}
                      className="p-2 rounded bg-admin-secondary text-white hover:opacity-90 transition-colors"
                      title="Ver detalles">
                      <Eye className="w-4 h-4" />
                    </button>

                    {req.status === "draft" && (
                      <button
                        onClick={() => router.push(`/request?edit=${req.id}`)}
                        className="p-2 rounded bg-admin-success text-white hover:bg-admin-successHover transition-colors"
                        title="Editar">
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

// Helpers
function formatNivelEducativo(req: Requisition): string {
  const fa = req.formacion_academica;
  if (!fa) return "";

  // Prioridad desde mayor a menor
  const order: Array<[keyof NonNullable<typeof fa>, string]> = [
    ["doctorado", "Doctorado"],
    ["maestria", "Maestría"],
    ["universitario", "Universitario"],
    ["tecnico", "Técnico"],
    ["bachiller", "Bachiller"],
  ];

  for (const [key, label] of order) {
    if ((fa as any)[key]) return label;
  }

  if (fa.otro) {
    return fa.detalles ? `Otro (${fa.detalles})` : "Otro";
  }
  return fa.detalles || "";
}

function formatTipoPuesto(req: Requisition): string {
  const tp = req.tipo_puesto;
  if (!tp) return "";
  const labels: string[] = [];
  if (tp.nuevaCreacion) labels.push("Nueva creación");
  if (tp.reemplazoTemporal) labels.push("Reemplazo temporal");
  if (tp.reemplazoDefinitivo) labels.push("Reemplazo definitivo");
  if (tp.incrementoPlantilla) labels.push("Incremento de plantilla");
  return labels.join(", ");
}
