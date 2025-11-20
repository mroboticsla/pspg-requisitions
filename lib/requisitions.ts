// =====================================================
// Servicio de Requisiciones - Gestión de requisiciones de personal
// =====================================================

import { supabase } from './supabaseClient';
import { createTemplateSnapshot } from './templates';
import { getCurrentUserRole } from './getCurrentUserRole';
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

    // 1. Verificar que el usuario tenga acceso a la empresa
    const { data: hasAccess, error: accessError } = await supabase.rpc(
      'user_has_company_access',
      { p_company_id: data.company_id }
    );

    if (accessError) {
      console.error('Error verificando acceso a empresa:', accessError);
      throw new Error('No se pudo verificar el acceso a la empresa. Por favor, contacte al administrador.');
    }

    if (!hasAccess) {
      throw new Error('No tiene permisos para crear requisiciones en esta empresa. Contacte al administrador para obtener acceso.');
    }

    // 2. Obtener snapshot de la plantilla activa de la empresa
    const { data: templateSnapshot, error: snapshotError } = await supabase.rpc(
      'get_company_active_template',
      { p_company_id: data.company_id }
    );

    if (snapshotError) {
      console.error('Error obteniendo plantilla de empresa:', snapshotError);
      throw new Error(`No se pudo obtener la plantilla de la empresa: ${snapshotError.message}`);
    }

    if (!templateSnapshot) {
      console.warn('No se encontró plantilla activa para la empresa:', data.company_id);
    }

    // 3. Crear la requisición base
    const { data: requisition, error: reqError } = await supabase
      .from('requisitions')
      .insert({
        company_id: data.company_id,
        created_by: userData.user.id,
        template_id: templateSnapshot?.id || null,
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
        idiomas: data.idiomas,
        idioma_ingles: data.idioma_ingles,
        habilidad_informatica: data.habilidad_informatica,
        habilidades_tecnicas: data.habilidades_tecnicas,
      })
      .select()
      .single();

    if (reqError) {
      console.error('Error creando requisición:', reqError);
      
      // Mensajes de error más específicos
      if (reqError.code === '42501') {
        throw new Error('No tiene permisos suficientes para crear requisiciones. Verifique que está asignado a esta empresa.');
      } else if (reqError.code === '23503') {
        throw new Error('Error de referencia: La empresa especificada no existe o fue eliminada.');
      } else if (reqError.code === '23505') {
        throw new Error('Ya existe una requisición con estos datos.');
      }
      
      throw new Error(`Error al crear la requisición: ${reqError.message}`);
    }

    // 4. Guardar respuestas personalizadas si existen
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

      if (responsesError) {
        console.error('Error guardando respuestas personalizadas:', responsesError);
        // No lanzar error aquí, la requisición principal ya se creó exitosamente
        console.warn('La requisición se creó pero hubo un problema guardando las respuestas personalizadas.');
      }
    }

    return requisition;
  } catch (error: any) {
    console.error('Error en createRequisition:', error);
    
    // Re-lanzar con mensaje claro si ya es un Error
    if (error instanceof Error) {
      throw error;
    }
    
    // Error genérico
    throw new Error('Error inesperado al crear la requisición. Por favor, intente nuevamente.');
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
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user?.id) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar que la requisición existe y el usuario tiene permisos
    const { data: existingReq, error: fetchError } = await supabase
      .from('requisitions')
      .select('id, created_by, status, company_id')
      .eq('id', requisitionId)
      .single();

    if (fetchError) {
      console.error('Error verificando requisición:', fetchError);
      throw new Error('No se pudo encontrar la requisición especificada.');
    }

    if (!existingReq) {
      throw new Error('La requisición no existe o fue eliminada.');
    }

    // Verificar permisos: solo admin/superadmin pueden editar cualquier requisición
    // Usuarios no admin solo pueden editar sus propias requisiciones en estado 'draft'
    const userRole = await getCurrentUserRole();
    const isAdminRole = userRole === 'admin' || userRole === 'superadmin';
    const isOwner = existingReq.created_by === userData.user.id;

    if (!isAdminRole) {
      if (!isOwner) {
        throw new Error('Solo puede actualizar sus propias requisiciones.');
      }
      if (existingReq.status !== 'draft') {
        throw new Error('Solo puede editar requisiciones en estado "Borrador".');
      }
    }

    // Extraer custom_responses si existe
    const { custom_responses, ...requisitionUpdates } = updates;

    // Actualizar requisición base
    const { data: requisition, error: reqError } = await supabase
      .from('requisitions')
      .update(requisitionUpdates)
      .eq('id', requisitionId)
      .select()
      .single();

    if (reqError) {
      console.error('Error actualizando requisición:', reqError);
      
      if (reqError.code === '42501') {
        throw new Error('No tiene permisos para actualizar esta requisición.');
      }
      
      throw new Error(`Error al actualizar la requisición: ${reqError.message}`);
    }

    // Actualizar respuestas personalizadas si existen
    if (custom_responses) {
      // Eliminar respuestas anteriores
      const { error: deleteError } = await supabase
        .from('requisition_responses')
        .delete()
        .eq('requisition_id', requisitionId);

      if (deleteError) {
        console.error('Error eliminando respuestas anteriores:', deleteError);
      }

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

        if (responsesError) {
          console.error('Error insertando nuevas respuestas:', responsesError);
          console.warn('La requisición se actualizó pero hubo un problema con las respuestas personalizadas.');
        }
      }
    }

    return requisition;
  } catch (error: any) {
    console.error('Error en updateRequisition:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Error inesperado al actualizar la requisición.');
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

    if (error) {
      console.error('Error obteniendo requisición completa:', error);
      throw new Error(`No se pudo obtener la requisición: ${error.message}`);
    }

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      ...data.requisition,
      custom_responses: data.custom_responses || [],
    } as RequisitionComplete;
  } catch (error: any) {
    console.error('Error en getRequisitionById:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Error inesperado al obtener la requisición.');
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
    } else if (filters.company_ids && filters.company_ids.length > 0) {
      query = query.in('company_id', filters.company_ids);
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

    if (error) {
      console.error('Error listando requisiciones:', error);
      throw new Error(`Error al obtener la lista de requisiciones: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    console.error('Error en listRequisitions:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Error inesperado al listar requisiciones.');
  }
}

/**
 * Envía una requisición (cambia estado a submitted)
 */
export async function submitRequisition(
  requisitionId: string
): Promise<Requisition> {
  try {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user?.id) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar que la requisición existe y está en draft
    const { data: existingReq, error: fetchError } = await supabase
      .from('requisitions')
      .select('id, created_by, status')
      .eq('id', requisitionId)
      .single();

    if (fetchError || !existingReq) {
      throw new Error('La requisición no existe o fue eliminada.');
    }

    // Verificar permisos: el creador puede enviar siempre
    // Admin y superadmin pueden enviar cualquier requisición
    const userRole = await getCurrentUserRole();
    const isAdminRole = userRole === 'admin' || userRole === 'superadmin';
    const isOwner = existingReq.created_by === userData.user.id;

    if (!isOwner && !isAdminRole) {
      throw new Error('Solo puede enviar sus propias requisiciones.');
    }

    if (existingReq.status !== 'draft') {
      throw new Error('Solo se pueden enviar requisiciones en estado borrador.');
    }

    const { data, error } = await supabase
      .from('requisitions')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', requisitionId)
      .select()
      .single();

    if (error) {
      console.error('Error enviando requisición:', error);
      throw new Error(`Error al enviar la requisición: ${error.message}`);
    }

    return data;
  } catch (error: any) {
    console.error('Error en submitRequisition:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Error inesperado al enviar la requisición.');
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
    // Llamar API segura con service role (evita bloqueos por RLS en transiciones permitidas)
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      throw new Error('Usuario no autenticado');
    }

    const res = await fetch(`/api/requisitions/${requisitionId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, reviewedBy }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || 'Error al cambiar el estado de la requisición');
    }

    return json as Requisition;
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
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user?.id) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar que esté en draft y pertenezca al usuario
    const { data: requisition, error: fetchError } = await supabase
      .from('requisitions')
      .select('status, created_by')
      .eq('id', requisitionId)
      .single();

    if (fetchError || !requisition) {
      throw new Error('La requisición no existe o fue eliminada.');
    }

    // Verificar permisos: el creador puede eliminar siempre
    // Admin y superadmin pueden eliminar cualquier requisición en borrador
    const userRole = await getCurrentUserRole();
    const isAdminRole = userRole === 'admin' || userRole === 'superadmin';
    const isOwner = requisition.created_by === userData.user.id;

    if (!isOwner && !isAdminRole) {
      throw new Error('Solo puede eliminar sus propias requisiciones.');
    }

    if (requisition.status !== 'draft') {
      throw new Error('Solo se pueden eliminar requisiciones en estado borrador.');
    }

    const { error } = await supabase
      .from('requisitions')
      .delete()
      .eq('id', requisitionId);

    if (error) {
      console.error('Error eliminando requisición:', error);
      throw new Error(`Error al eliminar la requisición: ${error.message}`);
    }
  } catch (error: any) {
    console.error('Error en deleteRequisition:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Error inesperado al eliminar la requisición.');
  }
}

/**
 * Obtiene estadísticas de requisiciones
 * @param companyId - ID de la empresa para filtrar (opcional)
 * @param userId - ID del usuario para filtrar (opcional). Si se proporciona, solo cuenta requisiciones creadas por ese usuario.
 */
export async function getRequisitionStats(
  companyId?: string,
  userId?: string
): Promise<RequisitionStats> {
  try {
    // Intentar usar la función RPC si existe
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_requisition_stats', {
      p_company_id: companyId || null,
    });

    if (!rpcError && rpcData && !userId) {
      // Solo usar RPC si no hay filtro de usuario
      return rpcData as RequisitionStats;
    }

    // Fallback: calcular estadísticas manualmente
    let query = supabase
      .from('requisitions')
      .select('status, company_id, created_at, updated_at, created_by');

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    // Si se proporciona userId, filtrar por created_by (para partners)
    if (userId) {
      query = query.eq('created_by', userId);
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
