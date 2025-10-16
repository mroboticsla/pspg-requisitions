// =====================================================
// Servicio de Templates - Gestión de plantillas de formularios
// =====================================================

import { supabase } from './supabaseClient';
import type {
  FormTemplate,
  FormTemplateComplete,
  CreateTemplateData,
  CreateSectionData,
  CreateFieldData,
  FormSection,
  FormField,
} from './types/requisitions';

/**
 * Obtiene la plantilla activa de una empresa
 */
export async function getCompanyActiveTemplate(
  companyId: string
): Promise<FormTemplateComplete | null> {
  try {
    const { data, error } = await supabase.rpc('get_company_active_template', {
      p_company_id: companyId,
    });

    if (error) throw error;

    // Si no hay plantilla activa, retornar null
    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return data as FormTemplateComplete;
  } catch (error) {
    console.error('Error fetching company active template:', error);
    throw error;
  }
}

/**
 * Obtiene una plantilla específica por ID con todas sus secciones y campos
 */
export async function getTemplateById(
  templateId: string
): Promise<FormTemplateComplete | null> {
  try {
    const { data, error } = await supabase.rpc('get_template_by_id', {
      p_template_id: templateId,
    });

    if (error) throw error;

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return data as FormTemplateComplete;
  } catch (error) {
    console.error('Error fetching template by ID:', error);
    throw error;
  }
}

/**
 * Lista todas las plantillas de una empresa
 */
export async function listCompanyTemplates(
  companyId: string
): Promise<FormTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error listing company templates:', error);
    throw error;
  }
}

/**
 * Crea una nueva plantilla
 */
export async function createTemplate(
  templateData: CreateTemplateData
): Promise<FormTemplate> {
  try {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('form_templates')
      .insert({
        company_id: templateData.company_id,
        name: templateData.name,
        description: templateData.description,
        num_main_functions: templateData.num_main_functions || 5,
        created_by: userData?.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

/**
 * Actualiza una plantilla existente
 */
export async function updateTemplate(
  templateId: string,
  updates: Partial<CreateTemplateData>
): Promise<FormTemplate> {
  try {
    const { data, error } = await supabase
      .from('form_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

/**
 * Activa una plantilla específica (desactiva las demás de la empresa)
 */
export async function activateTemplate(templateId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('activate_template', {
      p_template_id: templateId,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error activating template:', error);
    throw error;
  }
}

/**
 * Desactiva una plantilla
 */
export async function deactivateTemplate(templateId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('form_templates')
      .update({ is_active: false })
      .eq('id', templateId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deactivating template:', error);
    throw error;
  }
}

/**
 * Duplica una plantilla completa
 */
export async function duplicateTemplate(
  templateId: string,
  newName?: string
): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('duplicate_template', {
      p_template_id: templateId,
      p_new_name: newName,
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error duplicating template:', error);
    throw error;
  }
}

/**
 * Elimina una plantilla (solo si no está activa)
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  try {
    // Verificar que no esté activa
    const { data: template } = await supabase
      .from('form_templates')
      .select('is_active')
      .eq('id', templateId)
      .single();

    if (template?.is_active) {
      throw new Error('No se puede eliminar una plantilla activa');
    }

    const { error } = await supabase
      .from('form_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

// =====================================================
// GESTIÓN DE SECCIONES
// =====================================================

/**
 * Crea una nueva sección en una plantilla
 */
export async function createSection(
  sectionData: CreateSectionData
): Promise<FormSection> {
  try {
    const { data, error } = await supabase
      .from('form_sections')
      .insert({
        template_id: sectionData.template_id,
        name: sectionData.name,
        description: sectionData.description,
        position: sectionData.position || 0,
        is_required: sectionData.is_required || false,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating section:', error);
    throw error;
  }
}

/**
 * Actualiza una sección
 */
export async function updateSection(
  sectionId: string,
  updates: Partial<CreateSectionData>
): Promise<FormSection> {
  try {
    const { data, error } = await supabase
      .from('form_sections')
      .update(updates)
      .eq('id', sectionId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating section:', error);
    throw error;
  }
}

/**
 * Elimina una sección
 */
export async function deleteSection(sectionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('form_sections')
      .delete()
      .eq('id', sectionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting section:', error);
    throw error;
  }
}

/**
 * Reordena secciones
 */
export async function reorderSections(
  updates: { id: string; position: number }[]
): Promise<void> {
  try {
    const promises = updates.map(({ id, position }) =>
      supabase.from('form_sections').update({ position }).eq('id', id)
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error reordering sections:', error);
    throw error;
  }
}

// =====================================================
// GESTIÓN DE CAMPOS
// =====================================================

/**
 * Crea un nuevo campo en una sección
 */
export async function createField(
  fieldData: CreateFieldData
): Promise<FormField> {
  try {
    const { data, error } = await supabase
      .from('form_fields')
      .insert({
        section_id: fieldData.section_id,
        name: fieldData.name,
        label: fieldData.label,
        field_type: fieldData.field_type,
        options: fieldData.options,
        validation: fieldData.validation,
        placeholder: fieldData.placeholder,
        help_text: fieldData.help_text,
        position: fieldData.position || 0,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating field:', error);
    throw error;
  }
}

/**
 * Actualiza un campo
 */
export async function updateField(
  fieldId: string,
  updates: Partial<CreateFieldData>
): Promise<FormField> {
  try {
    const { data, error } = await supabase
      .from('form_fields')
      .update(updates)
      .eq('id', fieldId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating field:', error);
    throw error;
  }
}

/**
 * Elimina un campo
 */
export async function deleteField(fieldId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('form_fields')
      .delete()
      .eq('id', fieldId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting field:', error);
    throw error;
  }
}

/**
 * Reordena campos dentro de una sección
 */
export async function reorderFields(
  updates: { id: string; position: number }[]
): Promise<void> {
  try {
    const promises = updates.map(({ id, position }) =>
      supabase.from('form_fields').update({ position }).eq('id', id)
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error reordering fields:', error);
    throw error;
  }
}

/**
 * Crea un snapshot de una plantilla (para versionado)
 */
export async function createTemplateSnapshot(
  templateId: string
): Promise<FormTemplateComplete> {
  try {
    const { data, error } = await supabase.rpc('create_template_snapshot', {
      p_template_id: templateId,
    });

    if (error) throw error;

    return data as FormTemplateComplete;
  } catch (error) {
    console.error('Error creating template snapshot:', error);
    throw error;
  }
}
