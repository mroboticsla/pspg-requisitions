import { supabase } from './supabaseClient';
import { 
  CandidateProfile, 
  CandidateExperience, 
  CandidateEducation, 
  CandidateSkill, 
  CandidateLanguage,
  FullCandidateProfile,
  SkillLevel,
  LanguageProficiency
} from './types/candidates';
import { Requisition, NivelHabilidad } from './types/requisitions';

// --- CRUD Operations ---

export async function getCandidateProfile(userId: string): Promise<FullCandidateProfile | null> {
  // 1. Get base profile info
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name, phone')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Error fetching base profile:', profileError);
    return null;
  }

  // 2. Get candidate specific profile
  const { data: candidateData, error: candidateError } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (candidateError && candidateError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error fetching candidate profile:', candidateError);
    return null;
  }

  // If no candidate profile exists yet, return a partial structure
  const baseCandidate = candidateData || {
    id: userId,
    resume_url: null,
    summary: null,
    linkedin_url: null,
    portfolio_url: null,
    job_profile: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 3. Get related data in parallel
  const [expRes, eduRes, skillRes, langRes] = await Promise.all([
    supabase.from('candidate_experience').select('*').eq('profile_id', userId).order('start_date', { ascending: false }),
    supabase.from('candidate_education').select('*').eq('profile_id', userId).order('start_date', { ascending: false }),
    supabase.from('candidate_skills').select('*').eq('profile_id', userId),
    supabase.from('candidate_languages').select('*').eq('profile_id', userId)
  ]);

  return {
    ...baseCandidate,
    first_name: profileData.first_name,
    last_name: profileData.last_name,
    phone: profileData.phone,
    experience: expRes.data || [],
    education: eduRes.data || [],
    skills: skillRes.data || [],
    languages: langRes.data || []
  };
}

export async function updateCandidateProfile(userId: string, data: Partial<CandidateProfile>) {
  // Check if profile exists
  const { data: existing } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (existing) {
    return await supabase
      .from('candidate_profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', userId);
  } else {
    return await supabase
      .from('candidate_profiles')
      .insert({ ...data, id: userId });
  }
}

// --- Experience ---
export async function addExperience(experience: Omit<CandidateExperience, 'id' | 'created_at'>) {
  return await supabase.from('candidate_experience').insert(experience).select().single();
}

export async function updateExperience(id: string, experience: Partial<CandidateExperience>) {
  return await supabase.from('candidate_experience').update(experience).eq('id', id).select().single();
}

export async function deleteExperience(id: string) {
  return await supabase.from('candidate_experience').delete().eq('id', id);
}

// --- Education ---
export async function addEducation(education: Omit<CandidateEducation, 'id' | 'created_at'>) {
  return await supabase.from('candidate_education').insert(education).select().single();
}

export async function updateEducation(id: string, education: Partial<CandidateEducation>) {
  return await supabase.from('candidate_education').update(education).eq('id', id).select().single();
}

export async function deleteEducation(id: string) {
  return await supabase.from('candidate_education').delete().eq('id', id);
}

// --- Skills ---
export async function addSkill(skill: Omit<CandidateSkill, 'id' | 'created_at'>) {
  return await supabase.from('candidate_skills').insert(skill).select().single();
}

export async function deleteSkill(id: string) {
  return await supabase.from('candidate_skills').delete().eq('id', id);
}

// --- Languages ---
export async function addLanguage(language: Omit<CandidateLanguage, 'id' | 'created_at'>) {
  return await supabase.from('candidate_languages').insert(language).select().single();
}

export async function deleteLanguage(id: string) {
  return await supabase.from('candidate_languages').delete().eq('id', id);
}

