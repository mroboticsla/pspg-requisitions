'use client';

// =====================================================
// Panel de Administración de Plantillas
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  listCompanyTemplates,
  createTemplate,
  activateTemplate,
  deleteTemplate,
  duplicateTemplate,
} from '@/lib/templates';
import type { FormTemplate } from '@/lib/types/requisitions';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [numFunctions, setNumFunctions] = useState(5);

  // Cargar empresas y plantillas
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Cargar empresas (ajustar según tu implementación)
      const { data: companiesData } = await import('@/lib/supabaseClient').then(
        (mod) => mod.supabase.from('companies').select('*').eq('is_active', true)
      );
      setCompanies(companiesData || []);

      // Si hay empresa seleccionada, cargar sus plantillas
      if (selectedCompany) {
        const templatesData = await listCompanyTemplates(selectedCompany);
        setTemplates(templatesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateTemplate() {
    if (!selectedCompany || !newTemplateName.trim()) return;

    try {
      const created = await createTemplate({
        company_id: selectedCompany,
        name: newTemplateName,
        description: newTemplateDesc,
        num_main_functions: numFunctions,
      });

      setShowCreateModal(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      setNumFunctions(5);
      loadData();

      // Navegar al editor de la nueva plantilla
      router.push(`/admin/templates/${created.id}/sections`);
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error al crear la plantilla');
    }
  }

  async function handleActivate(templateId: string) {
    try {
      await activateTemplate(templateId);
      loadData();
    } catch (error) {
      console.error('Error activating template:', error);
      alert('Error al activar la plantilla');
    }
  }

  async function handleDelete(templateId: string) {
    if (!confirm('¿Está seguro de eliminar esta plantilla?')) return;

    try {
      await deleteTemplate(templateId);
      loadData();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      alert(error.message || 'Error al eliminar la plantilla');
    }
  }

  async function handleDuplicate(templateId: string) {
    const name = prompt('Nombre de la nueva plantilla:');
    if (!name) return;

    try {
      const newId = await duplicateTemplate(templateId, name);
      loadData();
      router.push(`/admin/templates/${newId}/sections`);
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Error al duplicar la plantilla');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Plantillas</h1>
          <p className="mt-2 text-sm text-gray-600">
            Administra las plantillas de formularios personalizados por empresa
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione una empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={!selectedCompany}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                + Nueva Plantilla
              </button>
            </div>
          </div>
        </div>

        {/* Lista de plantillas */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando...</p>
          </div>
        ) : selectedCompany && templates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No hay plantillas creadas para esta empresa</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Crear Primera Plantilla
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`bg-white rounded-lg shadow p-6 border-2 ${
                  template.is_active ? 'border-green-500' : 'border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      {template.is_active && (
                        <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                          ACTIVA
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                        v{template.version}
                      </span>
                    </div>

                    {template.description && (
                      <p className="mt-2 text-sm text-gray-600">{template.description}</p>
                    )}

                    <p className="mt-2 text-sm text-gray-500">
                      Funciones principales: {template.num_main_functions}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Creada: {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => router.push(`/admin/templates/${template.id}/sections`)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Editar Secciones
                    </button>

                    {!template.is_active && (
                      <button
                        onClick={() => handleActivate(template.id)}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Activar
                      </button>
                    )}

                    <button
                      onClick={() => handleDuplicate(template.id)}
                      className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Duplicar
                    </button>

                    {!template.is_active && (
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Crear Plantilla */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Nueva Plantilla</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Ej: Plantilla Principal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de funciones principales (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={numFunctions}
                    onChange={(e) => setNumFunctions(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={handleCreateTemplate}
                  disabled={!newTemplateName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Crear
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTemplateName('');
                    setNewTemplateDesc('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
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
