export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type LanguageProficiency = 'basic' | 'intermediate' | 'advanced' | 'native';

export interface CandidateProfile {
  id: string;
  resume_url: string | null;
  summary: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  job_profile?: JobProfileData | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateExperience {
  id: string;
  profile_id: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  created_at?: string;
}

export interface CandidateEducation {
  id: string;
  profile_id: string;
  institution: string;
  degree: string;
  field_of_study: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  created_at?: string;
}

export interface CandidateSkill {
  id: string;
  profile_id: string;
  skill_name: string;
  level: SkillLevel;
  created_at?: string;
}

export interface CandidateLanguage {
  id: string;
  profile_id: string;
  language: string;
  proficiency: LanguageProficiency;
  created_at?: string;
}

export interface FullCandidateProfile extends CandidateProfile {
  experience: CandidateExperience[];
  education: CandidateEducation[];
  skills: CandidateSkill[];
  languages: CandidateLanguage[];
  // Basic profile info from 'profiles' table
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  job_profile?: JobProfileData;
}

export interface JobProfileData {
  // Formación académica
  bachiller: boolean;
  tecnico: boolean;
  profesional: boolean;
  especializacion: boolean;
  estudianteUniversitario: boolean;
  idiomaEspanol: boolean;
  idiomaIngles: boolean;
  idiomaFrances: boolean;
  idiomaAleman: boolean;
  idiomaPortugues: boolean;
  idiomaItaliano: boolean;
  idiomaMandarin: boolean;
  otrosEstudios: string;

  // Habilidad informática
  sistemaOperativo: {
    windows: boolean;
    linux: boolean;
    macos: boolean;
    otros: boolean;
  };
  wordExcelPowerPoint: {
    basico: boolean;
    intermedio: boolean;
    avanzado: boolean;
  };
  baseDatos: {
    basico: boolean;
    intermedio: boolean;
    avanzado: boolean;
  };
  internet: {
    basico: boolean;
    intermedio: boolean;
    avanzado: boolean;
  };
  correoElectronico: {
    basico: boolean;
    intermedio: boolean;
    avanzado: boolean;
  };
  otroEspecifique: string;

  // Habilidad y conocimientos técnicos
  informacion: boolean;
  maquinariaEquipos: boolean;
  decisiones: boolean;
  supervisionPersonal: boolean;
  responsabilidades: {
    confidencial: boolean;
    restringida: boolean;
  };
  supervision: {
    directa: boolean;
    indirecta: boolean;
  };
}

export const initialJobProfileData: JobProfileData = {
  bachiller: false,
  tecnico: false,
  profesional: false,
  especializacion: false,
  estudianteUniversitario: false,
  idiomaEspanol: false,
  idiomaIngles: false,
  idiomaFrances: false,
  idiomaAleman: false,
  idiomaPortugues: false,
  idiomaItaliano: false,
  idiomaMandarin: false,
  otrosEstudios: '',
  sistemaOperativo: { windows: false, linux: false, macos: false, otros: false },
  wordExcelPowerPoint: { basico: false, intermedio: false, avanzado: false },
  baseDatos: { basico: false, intermedio: false, avanzado: false },
  internet: { basico: false, intermedio: false, avanzado: false },
  correoElectronico: { basico: false, intermedio: false, avanzado: false },
  otroEspecifique: '',
  informacion: false,
  maquinariaEquipos: false,
  decisiones: false,
  supervisionPersonal: false,
  responsabilidades: { confidencial: false, restringida: false },
  supervision: { directa: false, indirecta: false },
};