// --- Resume Upload ---
export async function uploadResume(userId: string, file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `user-${userId}/resume-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('resumes')
    .getPublicUrl(fileName);

  // Update profile with URL
  await updateCandidateProfile(userId, { resume_url: publicUrl } as any);

  return publicUrl;
}

// --- Matching Logic ---

export interface MatchResult {
  score: number; // 0-100
  matches: {
    category: string;
    item: string;
    status: 'match' | 'partial' | 'missing';
    details?: string;
    reason?: string;
    candidateValue?: string;
  }[];
}

export function analyzeCandidateMatch(candidate: FullCandidateProfile, requisition: Requisition): MatchResult {
  const matches: MatchResult['matches'] = [];
  let totalPoints = 0;
  let earnedPoints = 0;

  // 1. Education Match
  if (requisition.formacion_academica) {
    const reqEdu = requisition.formacion_academica;
    const candEdu = candidate.education.map(e => e.degree.toLowerCase());
    
    // Map requisition fields to generic degree terms
    const eduMap: Record<string, string[]> = {
      'bachiller': ['bachiller', 'preparatoria', 'high school'],
      'tecnico': ['técnico', 'tecnico', 'associate'],
      'universitario': ['licenciatura', 'ingeniería', 'ingenieria', 'bachelor', 'grado', 'profesional'],
      'profesional': ['licenciatura', 'ingeniería', 'ingenieria', 'bachelor', 'grado', 'profesional'],
      'maestria': ['maestría', 'maestria', 'master'],
      'especializacion': ['especialización', 'especializacion', 'specialization', 'diplomado'],
      'doctorado': ['doctorado', 'phd']
    };

    Object.entries(reqEdu).forEach(([key, required]) => {
      if (required && key !== 'detalles' && key !== 'otro') {
        totalPoints += 10;
        const terms = eduMap[key] || [key];
        
        // Check structured education list
        const hasDegreeInList = candEdu.some(d => terms.some(t => d.includes(t)));
        
        // Check job_profile booleans
        let hasDegreeInProfile = false;
        if (candidate.job_profile) {
          if (key === 'bachiller' && candidate.job_profile.bachiller) hasDegreeInProfile = true;
          if (key === 'tecnico' && candidate.job_profile.tecnico) hasDegreeInProfile = true;
          if (key === 'universitario' && candidate.job_profile.profesional) hasDegreeInProfile = true;
          if (key === 'profesional' && candidate.job_profile.profesional) hasDegreeInProfile = true;
          if (key === 'maestria' && candidate.job_profile.especializacion) hasDegreeInProfile = true; // Mapping especializacion to maestria loosely or just as advanced
          if (key === 'especializacion' && candidate.job_profile.especializacion) hasDegreeInProfile = true;
        }

        if (hasDegreeInList || hasDegreeInProfile) {
          earnedPoints += 10;
          matches.push({ 
            category: 'Educación', 
            item: key, 
            status: 'match',
            candidateValue: hasDegreeInProfile ? 'Marcado en perfil complementario' : 'Posee título relacionado'
          });
        } else {
          matches.push({ 
            category: 'Educación', 
            item: key, 
            status: 'missing',
            reason: 'No se encontró título requerido',
            candidateValue: candEdu.length > 0 ? candEdu.join(', ') : 'Sin educación registrada'
          });
        }
      }
    });
  }

  // 2. Language Match (English)
  if (requisition.idiomas?.ingles) {
    totalPoints += 10;
    const english = candidate.languages.find(l => l.language.toLowerCase().includes('ingl') || l.language.toLowerCase().includes('engl'));
    const hasEnglishInProfile = candidate.job_profile?.idiomaIngles;

    if (english) {
      if (['advanced', 'native'].includes(english.proficiency)) {
        earnedPoints += 10;
        matches.push({ 
          category: 'Idioma', 
          item: 'Inglés', 
          status: 'match', 
          details: english.proficiency,
          candidateValue: english.proficiency
        });
      } else {
        earnedPoints += 5;
        matches.push({ 
          category: 'Idioma', 
          item: 'Inglés', 
          status: 'partial', 
          details: english.proficiency,
          reason: 'Nivel inferior al ideal',
          candidateValue: english.proficiency
        });
      }
    } else if (hasEnglishInProfile) {
      // Fallback to job_profile boolean
      earnedPoints += 5; // Assume at least partial/basic if checked
      matches.push({ 
        category: 'Idioma', 
        item: 'Inglés', 
        status: 'partial', 
        details: 'Nivel no especificado',
        candidateValue: 'Marcado en perfil complementario'
      });
    } else {
      matches.push({ 
        category: 'Idioma', 
        item: 'Inglés', 
        status: 'missing',
        reason: 'No registrado en perfil',
        candidateValue: 'No especificado'
      });
    }
  }

  // 3. IT Skills
  if (requisition.habilidad_informatica) {
    const itSkills = requisition.habilidad_informatica;
    
    // Standard Office
    ['word', 'excel', 'powerpoint', 'outlook'].forEach(tool => {
      const level = (itSkills as any)[tool] as NivelHabilidad | undefined;
      if (level) {
        totalPoints += 5;
        const candSkill = candidate.skills.find(s => s.skill_name.toLowerCase().includes(tool));
        
        // Check job_profile
        let profileLevel: string | null = null;
        if (candidate.job_profile) {
          if (['word', 'excel', 'powerpoint'].includes(tool)) {
            const p = candidate.job_profile.wordExcelPowerPoint;
            if (p?.avanzado) profileLevel = 'avanzado';
            else if (p?.intermedio) profileLevel = 'intermedio';
            else if (p?.basico) profileLevel = 'basico';
          } else if (tool === 'outlook') {
            const p = candidate.job_profile.correoElectronico;
            if (p?.avanzado) profileLevel = 'avanzado';
            else if (p?.intermedio) profileLevel = 'intermedio';
            else if (p?.basico) profileLevel = 'basico';
          }
        }

        if (candSkill) {
          // Simple comparison logic
          earnedPoints += 5; // Assume match if listed for now
          matches.push({ 
            category: 'Informática', 
            item: tool, 
            status: 'match', 
            details: candSkill.level,
            candidateValue: candSkill.level
          });
        } else if (profileLevel) {
           earnedPoints += 5;
           matches.push({ 
            category: 'Informática', 
            item: tool, 
            status: 'match', 
            details: profileLevel,
            candidateValue: `Perfil: ${profileLevel}`
          });
        } else {
          matches.push({ 
            category: 'Informática', 
            item: tool, 
            status: 'missing',
            reason: 'No listado en habilidades',
            candidateValue: 'No especificado'
          });
        }
      }
    });

    // Check Internet & Databases from job_profile as well if requested (though not standard fields in requisition type shown in snippet, let's be safe)
    if (itSkills.base_datos) {
       totalPoints += 5;
       const candSkill = candidate.skills.find(s => s.skill_name.toLowerCase().includes('base de datos') || s.skill_name.toLowerCase().includes('sql'));
       
       let profileLevel: string | null = null;
       if (candidate.job_profile?.baseDatos) {
          const p = candidate.job_profile.baseDatos;
          if (p.avanzado) profileLevel = 'avanzado';
          else if (p.intermedio) profileLevel = 'intermedio';
          else if (p.basico) profileLevel = 'basico';
       }

       if (candSkill || profileLevel) {
         earnedPoints += 5;
         matches.push({ category: 'Informática', item: 'Base de Datos', status: 'match', candidateValue: profileLevel || candSkill?.level });
       } else {
         matches.push({ category: 'Informática', item: 'Base de Datos', status: 'missing', candidateValue: 'No especificado' });
       }
    }

    if (itSkills.internet) {
       totalPoints += 5;
       let profileLevel: string | null = null;
       if (candidate.job_profile?.internet) {
          const p = candidate.job_profile.internet;
          if (p.avanzado) profileLevel = 'avanzado';
          else if (p.intermedio) profileLevel = 'intermedio';
          else if (p.basico) profileLevel = 'basico';
       }

       if (profileLevel) {
         earnedPoints += 5;
         matches.push({ category: 'Informática', item: 'Internet', status: 'match', candidateValue: profileLevel });
       } else {
         matches.push({ category: 'Informática', item: 'Internet', status: 'missing', candidateValue: 'No especificado' });
       }
    }

    // Specific Software
    if (itSkills.software_especifico) {
      itSkills.software_especifico.forEach(soft => {
        totalPoints += 10;
        const candSkill = candidate.skills.find(s => s.skill_name.toLowerCase().includes(soft.nombre.toLowerCase()));
        
        if (candSkill) {
          earnedPoints += 10;
          matches.push({ 
            category: 'Software', 
            item: soft.nombre, 
            status: 'match', 
            details: candSkill.level,
            candidateValue: candSkill.level
          });
        } else {
          matches.push({ 
            category: 'Software', 
            item: soft.nombre, 
            status: 'missing',
            reason: 'Software no encontrado',
            candidateValue: 'No especificado'
          });
        }
      });
    }
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  return { score, matches };
}
