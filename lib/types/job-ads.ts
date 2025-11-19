export type JobAdStatus = 'draft' | 'published' | 'archived';

export type JobAdCustomFieldType = 'list' | 'richtext' | 'block' | 'text';

export interface JobAdCustomField {
  key: string;
  label: string;
  type: JobAdCustomFieldType;
  value: any; // string | string[] | { title: string, content: string }
}

export interface JobAdCustomFieldsSchema {
  schema_version: number;
  fields: JobAdCustomField[];
}

export interface JobAd {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  short_description?: string;
  description?: string;
  location?: string;
  employment_type?: string;
  salary_range?: string;
  status: JobAdStatus;
  published_at?: string;
  expiration_date: string;
  company_snapshot: any;
  custom_fields: JobAdCustomFieldsSchema;
  metadata?: any;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface JobAdRequisitionAssignment {
  id: string;
  job_ad_id: string;
  requisition_id: string;
  assigned_at: string;
  assigned_by?: string;
  note?: string;
}

// Helper type for creating a new Job Ad
export type CreateJobAdDTO = Omit<JobAd, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'published_at'> & {
  requisition_ids?: string[]; // Optional initial assignment
};

export type UpdateJobAdDTO = Partial<CreateJobAdDTO>;
