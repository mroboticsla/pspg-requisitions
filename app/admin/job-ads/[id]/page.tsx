'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/lib/useToast';
import { createJobAd, updateJobAd, getJobAdById, getJobAdAssignments } from '@/lib/jobAds';
import { listRequisitions } from '@/lib/requisitions';
import { supabase } from '@/lib/supabaseClient';
import type { CreateJobAdDTO, JobAdCustomField } from '@/lib/types/job-ads';
import type { Requisition } from '@/lib/types/requisitions';
import { ArrowLeft, Save, Plus, Trash2, Wand2, Search, Building, Globe, Mail, Phone, MapPin, CheckCircle2, ArrowRight, Filter, X, Eye, Archive, FileText, MoreVertical, AlertTriangle } from 'lucide-react';
import { RequireRoleClient } from '@/app/components/RequireRole';
import RichTextEditor from '@/app/components/RichTextEditor';
import { deleteJobAd } from '@/lib/jobAds';

export default function JobAdEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { success, error } = useToast();
  const isNew = params.id === 'new';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Requisitions, 2: Edit Details
  const [showReqModal, setShowReqModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<CreateJobAdDTO>>({
    status: 'draft',
    custom_fields: { schema_version: 1, fields: [] },
    expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  
  // Company & Contact Info State (Editable)
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    website: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const [selectedRequisitions, setSelectedRequisitions] = useState<string[]>([]);
  const [availableRequisitions, setAvailableRequisitions] = useState<Requisition[]>([]);
  const [filteredRequisitions, setFilteredRequisitions] = useState<Requisition[]>([]);
  const [companies, setCompanies] = useState<Record<string, any>>({});
  const [reqSearchTerm, setReqSearchTerm] = useState('');

  useEffect(() => {
    if (!isNew) setStep(2);
    loadData();
  }, [isNew]);

  useEffect(() => {
    if (reqSearchTerm.trim() === '') {
      setFilteredRequisitions(availableRequisitions);
    } else {
      const term = reqSearchTerm.toLowerCase();
      setFilteredRequisitions(availableRequisitions.filter(req => 
        req.puesto_requerido?.toLowerCase().includes(term) ||
        companies[req.company_id]?.name?.toLowerCase().includes(term)
      ));
    }
  }, [reqSearchTerm, availableRequisitions, companies]);

  async function loadData() {
    try {
      setLoading(true);
      
      // Load available requisitions (approved only)
      const reqs = await listRequisitions({ status: 'approved' }); 
      setAvailableRequisitions(reqs);
      setFilteredRequisitions(reqs);

      // Load company names and details
      const companyIds = Array.from(new Set(reqs.map(r => r.company_id)));
      if (companyIds.length > 0) {
        const { data: comps } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds);
        
        if (comps) {
          const map: Record<string, any> = {};
          comps.forEach(c => map[c.id] = c);
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

        // Load company info from snapshot or fallback to company record
        if (ad.company_snapshot) {
            setCompanyInfo({
                name: ad.company_snapshot.name || '',
                website: ad.company_snapshot.website || '',
                email: ad.company_snapshot.email || '',
                phone: ad.company_snapshot.phone || '',
                address: ad.company_snapshot.address || ''
            });
        }

        if (ad.metadata?.is_anonymous) {
            setIsAnonymous(true);
        }

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
        const comp = companies[companyId];
        
        if (req) {
          setFormData(prev => ({
            ...prev,
            company_id: companyId,
            title: prev.title || req.puesto_requerido,
            location: prev.location || 'Ciudad de México',
          }));
          
          // Pre-fill company info
          if (comp) {
            setCompanyInfo({
                name: comp.name || '',
                website: comp.website || '',
                email: comp.email || '',
                phone: comp.phone || '',
                address: comp.address || ''
            });
          }
        }
      }
      
      setSelectedRequisitions(prev => [...prev, reqId]);
    } else {
      const newSelection = selectedRequisitions.filter(id => id !== reqId);
      setSelectedRequisitions(newSelection);
      
      // If deselecting all, maybe clear company info? 
      // For now, we keep it to avoid annoyance.
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

      if (selectedRequisitions.length === 0) {
        throw new Error('Debe vincular al menos una requisición aprobada al anuncio');
      }

      // Prepare company snapshot with overrides
      let companySnapshot = formData.company_snapshot || {};
      
      // If we have the original company object, start with that
      if (formData.company_id && companies[formData.company_id]) {
          companySnapshot = { ...companies[formData.company_id] };
      }
      
      // Apply overrides from companyInfo state
      companySnapshot = {
          ...companySnapshot,
          name: companyInfo.name,
          website: companyInfo.website,
          email: companyInfo.email,
          phone: companyInfo.phone,
          address: companyInfo.address
      };

      const payload: any = {
        ...formData,
        company_snapshot: companySnapshot,
        requisition_ids: selectedRequisitions,
        metadata: { ...formData.metadata, is_anonymous: isAnonymous }
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

  async function handleDelete() {
    try {
      setSaving(true);
      if (typeof params.id === 'string') {
        await deleteJobAd(params.id);
        success('Anuncio eliminado exitosamente');
        router.push('/admin/job-ads');
      }
    } catch (err: any) {
      error(err.message);
      setSaving(false);
    }
  }

  const handleQuickAction = (action: string) => {
    if (action === 'delete') {
      setShowDeleteConfirm(true);
    } else if (action === 'publish') {
      setFormData(prev => ({ ...prev, status: 'published' }));
      // Optionally save immediately
    } else if (action === 'draft') {
      setFormData(prev => ({ ...prev, status: 'draft' }));
    } else if (action === 'archive') {
      setFormData(prev => ({ ...prev, status: 'archived' }));
    }
  };

  return (
    <RequireRoleClient allow={['admin', 'superadmin']} redirectTo="/admin/login">
      <div className="space-y-6 pb-20">
        {/* Step 1: Select Requisitions (Wizard) */}
        {step === 1 && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-admin-text-primary mb-2">Crear Nuevo Anuncio</h1>
              <p className="text-admin-text-secondary">Paso 1: Selecciona las requisiciones aprobadas que deseas publicar</p>
            </div>

            <div className="bg-admin-bg-card rounded-admin shadow-sm border border-admin-border overflow-hidden">
              <div className="p-4 border-b border-admin-border bg-admin-bg-page flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar por puesto o empresa..."
                    value={reqSearchTerm}
                    onChange={(e) => setReqSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-admin border border-admin-border focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent bg-white"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-admin-text-secondary px-3 bg-white border border-admin-border rounded-admin">
                  <Filter className="w-4 h-4" />
                  <span>{filteredRequisitions.length} disponibles</span>
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-accent mx-auto mb-4"></div>
                    <p className="text-admin-text-secondary">Cargando requisiciones...</p>
                  </div>
                ) : filteredRequisitions.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-admin-border rounded-admin">
                    <p className="text-admin-text-secondary">No se encontraron requisiciones aprobadas.</p>
                  </div>
                ) : (
                  filteredRequisitions.map(req => {
                    const isSelected = selectedRequisitions.includes(req.id);
                    const company = companies[req.company_id];
                    return (
                      <div 
                        key={req.id}
                        onClick={() => handleRequisitionToggle(req.id, req.company_id)}
                        className={`relative p-4 rounded-admin border cursor-pointer transition-all hover:shadow-md ${
                          isSelected 
                            ? 'bg-admin-accent/5 border-admin-accent ring-1 ring-admin-accent' 
                            : 'bg-white border-admin-border hover:border-admin-accent/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-admin-accent border-admin-accent text-white' : 'border-admin-text-muted bg-white'
                            }`}>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <h3 className="font-semibold text-admin-text-primary">{req.puesto_requerido}</h3>
                              <div className="flex items-center gap-2 text-sm text-admin-text-secondary mt-1">
                                <span className="flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {company?.name || 'Empresa desconocida'}
                                </span>
                                <span>•</span>
                                <span>{req.departamento || 'Sin departamento'}</span>
                                <span>•</span>
                                <span>{new Date(req.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Aprobada
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t border-admin-border bg-admin-bg-page flex justify-between items-center">
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 text-admin-text-secondary hover:text-admin-text-primary transition-colors"
                >
                  Cancelar
                </button>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-admin-text-secondary">
                    {selectedRequisitions.length} seleccionada{selectedRequisitions.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setStep(2)}
                    disabled={selectedRequisitions.length === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-admin-accent text-white rounded-admin hover:bg-admin-accentHover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Edit Details (Existing Form) */}
        {step === 2 && (
          <>
            <div className="sticky top-0 z-20 bg-admin-bg-page/95 backdrop-blur py-4 border-b border-admin-border mb-6 -mx-6 px-6 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => isNew ? setStep(1) : router.back()} 
                  className="p-2 hover:bg-admin-bg-hover rounded-full transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-admin-text-secondary" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-admin-text-primary">
                    {isNew ? 'Detalles del Anuncio' : 'Editar Anuncio'}
                  </h1>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      formData.status === 'published' ? 'bg-green-100 text-green-800' :
                      formData.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {formData.status === 'published' ? 'Publicado' :
                       formData.status === 'draft' ? 'Borrador' : 'Archivado'}
                    </span>
                    <span className="text-admin-text-secondary">
                      {isNew ? 'Crea una nueva oferta de empleo' : 'Modifica los detalles de la oferta'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isNew && (
                  <div className="flex items-center gap-2 mr-2">
                    {formData.status !== 'published' && (
                      <button
                        onClick={() => handleQuickAction('publish')}
                        className="p-2 text-admin-text-secondary hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                        title="Publicar"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}
                    {formData.status !== 'draft' && (
                      <button
                        onClick={() => handleQuickAction('draft')}
                        className="p-2 text-admin-text-secondary hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                        title="Convertir a Borrador"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleQuickAction('delete')}
                      className="p-2 text-admin-text-secondary hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-admin-accent text-white rounded-admin hover:bg-admin-accentHover disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
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
                    <RichTextEditor
                      value={formData.description || ''}
                      onChange={value => setFormData(prev => ({ ...prev, description: value }))}
                    />
                  </div>
                </div>

                {/* Company & Contact Info */}
                <div className="bg-admin-bg-card p-6 rounded-admin shadow-sm border border-admin-border space-y-4">
                  <h2 className="text-lg font-semibold text-admin-text-primary border-b border-admin-border pb-2">Información de la Empresa y Contacto</h2>
                  
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-admin">
                    <input
                      type="checkbox"
                      id="isAnonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 text-admin-accent border-admin-border rounded focus:ring-admin-accent"
                    />
                    <label htmlFor="isAnonymous" className="text-sm font-medium text-blue-800 cursor-pointer select-none">
                      Publicar como anónimo (Ocultar información de la empresa y contacto)
                    </label>
                  </div>

                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${isAnonymous ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-admin-text-secondary mb-1">Nombre de la Empresa (Visible en el anuncio)</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted" />
                        <input
                          type="text"
                          value={companyInfo.name}
                          onChange={e => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full pl-10 pr-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-admin-text-secondary mb-1">Sitio Web</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted" />
                        <input
                          type="text"
                          value={companyInfo.website}
                          onChange={e => setCompanyInfo(prev => ({ ...prev, website: e.target.value }))}
                          className="w-full pl-10 pr-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-admin-text-secondary mb-1">Email de Contacto</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted" />
                        <input
                          type="email"
                          value={companyInfo.email}
                          onChange={e => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full pl-10 pr-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-admin-text-secondary mb-1">Teléfono</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted" />
                        <input
                          type="text"
                          value={companyInfo.phone}
                          onChange={e => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full pl-10 pr-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-admin-text-secondary mb-1">Dirección</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted" />
                        <input
                          type="text"
                          value={companyInfo.address}
                          onChange={e => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full pl-10 pr-3 py-2 border border-admin-border rounded-admin focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent outline-none transition-all"
                        />
                      </div>
                    </div>
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
                  <div className="flex items-center justify-between border-b border-admin-border pb-2">
                    <h2 className="text-lg font-semibold text-admin-text-primary">Requisiciones</h2>
                    <button
                      onClick={() => setShowReqModal(true)}
                      className="text-sm text-admin-accent hover:text-admin-accentHover font-medium transition-colors"
                    >
                      Gestionar
                    </button>
                  </div>
                  <p className="text-xs text-admin-text-muted">Requisiciones aprobadas vinculadas a este anuncio.</p>
                  
                  <div className="space-y-2">
                    {selectedRequisitions.length === 0 ? (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-admin text-sm text-red-600 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Debe vincular al menos una requisición.</span>
                      </div>
                    ) : (
                      selectedRequisitions.map(reqId => {
                        const req = availableRequisitions.find(r => r.id === reqId);
                        if (!req) return null;
                        return (
                          <div key={reqId} className="p-3 bg-admin-bg-page border border-admin-border rounded-admin text-sm">
                            <div className="font-medium text-admin-text-primary">{req.puesto_requerido}</div>
                            <div className="text-xs text-admin-text-muted mt-1">
                              {companies[req.company_id]?.name} • {new Date(req.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Requisition Selection Modal */}
        {showReqModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-admin shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-admin-border flex items-center justify-between">
                <h3 className="text-lg font-bold text-admin-text-primary">Gestionar Requisiciones</h3>
                <button onClick={() => setShowReqModal(false)} className="text-admin-text-secondary hover:text-admin-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 border-b border-admin-border bg-admin-bg-page">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar por puesto o empresa..."
                    value={reqSearchTerm}
                    onChange={(e) => setReqSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-admin border border-admin-border focus:outline-none focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent bg-white"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredRequisitions.map(req => {
                  const isSelected = selectedRequisitions.includes(req.id);
                  const company = companies[req.company_id];
                  return (
                    <div 
                      key={req.id}
                      onClick={() => handleRequisitionToggle(req.id, req.company_id)}
                      className={`relative p-3 rounded-admin border cursor-pointer transition-all hover:shadow-sm ${
                        isSelected 
                          ? 'bg-admin-accent/5 border-admin-accent ring-1 ring-admin-accent' 
                          : 'bg-white border-admin-border hover:border-admin-accent/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-admin-accent border-admin-accent text-white' : 'border-admin-text-muted bg-white'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="font-medium text-admin-text-primary">{req.puesto_requerido}</div>
                            <div className="text-xs text-admin-text-muted">
                              {company?.name} • {req.departamento}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Aprobada</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-admin-border bg-admin-bg-page flex justify-end gap-3">
                <button
                  onClick={() => setShowReqModal(false)}
                  className="px-4 py-2 text-admin-text-secondary hover:text-admin-text-primary transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => setShowReqModal(false)}
                  disabled={selectedRequisitions.length === 0}
                  className="px-4 py-2 bg-admin-accent text-white rounded-admin hover:bg-admin-accentHover disabled:opacity-50 transition-colors"
                >
                  Confirmar Selección ({selectedRequisitions.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-admin shadow-xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertTriangle className="w-8 h-8" />
                <h3 className="text-lg font-bold">Eliminar Anuncio</h3>
              </div>
              <p className="text-admin-text-secondary mb-6">
                ¿Estás seguro de que deseas eliminar este anuncio? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-admin-text-secondary hover:text-admin-text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-admin hover:bg-red-700 transition-colors"
                >
                  Eliminar Definitivamente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireRoleClient>
  );
}
