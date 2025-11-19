import { supabase } from './supabaseClient';
import type { JobAd, CreateJobAdDTO, UpdateJobAdDTO, JobAdRequisitionAssignment } from './types/job-ads';

export async function createJobAd(data: CreateJobAdDTO): Promise<JobAd> {
  const { requisition_ids, ...adData } = data;
  
  // 1. Create the Job Ad
  const { data: jobAd, error } = await supabase
    .from('job_ads')
    .insert({
      ...adData,
      // Ensure defaults if not provided
      status: adData.status || 'draft',
      custom_fields: adData.custom_fields || { schema_version: 1, fields: [] },
    })
    .select()
    .single();

  if (error) throw new Error(`Error creating job ad: ${error.message}`);

  // 2. Assign requisitions if provided
  if (requisition_ids && requisition_ids.length > 0) {
    await assignRequisitionsToAd(jobAd.id, requisition_ids);
  }

  return jobAd;
}

export async function updateJobAd(id: string, data: UpdateJobAdDTO): Promise<JobAd> {
  const { requisition_ids, ...adData } = data;

  const { data: jobAd, error } = await supabase
    .from('job_ads')
    .update(adData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Error updating job ad: ${error.message}`);

  // Update assignments if provided
  if (requisition_ids !== undefined) {
     // Get current assignments
     const { data: currentAssignments } = await supabase
        .from('job_ad_requisition_assignments')
        .select('requisition_id')
        .eq('job_ad_id', id);
     
     const currentIds = currentAssignments?.map(a => a.requisition_id) || [];
     const newIds = requisition_ids;

     const toAdd = newIds.filter(rid => !currentIds.includes(rid));
     const toRemove = currentIds.filter(rid => !newIds.includes(rid));

     if (toRemove.length > 0) {
       await supabase
         .from('job_ad_requisition_assignments')
         .delete()
         .eq('job_ad_id', id)
         .in('requisition_id', toRemove);
     }

     if (toAdd.length > 0) {
       await assignRequisitionsToAd(id, toAdd);
     }
  }

  return jobAd;
}

export async function getJobAds(filters?: { status?: string; company_id?: string; search?: string }): Promise<JobAd[]> {
  let query = supabase
    .from('job_ads')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.company_id) query = query.eq('company_id', filters.company_id);
  if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Error fetching job ads: ${error.message}`);
  return data || [];
}

export async function getJobAdById(id: string): Promise<JobAd | null> {
  const { data, error } = await supabase
    .from('job_ads')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Error fetching job ad: ${error.message}`);
  }
  return data;
}

export async function getJobAdBySlug(slug: string): Promise<JobAd | null> {
  const { data, error } = await supabase
    .from('job_ads')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error fetching job ad: ${error.message}`);
  }
  return data;
}

export async function assignRequisitionsToAd(jobAdId: string, requisitionIds: string[]): Promise<void> {
  const inserts = requisitionIds.map(reqId => ({
    job_ad_id: jobAdId,
    requisition_id: reqId
  }));

  const { error } = await supabase
    .from('job_ad_requisition_assignments')
    .insert(inserts);

  if (error) throw new Error(`Error assigning requisitions: ${error.message}`);
}

export async function getJobAdAssignments(jobAdId: string): Promise<JobAdRequisitionAssignment[]> {
    const { data, error } = await supabase
        .from('job_ad_requisition_assignments')
        .select('*')
        .eq('job_ad_id', jobAdId);
    
    if (error) throw new Error(`Error fetching assignments: ${error.message}`);
    return data || [];
}
