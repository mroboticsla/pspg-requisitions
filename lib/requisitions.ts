// =====================================================
// Servicio de Requisiciones - Gestión de requisiciones de personal
// =====================================================

import { supabase } from './supabaseClient';
import { createTemplateSnapshot } from './templates';
import type {
  Requisition,
  RequisitionComplete,
  CreateRequisitionData,
  UpdateRequisitionData,
  RequisitionFilters,
  RequisitionStatus,
  RequisitionStats,
} from './types/requisitions';

/**
 * Crea una nueva requisición
 */
export async function createRequisition(
  data: CreateRequisitionData
): Promise<Requisition> {
  try {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user?.id) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener snapshot de la plantilla activa de la empresa
    const { data: templateSnapshot, error: snapshotError } = await supabase.rpc(
      'get_company_active_template',
      { p_company_id: data.company_id }
    );

    if (snapshotError) throw snapshotError;

    // Crear la requisición base
    const { data: requisition, error: reqError } = await supabase
      .from('requisitions')
      .insert({
        company_id: data.company_id,
        created_by: userData.user.id,
        template_id: templateSnapshot?.id,
        template_snapshot: templateSnapshot || {},
        status: 'draft',
        departamento: data.departamento,
        puesto_requerido: data.puesto_requerido,
        numero_vacantes: data.numero_vacantes,
        tipo_puesto: data.tipo_puesto,
        motivo_puesto: data.motivo_puesto,
        nombre_empleado_reemplaza: data.nombre_empleado_reemplaza,
        funciones_principales: data.funciones_principales,
        formacion_academica: data.formacion_academica,
        otros_estudios: data.otros_estudios,
        idioma_ingles: data.idioma_ingles,
        habilidad_informatica: data.habilidad_informatica,
        habilidades_tecnicas: data.habilidades_tecnicas,
      })
      .select()
      .single();

    if (reqError) throw reqError;

    // Guardar respuestas personalizadas si existen
    if (data.custom_responses && Object.keys(data.custom_responses).length > 0) {
      const responses = Object.entries(data.custom_responses).map(
        ([sectionId, responses]) => ({
          requisition_id: requisition.id,
          section_id: sectionId,
          responses,
        })
      );

      const { error: responsesError } = await supabase
        .from('requisition_responses')
        .insert(responses);

      if (responsesError) throw responsesError;
    }

    return requisition;
  } catch (error) {
    console.error('Error creating requisition:', error);
    throw error;
  }
}

/**
 * Actualiza una requisición existente
 */
export async function updateRequisition(
  requisitionId: string,
  updates: UpdateRequisitionData
): Promise<Requisition> {
  try {
    // Extraer custom_responses si existe
    const { custom_responses, ...requisitionUpdates } = updates;

    // Actualizar requisición base
    const { data: requisition, error: reqError } = await supabase
      .from('requisitions')
      .update(requisitionUpdates)
      .eq('id', requisitionId)
      .select()
      .single();

    if (reqError) throw reqError;

    // Actualizar respuestas personalizadas si existen
    if (custom_responses) {
      // Eliminar respuestas anteriores
      await supabase
        .from('requisition_responses')
        .delete()
        .eq('requisition_id', requisitionId);

      // Insertar nuevas respuestas
      if (Object.keys(custom_responses).length > 0) {
        const responses = Object.entries(custom_responses).map(
          ([sectionId, responses]) => ({
            requisition_id: requisitionId,
            section_id: sectionId,
            responses,
          })
        );

        const { error: responsesError } = await supabase
          .from('requisition_responses')
          .insert(responses);

        if (responsesError) throw responsesError;
      }
    }

    return requisition;
  } catch (error) {
    console.error('Error updating requisition:', error);
    throw error;
  }
}

/**
 * Obtiene una requisición por ID con sus respuestas personalizadas
 */
export async function getRequisitionById(
  requisitionId: string
): Promise<RequisitionComplete | null> {
  try {
    const { data, error } = await supabase.rpc('get_requisition_complete', {
      p_requisition_id: requisitionId,
    });

    if (error) throw error;

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      ...data.requisition,
      custom_responses: data.custom_responses || [],
    } as RequisitionComplete;
  } catch (error) {
    console.error('Error fetching requisition:', error);
    throw error;
  }
}

/**
 * Lista requisiciones con filtros
 */
