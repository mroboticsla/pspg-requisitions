'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/lib/useToast';
import { createJobAd, updateJobAd, getJobAdById, getJobAdAssignments } from '@/lib/jobAds';
import { listRequisitions } from '@/lib/requisitions';
import { supabase } from '@/lib/supabaseClient';
import type { CreateJobAdDTO, JobAdCustomField } from '@/lib/types/job-ads';
import type { Requisition } from '@/lib/types/requisitions';
import { ArrowLeft, Save, Plus, Trash2, Wand2 } from 'lucide-react';
import { RequireRoleClient } from '@/app/components/RequireRole';

export default function JobAdEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { success, error } = useToast();
  const isNew = params.id === 'new';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<CreateJobAdDTO>>({
    status: 'draft',
    custom_fields: { schema_version: 1, fields: [] },
    expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  
  const [selectedRequisitions, setSelectedRequisitions] = useState<string[]>([]);
  const [availableRequisitions, setAvailableRequisitions] = useState<Requisition[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Load available requisitions (approved only)
      const reqs = await listRequisitions({ status: 'approved' }); 
      setAvailableRequisitions(reqs);

      // Load company names
      const companyIds = Array.from(new Set(reqs.map(r => r.company_id)));
      if (companyIds.length > 0) {
        const { data: comps } = await supabase
          .from('companies')
          .select('id, name')
          .in('id', companyIds);
        
        if (comps) {
          const map: Record<string, string> = {};
          comps.forEach(c => map[c.id] = c.name);
          setCompanies(map);
        }
      }

      if (!isNew && typeof params.id === 'string') {
        const ad = await getJobAdById(params.id);
        if (!ad) throw new Error('Anuncio no encontrado');
        
        setFormData({
            ...ad,
            expiration_date: ad.expiration_date ? new Date(ad.expiration_date).toISOString().split('T')[0] : ''
        });

        const assignments = await getJobAdAssignments(params.id);
        setSelectedRequisitions(assignments.map(a => a.requisition_id));
      }
    } catch (err: any) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateSlug = () => {
    if (!formData.title) return;
    const slug = formData.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleRequisitionToggle = (reqId: string, companyId: string) => {
    // If selecting a requisition, ensure it matches the current company_id if set
    if (!selectedRequisitions.includes(reqId)) {
      if (formData.company_id && formData.company_id !== companyId) {
        error('Solo puedes seleccionar requisiciones de la misma empresa');
        return;
      }
      
      // If first selection, set company_id and try to pre-fill data
      if (selectedRequisitions.length === 0) {
        const req = availableRequisitions.find(r => r.id === reqId);
        if (req) {
          setFormData(prev => ({
            ...prev,
            company_id: companyId,
            title: prev.title || req.puesto_requerido,
            location: prev.location || 'Ciudad de México', // Default or fetch from company?
            // Pre-fill other fields if empty
          }));
          // Trigger slug generation if title was empty
          if (!formData.title) {
             // We'll do it in the next render or manually
          }
        }
      }
      
      setSelectedRequisitions(prev => [...prev, reqId]);
    } else {
      const newSelection = selectedRequisitions.filter(id => id !== reqId);
      setSelectedRequisitions(newSelection);
      // If no requisitions left, maybe clear company_id? 
      // Better to keep it to avoid losing context, user can change it manually if we add a selector.
    }
  };

  const addCustomField = () => {
    const newField: JobAdCustomField = {
      key: `field_${Date.now()}`,
      label: 'Nuevo Campo',
      type: 'list',
      value: []
    };
    
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields!,
        fields: [...(prev.custom_fields?.fields || []), newField]
      }
    }));
  };

  const updateCustomField = (index: number, updates: Partial<JobAdCustomField>) => {
    const newFields = [...(formData.custom_fields?.fields || [])];
    newFields[index] = { ...newFields[index], ...updates };
    setFormData(prev => ({
      ...prev,
      custom_fields: { ...prev.custom_fields!, fields: newFields }
    }));
  };

  const removeCustomField = (index: number) => {
    const newFields = [...(formData.custom_fields?.fields || [])];
    newFields.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      custom_fields: { ...prev.custom_fields!, fields: newFields }
    }));
  };

  async function handleSave() {
    try {
      setSaving(true);
      
      if (!formData.title || !formData.slug || !formData.company_id || !formData.expiration_date) {
        throw new Error('Por favor complete los campos obligatorios (Título, Slug, Empresa, Expiración)');
      }

      // Fetch company snapshot if needed
      let companySnapshot = formData.company_snapshot;
      if (!companySnapshot && formData.company_id) {
        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .eq('id', formData.company_id)
          .single();
        if (comp) companySnapshot = comp;
      }

      const payload: any = {
        ...formData,
        company_snapshot: companySnapshot,
        requisition_ids: selectedRequisitions
      };

      if (isNew) {
        await createJobAd(payload);
        success('Anuncio creado exitosamente');
      } else {
        await updateJobAd(params.id as string, payload);
        success('Anuncio actualizado exitosamente');
      }
      
      router.push('/admin/job-ads');
    } catch (err: any) {
      error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireRoleClient allow={['admin', 'superadmin']} redirectTo="/admin/login">
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-admin-bg-hover rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-admin-text-secondary" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-admin-text-primary">
                {isNew ? 'Nuevo Anuncio' : 'Editar Anuncio'}
              </h1>
              <p className="text-admin-text-secondary text-sm">
                {isNew ? 'Crea una nueva oferta de empleo' : 'Modifica los detalles de la oferta'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-admin-accent text-white rounded-admin hover:bg-admin-accentHover disabled:opacity-50 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-admin-bg-card p-6 rounded-admin shadow-sm border border-admin-border space-y-4">
              <h2 className="text-lg font-semibold text-admin-text-primary border-b border-admin-border pb-2">Información Básica</h2>
              
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Título del Puesto</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Slug (URL)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent outline-none transition-all"
                  />
                  <button
                    onClick={handleGenerateSlug}
                    className="px-3 py-2 bg-admin-bg-hover text-admin-text-secondary rounded-admin hover:bg-gray-200 transition-colors"
                    title="Generar desde título"
                  >
                    <Wand2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Descripción Corta</label>
                <textarea
                  value={formData.short_description || ''}
                  onChange={e => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Descripción Completa</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent outline-none transition-all"
                />
              </div>
            </div>

            {/* Custom Fields */}
            <div className="bg-admin-bg-card p-6 rounded-admin shadow-sm border border-admin-border space-y-4">
              <div className="flex items-center justify-between border-b border-admin-border pb-2">
                <h2 className="text-lg font-semibold text-admin-text-primary">Secciones Personalizadas</h2>
                <button
                  onClick={addCustomField}
                  className="text-sm text-admin-accent hover:text-admin-accentHover font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Agregar Sección
                </button>
              </div>

              <div className="space-y-4">
                {formData.custom_fields?.fields.map((field, idx) => (
                  <div key={idx} className="p-4 bg-admin-bg-page rounded-admin border border-admin-border relative group hover:border-admin-border-hover transition-colors">
                    <button
                      onClick={() => removeCustomField(idx)}
                      className="absolute top-2 right-2 text-admin-text-muted hover:text-admin-danger opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="text-xs font-medium text-admin-text-secondary">Título de Sección</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={e => updateCustomField(idx, { label: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-admin-border rounded-admin focus:border-admin-accent outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-admin-text-secondary">Tipo</label>
                        <select
                          value={field.type}
                          onChange={e => updateCustomField(idx, { type: e.target.value as any })}
                          className="w-full px-2 py-1 text-sm border border-admin-border rounded-admin focus:border-admin-accent outline-none"
                        >
                          <option value="list">Lista (Bullets)</option>
                          <option value="text">Texto Simple</option>
                          <option value="richtext">Texto Rico</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-admin-text-secondary">Contenido</label>
                      {field.type === 'list' ? (
                        <textarea
                          value={Array.isArray(field.value) ? field.value.join('\n') : field.value}
                          onChange={e => updateCustomField(idx, { value: e.target.value.split('\n') })}
                          placeholder="Un elemento por línea"
                          rows={3}
                          className="w-full px-2 py-1 text-sm border border-admin-border rounded-admin focus:border-admin-accent outline-none"
                        />
                      ) : (
                        <textarea
                          value={field.value}
                          onChange={e => updateCustomField(idx, { value: e.target.value })}
                          rows={3}
                          className="w-full px-2 py-1 text-sm border border-admin-border rounded-admin focus:border-admin-accent outline-none"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Dates */}
            <div className="bg-admin-bg-card p-6 rounded-admin shadow-sm border border-admin-border space-y-4">
              <h2 className="text-lg font-semibold text-admin-text-primary border-b border-admin-border pb-2">Publicación</h2>
              
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent outline-none transition-all"
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Fecha de Expiración</label>
                <input
                  type="date"
                  value={formData.expiration_date || ''}
                  onChange={e => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Ubicación</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Tipo de Empleo</label>
                <select
                  value={formData.employment_type || ''}
                  onChange={e => setFormData(prev => ({ ...prev, employment_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent outline-none transition-all"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Tiempo Completo">Tiempo Completo</option>
                  <option value="Medio Tiempo">Medio Tiempo</option>
                  <option value="Híbrido">Híbrido</option>
                  <option value="Remoto">Remoto</option>
                  <option value="Por Proyecto">Por Proyecto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Rango Salarial</label>
                <input
                  type="text"
                  value={formData.salary_range || ''}
                  onChange={e => setFormData(prev => ({ ...prev, salary_range: e.target.value }))}
                  placeholder="Ej: $20,000 - $30,000 MXN"
                  className="w-full px-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent outline-none transition-all"
                />
              </div>
            </div>

            {/* Requisitions */}
            <div className="bg-admin-bg-card p-6 rounded-admin shadow-sm border border-admin-border space-y-4">
              <h2 className="text-lg font-semibold text-admin-text-primary border-b border-admin-border pb-2">Vincular Requisiciones</h2>
              <p className="text-xs text-admin-text-muted">Selecciona las requisiciones aprobadas que originan este anuncio.</p>
              
              <div className="max-h-60 overflow-y-auto space-y-2 border border-admin-border rounded-admin p-2 bg-admin-bg-page">
                {availableRequisitions.length === 0 ? (
                  <p className="text-sm text-admin-text-muted text-center py-2">No hay requisiciones aprobadas disponibles.</p>
                ) : (
                  availableRequisitions.map(req => (
                    <label key={req.id} className="flex items-start gap-2 p-2 hover:bg-white rounded-admin cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedRequisitions.includes(req.id)}
                        onChange={() => handleRequisitionToggle(req.id, req.company_id)}
                        className="mt-1 rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-admin-text-primary">{req.puesto_requerido}</div>
                        <div className="text-xs text-admin-text-muted">
                          {companies[req.company_id] || 'Empresa desconocida'} • {new Date(req.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireRoleClient>
  );
}
