'use client';

// =====================================================
// Panel de Administración de Plantillas
// =====================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  listCompanyTemplates,
  createTemplate,
  activateTemplate,
  deleteTemplate,
  duplicateTemplate,
} from '@/lib/templates';
import { supabase } from '@/lib/supabaseClient';
import type { FormTemplate } from '@/lib/types/requisitions';
import { FileText, Plus, Edit, Trash2, Copy, CheckCircle, Building2, AlertCircle } from 'lucide-react';
import ConfirmModal from '@/app/components/ConfirmModal';
import { useToast } from '@/lib/useToast';

interface CompanyWithTemplate {
  id: string;
  name: string;
  is_active: boolean;
  hasCustomTemplate: boolean;
  activeTemplate?: FormTemplate | null;
  allTemplates?: FormTemplate[];
}

export default function TemplatesPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  
  const [companies, setCompanies] = useState<CompanyWithTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  // Campo eliminado: cantidad de funciones principales ya no es configurable desde UI
  
  const [showDeleteModal, setShowDeleteModal] = useState<{
    open: boolean;
    template?: FormTemplate;
  }>({ open: false });

  // Cargar empresas y sus plantillas
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Cargar todas las empresas activas
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (companiesError) throw companiesError;

      // Para cada empresa, obtener sus plantillas
      const companiesWithTemplates = await Promise.all(
        (companiesData || []).map(async (company) => {
          const templates = await listCompanyTemplates(company.id);
          const activeTemplate = templates.find((t) => t.is_active);

          return {
            id: company.id,
            name: company.name,
            is_active: company.is_active,
            hasCustomTemplate: templates.length > 0,
            activeTemplate,
            allTemplates: templates,
          };
        })
      );

      setCompanies(companiesWithTemplates);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Error al cargar las empresas y plantillas');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar empresas por búsqueda
  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return companies;
    const s = search.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(s));
  }, [companies, search]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = companies.length;
    const withCustom = companies.filter((c) => c.hasCustomTemplate).length;
    const withDefault = total - withCustom;
    
    return { total, withCustom, withDefault };
  }, [companies]);

  async function handleCreateTemplate() {
    if (!selectedCompanyId || !newTemplateName.trim()) return;

    try {
      setBusy(true);
      const created = await createTemplate({
        company_id: selectedCompanyId,
        name: newTemplateName,
        description: newTemplateDesc,
      });

      setShowCreateModal(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      setSelectedCompanyId('');
      
      success('Plantilla creada exitosamente');
      await loadData();

      // Navegar al editor de la nueva plantilla
      router.push(`/admin/templates/${created.id}/sections`);
    } catch (error) {
      console.error('Error creating template:', error);
      showError('Error al crear la plantilla');
    } finally {
      setBusy(false);
    }
  }

  async function handleActivate(templateId: string) {
    try {
      setBusy(true);
      await activateTemplate(templateId);
      success('Plantilla activada exitosamente');
      await loadData();
    } catch (error) {
      console.error('Error activating template:', error);
      showError('Error al activar la plantilla');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!showDeleteModal.template) return;

    try {
      setBusy(true);
      await deleteTemplate(showDeleteModal.template.id);
      setShowDeleteModal({ open: false });
      success('Plantilla eliminada exitosamente');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      showError(error.message || 'Error al eliminar la plantilla');
    } finally {
      setBusy(false);
    }
  }

  async function handleDuplicate(template: FormTemplate) {
    const name = prompt('Nombre de la nueva plantilla:', `${template.name} (Copia)`);
    if (!name) return;

    try {
      setBusy(true);
      const newId = await duplicateTemplate(template.id, name);
      success('Plantilla duplicada exitosamente');
      await loadData();
      router.push(`/admin/templates/${newId}/sections`);
    } catch (error) {
      console.error('Error duplicating template:', error);
      showError('Error al duplicar la plantilla');
    } finally {
      setBusy(false);
    }
  }

  function openCreateModal(companyId: string) {
    setSelectedCompanyId(companyId);
    setShowCreateModal(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando plantillas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Gestión de Plantillas
            </h1>
            <p className="text-gray-600 mt-1">
              Configure las plantillas de formularios personalizados por empresa
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Empresas */}
          <div className="bg-gradient-to-br from-brand-dark to-[#003d66] rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-100 text-sm font-medium">Total Empresas</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
              </div>
              <Building2 className="w-12 h-12 text-gray-200 opacity-80" />
            </div>
            <div className="mt-4 flex items-center text-gray-100 text-sm">
              <Building2 className="w-4 h-4 mr-1" />
              Registradas
            </div>
          </div>

          {/* Con Plantilla Personalizada */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Plantillas Personalizadas</p>
                <p className="text-3xl font-bold mt-2">{stats.withCustom}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-emerald-100 opacity-80" />
            </div>
            <div className="mt-4 flex items-center text-emerald-100 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Configuradas
            </div>
          </div>

          {/* Con Plantilla por Defecto */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Plantilla por Defecto</p>
                <p className="text-3xl font-bold mt-2">{stats.withDefault}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-amber-100 opacity-80" />
            </div>
            <div className="mt-4 flex items-center text-amber-100 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              Sin personalizar
            </div>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empresa..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-sm"
          />
        </div>

        {/* Lista de Empresas */}
        {busy && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Procesando...</p>
          </div>
        )}

        {!busy && filteredCompanies.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">
              {search.trim()
                ? 'No se encontraron empresas con los criterios de búsqueda'
                : 'No hay empresas registradas'}
            </p>
          </div>
        )}

        {!busy && filteredCompanies.length > 0 && (
          <div className="space-y-4">
            {filteredCompanies.map((company, index) => (
              <div
                key={company.id}
                className={`rounded-lg shadow-sm border border-gray-200 p-4 ${
                  index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors`}
              >
                {/* Mobile Layout */}
                <div className="flex flex-col gap-3 lg:hidden">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Building2 className="w-5 h-5 text-brand-dark flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base text-gray-900">{company.name}</h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {company.hasCustomTemplate ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <CheckCircle className="w-3 h-3" />
                              Plantilla personalizada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600">
                              <AlertCircle className="w-3 h-3" />
                              Usando plantilla por defecto
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {company.hasCustomTemplate && company.allTemplates && company.allTemplates.length > 0 && (
                    <div className="ml-7 space-y-2">
                      {company.allTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="bg-gray-100 rounded p-3 border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-600" />
                              <span className="font-medium text-sm">{template.name}</span>
                              {template.is_active && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded font-medium">
                                  ACTIVA
                                </span>
                              )}
                            </div>
                          </div>
                          {template.description && (
                            <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => router.push(`/admin/templates/${template.id}/sections`)}
                              disabled={busy}
                              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs disabled:opacity-50"
                            >
                              <Edit className="w-3 h-3" />
                              Editar
                            </button>
                            {!template.is_active && (
                              <button
                                onClick={() => handleActivate(template.id)}
                                disabled={busy}
                                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-xs disabled:opacity-50"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Activar
                              </button>
                            )}
                            <button
                              onClick={() => handleDuplicate(template)}
                              disabled={busy}
                              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs disabled:opacity-50"
                            >
                              <Copy className="w-3 h-3" />
                              Duplicar
                            </button>
                            {!template.is_active && (
                              <button
                                onClick={() => setShowDeleteModal({ open: true, template })}
                                disabled={busy}
                                className="flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs disabled:opacity-50"
                              >
                                <Trash2 className="w-3 h-3" />
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="ml-7">
                    <button
                      onClick={() => openCreateModal(company.id)}
                      disabled={busy}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-brand-accent text-white rounded hover:bg-brand-accentDark text-xs font-medium disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      Nueva Plantilla
                    </button>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:flex lg:items-start lg:gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-brand-dark" />
                      <h3 className="font-semibold text-lg text-gray-900">{company.name}</h3>
                      {company.hasCustomTemplate ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          Plantilla personalizada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200">
                          <AlertCircle className="w-3 h-3" />
                          Plantilla por defecto
                        </span>
                      )}
                    </div>

                    {company.hasCustomTemplate && company.allTemplates && company.allTemplates.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {company.allTemplates.map((template) => (
                          <div
                            key={template.id}
                            className="bg-gray-100 rounded p-3 border border-gray-200 flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-sm">{template.name}</span>
                                {template.is_active && (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded font-medium">
                                    ACTIVA
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">v{template.version}</span>
                              </div>
                              {template.description && (
                                <p className="text-xs text-gray-600 mt-1 ml-6">{template.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => router.push(`/admin/templates/${template.id}/sections`)}
                                disabled={busy}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs disabled:opacity-50 flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                Editar
                              </button>
                              {!template.is_active && (
                                <button
                                  onClick={() => handleActivate(template.id)}
                                  disabled={busy}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-xs disabled:opacity-50 flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Activar
                                </button>
                              )}
                              <button
                                onClick={() => handleDuplicate(template)}
                                disabled={busy}
                                className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs disabled:opacity-50 flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                Duplicar
                              </button>
                              {!template.is_active && (
                                <button
                                  onClick={() => setShowDeleteModal({ open: true, template })}
                                  disabled={busy}
                                  className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs disabled:opacity-50 flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <button
                      onClick={() => openCreateModal(company.id)}
                      disabled={busy}
                      className="flex items-center gap-1 px-4 py-2 bg-brand-accent text-white rounded hover:bg-brand-accentDark text-sm font-medium disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      Nueva Plantilla
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear Plantilla */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Nueva Plantilla</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de la plantilla *</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Plantilla Q1 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción opcional"
                />
              </div>

              <div>
                {/* Campo de cantidad de funciones principales retirado intencionalmente */}
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleCreateTemplate}
                disabled={!newTemplateName.trim() || busy}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {busy ? 'Creando...' : 'Crear Plantilla'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedCompanyId('');
                  setNewTemplateName('');
                  setNewTemplateDesc('');
                }}
                disabled={busy}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={showDeleteModal.open}
        onCancel={() => setShowDeleteModal({ open: false })}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Plantilla"
        message={`¿Está seguro de que desea eliminar la plantilla "${showDeleteModal.template?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}
