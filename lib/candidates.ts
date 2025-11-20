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
      'universitario': ['licenciatura', 'ingeniería', 'ingenieria', 'bachelor', 'grado'],
      'maestria': ['maestría', 'maestria', 'master'],
      'doctorado': ['doctorado', 'phd']
    };

    Object.entries(reqEdu).forEach(([key, required]) => {
      if (required && key !== 'detalles' && key !== 'otro') {
        totalPoints += 10;
        const terms = eduMap[key] || [key];
        const hasDegree = candEdu.some(d => terms.some(t => d.includes(t)));
        
        if (hasDegree) {
          earnedPoints += 10;
          matches.push({ category: 'Educación', item: key, status: 'match' });
        } else {
          matches.push({ category: 'Educación', item: key, status: 'missing' });
        }
      }
    });
  }

  // 2. Language Match (English)
  if (requisition.idioma_ingles) {
    totalPoints += 10;
    const english = candidate.languages.find(l => l.language.toLowerCase().includes('ingl') || l.language.toLowerCase().includes('engl'));
    
    if (english) {
      if (['advanced', 'native'].includes(english.proficiency)) {
        earnedPoints += 10;
        matches.push({ category: 'Idioma', item: 'Inglés', status: 'match', details: english.proficiency });
      } else {
        earnedPoints += 5;
        matches.push({ category: 'Idioma', item: 'Inglés', status: 'partial', details: english.proficiency });
      }
    } else {
      matches.push({ category: 'Idioma', item: 'Inglés', status: 'missing' });
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
        
        if (candSkill) {
          // Simple comparison logic
          earnedPoints += 5; // Assume match if listed for now
          matches.push({ category: 'Informática', item: tool, status: 'match', details: candSkill.level });
        } else {
          matches.push({ category: 'Informática', item: tool, status: 'missing' });
        }
      }
    });

    // Specific Software
    if (itSkills.software_especifico) {
      itSkills.software_especifico.forEach(soft => {
        totalPoints += 10;
        const candSkill = candidate.skills.find(s => s.skill_name.toLowerCase().includes(soft.nombre.toLowerCase()));
        
        if (candSkill) {
          earnedPoints += 10;
          matches.push({ category: 'Software', item: soft.nombre, status: 'match', details: candSkill.level });
        } else {
          matches.push({ category: 'Software', item: soft.nombre, status: 'missing' });
        }
      });
    }
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  return { score, matches };
}
