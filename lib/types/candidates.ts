export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type LanguageProficiency = 'basic' | 'intermediate' | 'advanced' | 'native';

export interface CandidateProfile {
  id: string;
  resume_url: string | null;
  summary: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
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
}
