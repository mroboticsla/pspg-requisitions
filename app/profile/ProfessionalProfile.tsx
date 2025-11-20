"use client";

import React, { useState, useEffect } from 'react';
import { 
  FullCandidateProfile, 
  CandidateExperience, 
  CandidateEducation,
  JobProfileData,
  initialJobProfileData
} from '@/lib/types/candidates';
import { 
  getCandidateProfile, 
  updateCandidateProfile, 
  addExperience, 
  updateExperience, 
  deleteExperience,
  addEducation,
  updateEducation,
  deleteEducation,
  uploadResume
} from '@/lib/candidates';
import { useToast } from '@/lib/useToast';
import { Plus, Trash2, Edit2, Upload, FileText, ExternalLink, X } from 'lucide-react';
import JobProfileForm from '@/app/components/JobProfileForm';

interface Props {
  userId: string;
}

export default function ProfessionalProfile({ userId }: Props) {
  const [profile, setProfile] = useState<FullCandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { success, error } = useToast();

  // Form States
  const [showExpForm, setShowExpForm] = useState(false);
  const [editingExp, setEditingExp] = useState<CandidateExperience | null>(null);
  
  const [showEduForm, setShowEduForm] = useState(false);
  const [editingEdu, setEditingEdu] = useState<CandidateEducation | null>(null);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getCandidateProfile(userId);
      setProfile(data);
    } catch (err) {
      error('Error al cargar el perfil profesional');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarySave = async () => {
    if (!profile) return;
    try {
      console.log('Guardando información general...', { userId, data: {
        summary: profile.summary,
        linkedin_url: profile.linkedin_url,
        portfolio_url: profile.portfolio_url
      }});
      
      const result = await updateCandidateProfile(userId, { 
        summary: profile.summary,
        linkedin_url: profile.linkedin_url,
        portfolio_url: profile.portfolio_url
      });
      
      console.log('Resultado:', result);
      
      if (result.error) {
        console.error('Error de Supabase:', result.error);
        error(`Error al guardar: ${result.error.message}`);
      } else {
        success('Información general actualizada');
      }
    } catch (err) {
      console.error('Error al guardar información:', err);
      error('Error al guardar información');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (file.type !== 'application/pdf') {
      error('Solo se permiten archivos PDF');
      return;
    }

    try {
      setUploading(true);
      const url = await uploadResume(userId, file);
      setProfile(prev => prev ? { ...prev, resume_url: url } : null);
      success('CV subido exitosamente');
    } catch (err) {
      error('Error al subir el CV');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // --- Experience Handlers ---
  const handleSaveExperience = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      profile_id: userId,
      company: formData.get('company') as string,
      position: formData.get('position') as string,
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string || null,
      is_current: formData.get('is_current') === 'on',
      description: formData.get('description') as string
    };

    try {
      if (editingExp) {
        await updateExperience(editingExp.id, data);
        success('Experiencia actualizada');
      } else {
        await addExperience(data);
        success('Experiencia agregada');
      }
      setShowExpForm(false);
      setEditingExp(null);
      loadProfile();
    } catch (err) {
      error('Error al guardar experiencia');
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta experiencia?')) return;
    try {
      await deleteExperience(id);
      loadProfile();
      success('Experiencia eliminada');
    } catch (err) {
      error('Error al eliminar experiencia');
    }
  };

  // --- Education Handlers ---
  const handleSaveEducation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      profile_id: userId,
      institution: formData.get('institution') as string,
      degree: formData.get('degree') as string,
      field_of_study: formData.get('field_of_study') as string,
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string || null,
      is_current: formData.get('is_current') === 'on'
    };

    try {
      if (editingEdu) {
        await updateEducation(editingEdu.id, data);
        success('Educación actualizada');
      } else {
        await addEducation(data);
        success('Educación agregada');
      }
      setShowEduForm(false);
      setEditingEdu(null);
      loadProfile();
    } catch (err) {
      error('Error al guardar educación');
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta educación?')) return;
    try {
      await deleteEducation(id);
      loadProfile();
      success('Educación eliminada');
    } catch (err) {
      error('Error al eliminar educación');
    }
  };

  // --- Job Profile (Complementary Info) Handlers ---
  const handleJobProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!profile) return;
    
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setProfile({
      ...profile,
      job_profile: {
        ...(profile.job_profile || initialJobProfileData),
        [name]: type === 'checkbox' ? checked : value
      }
    });
  };

  const handleJobProfileNestedChange = (section: string, field: string, checked: boolean) => {
    if (!profile) return;
    
    setProfile({
      ...profile,
      job_profile: {
        ...(profile.job_profile || initialJobProfileData),
        [section]: {
          ...((profile.job_profile?.[section as keyof JobProfileData] || {}) as any),
          [field]: checked
        }
      }
    });
  };

  const handleSaveJobProfile = async () => {
    if (!profile) return;
    
    try {
      console.log('Guardando job profile...', { userId, job_profile: profile.job_profile });
      
      const result = await updateCandidateProfile(userId, { 
        job_profile: profile.job_profile 
      });
      
      console.log('Resultado:', result);
      
      if (result.error) {
        console.error('Error de Supabase:', result.error);
        error(`Error al guardar: ${result.error.message}`);
      } else {
        success('Información complementaria actualizada');
      }
    } catch (err) {
      console.error('Error al guardar información complementaria:', err);
      error('Error al guardar información complementaria');
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando perfil profesional...</div>;
  if (!profile) return <div className="p-8 text-center">No se pudo cargar el perfil.</div>;

  return (
    <div className="space-y-8">
      {/* 1. Resumen y CV */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acerca de Ti</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿Cómo te describes en el trabajo?</label>
              <textarea
              rows={4}
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent px-3 py-2"
              placeholder="Describe tu perfil profesional, objetivos y fortalezas..."
              value={profile.summary || ''}
              onChange={e => setProfile({ ...profile, summary: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input
                type="url"
                className="w-full rounded-md border border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent px-3 py-2"
                value={profile.linkedin_url || ''}
                onChange={e => setProfile({ ...profile, linkedin_url: e.target.value })}
              />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portafolio / Web</label>
              <input
                type="url"
                className="w-full rounded-md border border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent px-3 py-2"
                value={profile.portfolio_url || ''}
                onChange={e => setProfile({ ...profile, portfolio_url: e.target.value })}
              />
              </div>
            </div>
            <button
              onClick={handleSummarySave}
              className="px-4 py-2 bg-brand-dark text-white rounded-md hover:bg-brand-accent transition-colors text-sm font-medium"
            >
              Guardar Información General
            </button>
            </div>

          <div className="border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0 md:pl-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Curriculum Vitae (PDF)</label>
            
            {profile.resume_url ? (
              <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600 truncate">CV Cargado</span>
                </div>
                <a 
                  href={profile.resume_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-accent hover:text-brand-dark"
                  title="Ver CV"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div className="mb-4 p-6 border-2 border-dashed border-gray-300 rounded-md text-center bg-gray-50">
                <p className="text-sm text-gray-500">No has subido tu CV aún</p>
              </div>
            )}

            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="resume-upload"
                disabled={uploading}
              />
              <label
                htmlFor="resume-upload"
                className={`flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Subiendo...' : (profile.resume_url ? 'Actualizar CV' : 'Subir CV')}
              </label>
              <p className="mt-2 text-xs text-gray-500 text-center">Solo archivos PDF (Max. 5MB)</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Información Complementaria para Análisis de Compatibilidad */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Resumen de Experiencia Laboral</h3>
          <p className="text-sm text-gray-600 mt-1">
            Esta información ayuda a analizar tu compatibilidad con las ofertas de trabajo disponibles
          </p>
        </div>
        
        <JobProfileForm
          data={profile.job_profile || initialJobProfileData}
          onChange={handleJobProfileChange}
          onNestedChange={handleJobProfileNestedChange}
        />
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveJobProfile}
            className="px-4 py-2 bg-brand-dark text-white rounded-md hover:bg-brand-accent transition-colors text-sm font-medium"
          >
            Guardar Información Complementaria
          </button>
        </div>
      </div>

      {/* 3. Experiencia Laboral */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Experiencia Laboral</h3>
          <button
            onClick={() => { setEditingExp(null); setShowExpForm(true); }}
            className="flex items-center gap-1 text-sm text-brand-accent hover:text-brand-dark font-medium"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {showExpForm && (
            <form onSubmit={handleSaveExperience} className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <input required name="company" defaultValue={editingExp?.company} className="w-full rounded-md border border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent px-3 py-2" />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <input required name="position" defaultValue={editingExp?.position} className="w-full rounded-md border border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent px-3 py-2" />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
              <input required type="date" name="start_date" defaultValue={editingExp?.start_date} className="w-full rounded-md border border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent px-3 py-2" />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
              <input type="date" name="end_date" defaultValue={editingExp?.end_date || ''} className="w-full rounded-md border border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent px-3 py-2" />
              </div>
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="is_current" defaultChecked={editingExp?.is_current} className="rounded border border-gray-300 text-brand-accent focus:ring-brand-accent" />
              Trabajo actual
              </label>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea name="description" rows={3} defaultValue={editingExp?.description || ''} className="w-full rounded-md border border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent px-3 py-2" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowExpForm(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
              <button type="submit" className="px-3 py-1.5 text-sm bg-brand-dark text-white rounded-md hover:bg-brand-accent">Guardar</button>
            </div>
            </form>
        )}

        <div className="space-y-4">
          {profile.experience.map(exp => (
            <div key={exp.id} className="flex justify-between items-start p-3 hover:bg-gray-50 rounded-md transition-colors border-b border-gray-100 last:border-0">
              <div>
                <h4 className="font-medium text-gray-900">{exp.position}</h4>
                <p className="text-sm text-gray-600">{exp.company}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {exp.start_date} - {exp.is_current ? 'Presente' : exp.end_date}
                </p>
                {exp.description && <p className="text-sm text-gray-600 mt-2">{exp.description}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingExp(exp); setShowExpForm(true); }} className="text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDeleteExperience(exp.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {profile.experience.length === 0 && !showExpForm && (
            <p className="text-sm text-gray-500 italic text-center py-4">No has agregado experiencia laboral.</p>
          )}
        </div>
      </div>

      {/* 4. Educación */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Educación</h3>
          <button
            onClick={() => { setEditingEdu(null); setShowEduForm(true); }}
            className="flex items-center gap-1 text-sm text-brand-accent hover:text-brand-dark font-medium"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {showEduForm && (
            <form onSubmit={handleSaveEducation} className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institución</label>
              <input required name="institution" defaultValue={editingEdu?.institution} className="w-full rounded-md border border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent px-3 py-2" />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título / Grado</label>
              <input required name="degree" defaultValue={editingEdu?.degree} className="w-full rounded-md border border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent px-3 py-2" />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campo de Estudio</label>
              <input required name="field_of_study" defaultValue={editingEdu?.field_of_study || ''} className="w-full rounded-md border border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
                <input required type="date" name="start_date" defaultValue={editingEdu?.start_date} className="w-full rounded-md border border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                <input type="date" name="end_date" defaultValue={editingEdu?.end_date || ''} className="w-full rounded-md border border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent px-3 py-2" />
              </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="is_current" defaultChecked={editingEdu?.is_current} className="rounded border border-gray-300 text-brand-accent focus:ring-brand-accent" />
              Cursando actualmente
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowEduForm(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
              <button type="submit" className="px-3 py-1.5 text-sm bg-brand-dark text-white rounded-md hover:bg-brand-accent">Guardar</button>
            </div>
            </form>
        )}

        <div className="space-y-4">
          {profile.education.map(edu => (
            <div key={edu.id} className="flex justify-between items-start p-3 hover:bg-gray-50 rounded-md transition-colors border-b border-gray-100 last:border-0">
              <div>
                <h4 className="font-medium text-gray-900">{edu.degree} en {edu.field_of_study}</h4>
                <p className="text-sm text-gray-600">{edu.institution}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {edu.start_date} - {edu.is_current ? 'Presente' : edu.end_date}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingEdu(edu); setShowEduForm(true); }} className="text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDeleteEducation(edu.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {profile.education.length === 0 && !showEduForm && (
            <p className="text-sm text-gray-500 italic text-center py-4">No has agregado educación.</p>
          )}
        </div>
      </div>
    </div>
  );
}
