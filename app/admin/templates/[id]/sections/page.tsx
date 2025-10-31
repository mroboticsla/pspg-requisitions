'use client';

// =====================================================
// Editor de Secciones y Campos de Plantillas
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getTemplateById,
  createSection,
  updateSection,
  deleteSection,
  createField,
  updateField,
  deleteField,
  reorderSections,
} from '@/lib/templates';
import type {
  FormTemplateComplete,
  FormSection,
  FormField,
  FieldType,
} from '@/lib/types/requisitions';

export default function TemplateSectionsPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<FormTemplateComplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingSection, setEditingSection] = useState<FormSection | null>(null);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');

  // Formulario de sección
  const [sectionName, setSectionName] = useState('');
  const [sectionDesc, setSectionDesc] = useState('');
  const [sectionPosition, setSectionPosition] = useState(0);
  const [sectionRequired, setSectionRequired] = useState(false);

  // Formulario de campo
  const [fieldName, setFieldName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('text');
  const [fieldOptions, setFieldOptions] = useState<string>('');
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldHelp, setFieldHelp] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);

  const loadTemplate = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTemplateById(templateId);
      setTemplate(data);
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  function openSectionModal(section?: FormSection) {
    if (section) {
      setEditingSection(section);
      setSectionName(section.name);
      setSectionDesc(section.description || '');
      setSectionPosition(section.position);
      setSectionRequired(section.is_required);
    } else {
      setEditingSection(null);
      setSectionName('');
      setSectionDesc('');
      setSectionPosition(0);
      setSectionRequired(false);
    }
    setShowSectionModal(true);
  }

  async function handleSaveSection() {
    try {
      if (editingSection) {
        await updateSection(editingSection.id, {
          template_id: templateId,
          name: sectionName,
          description: sectionDesc,
          position: sectionPosition,
          is_required: sectionRequired,
        });
      } else {
        await createSection({
          template_id: templateId,
          name: sectionName,
          description: sectionDesc,
          position: sectionPosition,
          is_required: sectionRequired,
        });
      }

      setShowSectionModal(false);
      loadTemplate();
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Error al guardar la sección');
    }
  }

  async function handleDeleteSection(sectionId: string) {
    if (!confirm('¿Eliminar esta sección y todos sus campos?')) return;

    try {
      await deleteSection(sectionId);
      loadTemplate();
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Error al eliminar la sección');
    }
  }

  function openFieldModal(sectionId: string, field?: FormField) {
    setSelectedSection(sectionId);
    
    if (field) {
      // Modo edición
      setEditingField(field);
      setFieldName(field.name);
      setFieldLabel(field.label);
      setFieldType(field.field_type);
      setFieldOptions(field.options?.join('\n') || '');
      setFieldPlaceholder(field.placeholder || '');
      setFieldHelp(field.help_text || '');
      setFieldRequired(field.validation?.required || false);
    } else {
      // Modo creación
      setEditingField(null);
      setFieldName('');
      setFieldLabel('');
      setFieldType('text');
      setFieldOptions('');
      setFieldPlaceholder('');
      setFieldHelp('');
      setFieldRequired(false);
    }
    
    setShowFieldModal(true);
  }

  async function handleSaveField() {
    try {
      const options = fieldOptions.trim()
        ? fieldOptions.split('\n').map((o) => o.trim()).filter(Boolean)
        : undefined;

      const fieldData = {
        section_id: selectedSection,
        name: fieldName,
        label: fieldLabel,
        field_type: fieldType,
        options,
        validation: { required: fieldRequired },
        placeholder: fieldPlaceholder,
        help_text: fieldHelp,
      };

      if (editingField) {
        // Actualizar campo existente
        await updateField(editingField.id, fieldData);
      } else {
        // Crear nuevo campo
        await createField(fieldData);
      }

      setShowFieldModal(false);
      setEditingField(null);
      loadTemplate();
    } catch (error) {
      console.error('Error saving field:', error);
      alert('Error al guardar el campo');
    }
  }

  async function handleDeleteField(fieldId: string) {
    if (!confirm('¿Eliminar este campo?')) return;

    try {
      await deleteField(fieldId);
      loadTemplate();
    } catch (error) {
      console.error('Error deleting field:', error);
      alert('Error al eliminar el campo');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Plantilla no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Volver a Plantillas
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona las secciones personalizadas de esta plantilla
          </p>
        </div>

        {/* Botón Agregar Sección */}
        <div className="mb-6">
          <button
            onClick={() => openSectionModal()}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Agregar Sección Personalizada
          </button>
        </div>

        {/* Lista de Secciones */}
        {template.sections && template.sections.length > 0 ? (
          <div className="space-y-6">
            {template.sections
              .sort((a, b) => a.position - b.position)
              .map((section) => (
                <div key={section.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {section.name}
                        {section.is_required && (
                          <span className="ml-2 text-red-500">*</span>
                        )}
                      </h3>
                      {section.description && (
                        <p className="mt-1 text-sm text-gray-600">{section.description}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">
                        {section.position === 0 
                          ? 'Posición: Al final del formulario' 
                          : `Posición: ${section.position}`}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => openSectionModal(section)}
                        className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => openFieldModal(section.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        + Campo
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Campos de la sección */}
                  {section.fields && section.fields.length > 0 ? (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <h4 className="font-medium text-gray-700">Campos:</h4>
                      {section.fields
                        .sort((a, b) => a.position - b.position)
                        .map((field) => (
                          <div
                            key={field.id}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {field.label}
                                {field.validation?.required && (
                                  <span className="ml-1 text-red-500">*</span>
                                )}
                              </p>
                              <p className="text-sm text-gray-600">
                                Tipo: {field.field_type} | Nombre: {field.name}
                              </p>
                              {field.help_text && (
                                <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openFieldModal(section.id, field)}
                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteField(field.id)}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-4 italic">
                      No hay campos. Haz clic en &quot;+ Campo&quot; para agregar.
                    </p>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No hay secciones personalizadas</p>
            <button
              onClick={() => openSectionModal()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Crear Primera Sección
            </button>
          </div>
        )}

        {/* Modal Sección */}
        {showSectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {editingSection ? 'Editar Sección' : 'Nueva Sección'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <textarea
                    value={sectionDesc}
                    onChange={(e) => setSectionDesc(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Posición en el formulario
                  </label>
                  <select
                    value={sectionPosition}
                    onChange={(e) => setSectionPosition(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value={0}>Al final del formulario (después de todas las secciones estándar)</option>
                    {template?.sections && template.sections.length > 0 && (
                      <>
                        {template.sections
                          .sort((a, b) => a.position - b.position)
                          .map((sec, idx) => (
                            <option key={sec.id} value={idx + 1}>
                              Después de &quot;{sec.name}&quot;
                            </option>
                          ))}
                      </>
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona dónde se mostrará esta sección en el formulario de requisición
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sectionRequired}
                    onChange={(e) => setSectionRequired(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label className="ml-2 text-sm">Sección requerida</label>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={handleSaveSection}
                  disabled={!sectionName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowSectionModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Campo */}
        {showFieldModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-8 max-w-lg w-full my-8">
              <h2 className="text-xl font-bold mb-4">
                {editingField ? 'Editar Campo' : 'Nuevo Campo'}
              </h2>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre interno *</label>
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value.replace(/\s/g, '_'))}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="nombre_campo"
                  />
                  <p className="text-xs text-gray-500 mt-1">Sin espacios, usar guiones bajos</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Etiqueta visible *</label>
                  <input
                    type="text"
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de campo *</label>
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value as FieldType)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="text">Texto</option>
                    <option value="textarea">Área de texto</option>
                    <option value="number">Número</option>
                    <option value="currency">Moneda</option>
                    <option value="date">Fecha</option>
                    <option value="email">Email</option>
                    <option value="phone">Teléfono</option>
                    <option value="select">Selector (dropdown)</option>
                    <option value="multi-select">Selección múltiple</option>
                    <option value="radio">Radio buttons</option>
                    <option value="checkbox">Checkbox único</option>
                  </select>
                </div>

                {['select', 'multi-select', 'radio'].includes(fieldType) && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Opciones (una por línea)
                    </label>
                    <textarea
                      value={fieldOptions}
                      onChange={(e) => setFieldOptions(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      rows={4}
                      placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={fieldPlaceholder}
                    onChange={(e) => setFieldPlaceholder(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Texto de ayuda</label>
                  <input
                    type="text"
                    value={fieldHelp}
                    onChange={(e) => setFieldHelp(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={fieldRequired}
                    onChange={(e) => setFieldRequired(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label className="ml-2 text-sm">Campo requerido</label>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={handleSaveField}
                  disabled={!fieldName.trim() || !fieldLabel.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {editingField ? 'Actualizar Campo' : 'Crear Campo'}
                </button>
                <button
                  onClick={() => {
                    setShowFieldModal(false);
                    setEditingField(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