export async function listRequisitions(
  filters: RequisitionFilters = {}
): Promise<Requisition[]> {
  try {
    let query = supabase
      .from('requisitions')
      .select('*')
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.company_id) {
      query = query.eq('company_id', filters.company_id);
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    if (filters.search) {
      query = query.or(
        `puesto_requerido.ilike.%${filters.search}%,departamento.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error listing requisitions:', error);
    throw error;
  }
}

/**
 * Envía una requisición (cambia estado a submitted)
 */
export async function submitRequisition(
  requisitionId: string
): Promise<Requisition> {
  try {
    const { data, error } = await supabase
      .from('requisitions')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', requisitionId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error submitting requisition:', error);
    throw error;
  }
}

/**
 * Cambia el estado de una requisición
 */
export async function updateRequisitionStatus(
  requisitionId: string,
  status: RequisitionStatus,
  reviewedBy?: string
): Promise<Requisition> {
  try {
    const { data: userData } = await supabase.auth.getUser();

    const updates: any = {
      status,
    };

    // Si se aprueba o rechaza, guardar información de revisión
    if (status === 'approved' || status === 'rejected') {
      updates.reviewed_at = new Date().toISOString();
      updates.reviewed_by = reviewedBy || userData?.user?.id;
    }

    const { data, error } = await supabase
      .from('requisitions')
      .update(updates)
      .eq('id', requisitionId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating requisition status:', error);
    throw error;
  }
}

/**
 * Elimina una requisición (solo si está en draft)
 */
export async function deleteRequisition(requisitionId: string): Promise<void> {
  try {
    // Verificar que esté en draft
    const { data: requisition } = await supabase
      .from('requisitions')
      .select('status')
      .eq('id', requisitionId)
      .single();

    if (requisition?.status !== 'draft') {
      throw new Error('Solo se pueden eliminar requisiciones en borrador');
    }

    const { error } = await supabase
      .from('requisitions')
      .delete()
      .eq('id', requisitionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting requisition:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de requisiciones
 */
export async function getRequisitionStats(
  companyId?: string
): Promise<RequisitionStats> {
  try {
    // Intentar usar la función RPC si existe
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_requisition_stats', {
      p_company_id: companyId || null,
    });

    if (!rpcError && rpcData) {
      return rpcData as RequisitionStats;
    }

    // Fallback: calcular estadísticas manualmente
    let query = supabase
      .from('requisitions')
      .select('status, company_id, created_at, updated_at');

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data: requisitions, error } = await query;

    if (error) throw error;

    // Inicializar contadores por estado
    const by_status: Record<RequisitionStatus, number> = {
      draft: 0,
      submitted: 0,
      in_review: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      filled: 0,
    };

    const by_company: Record<string, number> = {};

    // Contar requisiciones
    requisitions?.forEach((req) => {
      by_status[req.status as RequisitionStatus] = 
        (by_status[req.status as RequisitionStatus] || 0) + 1;
      
      by_company[req.company_id] = (by_company[req.company_id] || 0) + 1;
    });

    return {
      total: requisitions?.length || 0,
      by_status,
      by_company,
    };
  } catch (error) {
    console.error('Error fetching requisition stats:', error);
    // Retornar estadísticas vacías en caso de error
    return {
      total: 0,
      by_status: {
        draft: 0,
        submitted: 0,
        in_review: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        filled: 0,
      },
      by_company: {},
    };
  }
}

/**
 * Valida los datos de una requisición contra su plantilla
 */
export async function validateRequisitionData(
  templateSnapshot: any,
  funcionesPrincipales: string[],
  customResponses: Record<string, Record<string, any>>
): Promise<{ valid: boolean; errors: any[] }> {
  try {
    const { data, error } = await supabase.rpc('validate_requisition_data', {
      p_template_snapshot: templateSnapshot,
      p_funciones_principales: funcionesPrincipales,
      p_custom_responses: customResponses,
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error validating requisition data:', error);
    throw error;
  }
}

/**
 * Obtiene requisiciones del usuario actual
 */
export async function getMyRequisitions(): Promise<Requisition[]> {
  try {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user?.id) {
      return [];
    }

    return listRequisitions({ created_by: userData.user.id });
  } catch (error) {
    console.error('Error fetching my requisitions:', error);
    throw error;
  }
}

/**
 * Obtiene el conteo de requisiciones por estado para una empresa
 */
export async function getRequisitionCountByStatus(
  companyId?: string
): Promise<Record<RequisitionStatus, number>> {
  try {
    const stats = await getRequisitionStats(companyId);
    return stats.by_status;
  } catch (error) {
    console.error('Error fetching requisition count by status:', error);
    throw error;
  }
}
