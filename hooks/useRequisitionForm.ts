'use client';

// =====================================================
// Hook useRequisitionForm - Gestión del estado del formulario de requisiciones
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { getCompanyActiveTemplate } from '@/lib/templates';
import {
  createRequisition,
  updateRequisition,
  getRequisitionById,
  validateRequisitionData,
} from '@/lib/requisitions';
import type {
  FormTemplateComplete,
  CreateRequisitionData,
  UpdateRequisitionData,
  Requisition,
} from '@/lib/types/requisitions';

interface UseRequisitionFormOptions {
  companyId?: string;
  requisitionId?: string; // Para edición
}

export function useRequisitionForm({ companyId, requisitionId }: UseRequisitionFormOptions = {}) {
  const [template, setTemplate] = useState<FormTemplateComplete | null>(null);
  const [existingRequisition, setExistingRequisition] = useState<Requisition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado del formulario
  const [formData, setFormData] = useState<CreateRequisitionData>({
    company_id: companyId || '',
    departamento: '',
    puesto_requerido: '',
    numero_vacantes: 1,
    tipo_puesto: {},
    motivo_puesto: '',
    nombre_empleado_reemplaza: '',
    funciones_principales: [],
    formacion_academica: {},
    otros_estudios: '',
    idioma_ingles: false,
    habilidad_informatica: {},
    habilidades_tecnicas: {},
    custom_responses: {},
  });

  // Cargar plantilla activa de la empresa
  useEffect(() => {
    async function loadTemplate() {
      if (!companyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const activeTemplate = await getCompanyActiveTemplate(companyId);
        setTemplate(activeTemplate);

        // Ya no inicializamos funciones principales por cantidad fija; se manejarán dinámicamente
        if (activeTemplate) {
          setFormData((prev) => ({
            ...prev,
            company_id: companyId,
          }));
        }
      } catch (error) {
        console.error('Error loading template:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();
  }, [companyId]);

  // Cargar requisición existente para edición
  useEffect(() => {
    async function loadRequisition() {
      if (!requisitionId) return;

      try {
        setLoading(true);
        const requisition = await getRequisitionById(requisitionId);

        if (requisition) {
          setExistingRequisition(requisition);
          setTemplate(requisition.template_snapshot);

          // Mapear datos de la requisición al formulario
          const customResponses: Record<string, Record<string, any>> = {};
          requisition.custom_responses?.forEach((response) => {
            customResponses[response.section_id] = response.responses;
          });

          setFormData({
            company_id: requisition.company_id,
            departamento: requisition.departamento,
            puesto_requerido: requisition.puesto_requerido,
            numero_vacantes: requisition.numero_vacantes,
            tipo_puesto: requisition.tipo_puesto,
            motivo_puesto: requisition.motivo_puesto,
            nombre_empleado_reemplaza: requisition.nombre_empleado_reemplaza,
            funciones_principales: requisition.funciones_principales || [],
            formacion_academica: requisition.formacion_academica,
            otros_estudios: requisition.otros_estudios,
            idioma_ingles: requisition.idioma_ingles,
            habilidad_informatica: requisition.habilidad_informatica,
            habilidades_tecnicas: requisition.habilidades_tecnicas,
            custom_responses: customResponses,
          });
        }
      } catch (error) {
        console.error('Error loading requisition:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRequisition();
  }, [requisitionId]);

  // Actualizar campo del formulario
  const updateField = useCallback((field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Actualizar función principal específica
  const updateFuncionPrincipal = useCallback((index: number, value: string) => {
    setFormData((prev) => {
      const newFunciones = [...(prev.funciones_principales || [])];
      newFunciones[index] = value;
      return {
        ...prev,
        funciones_principales: newFunciones,
      };
    });
  }, []);

  // Actualizar respuesta de campo personalizado
  const updateCustomResponse = useCallback((sectionId: string, fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      custom_responses: {
        ...prev.custom_responses,
        [sectionId]: {
          ...(prev.custom_responses?.[sectionId] || {}),
          [fieldName]: value,
        },
      },
    }));

    // Limpiar error del campo si existe
    const errorKey = `${sectionId}.${fieldName}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  }, [errors]);

  // Validar formulario
  const validate = useCallback(async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    // Validaciones básicas
    if (!formData.puesto_requerido?.trim()) {
      newErrors.puesto_requerido = 'El puesto requerido es obligatorio';
    }

    if (!formData.departamento?.trim()) {
      newErrors.departamento = 'El departamento es obligatorio';
    }

    if (!formData.numero_vacantes || formData.numero_vacantes < 1) {
      newErrors.numero_vacantes = 'Debe especificar al menos una vacante';
    }

    // Validar con el servidor si hay plantilla
    if (template) {
      try {
        const validationResult = await validateRequisitionData(
          template,
          formData.funciones_principales || [],
          formData.custom_responses || {}
        );

        if (!validationResult.valid) {
          validationResult.errors.forEach((error: any) => {
            if (error.section) {
              newErrors[`${error.section}.${error.field}`] = error.message;
            } else {
              newErrors[error.field] = error.message;
            }
          });
        }
      } catch (error) {
        console.error('Error validating with server:', error);
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, template]);

  // Guardar como borrador
  const saveDraft = useCallback(async (): Promise<Requisition | null> => {
    try {
      setSaving(true);

      if (requisitionId) {
        // Actualizar existente
        const updated = await updateRequisition(requisitionId, formData);
        setExistingRequisition(updated);
        return updated;
      } else {
        // Crear nuevo
        const created = await createRequisition(formData);
        setExistingRequisition(created);
        return created;
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [formData, requisitionId]);

  // Enviar requisición
  const submit = useCallback(async (): Promise<Requisition | null> => {
    try {
      // Validar antes de enviar
      const isValid = await validate();
      if (!isValid) {
        throw new Error('Hay errores en el formulario. Por favor corrígelos antes de enviar.');
      }

      setSaving(true);

      let requisition: Requisition;

      if (requisitionId) {
        // Actualizar y cambiar estado
        requisition = await updateRequisition(requisitionId, {
          ...formData,
          status: 'submitted',
        });
      } else {
        // Crear y enviar
        requisition = await createRequisition(formData);
        requisition = await updateRequisition(requisition.id, {
          status: 'submitted',
        });
      }

      setExistingRequisition(requisition);
      return requisition;
    } catch (error) {
      console.error('Error submitting requisition:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [formData, requisitionId, validate]);

  // Resetear formulario
  const reset = useCallback(() => {
    setFormData({
      company_id: companyId || '',
      departamento: '',
      puesto_requerido: '',
      numero_vacantes: 1,
      tipo_puesto: {},
      motivo_puesto: '',
      nombre_empleado_reemplaza: '',
      funciones_principales: [],
      formacion_academica: {},
      otros_estudios: '',
      idioma_ingles: false,
      habilidad_informatica: {},
      habilidades_tecnicas: {},
      custom_responses: {},
    });
    setErrors({});
    setExistingRequisition(null);
  }, [companyId, template]);

  return {
    // Estado
    template,
    formData,
    errors,
    loading,
    saving,
    existingRequisition,

    // Acciones
    updateField,
    updateFuncionPrincipal,
    updateCustomResponse,
    validate,
    saveDraft,
    submit,
    reset,

    // Utilidades
    isEditing: !!requisitionId,
    canEdit: !existingRequisition || existingRequisition.status === 'draft',
    numMainFunctions: template?.num_main_functions || 5,
    customSections: template?.sections || [],
  };
}
