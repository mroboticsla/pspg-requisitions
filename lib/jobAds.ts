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

export async function deleteJobAd(id: string): Promise<void> {
  // First delete assignments
  await supabase
    .from('job_ad_requisition_assignments')
    .delete()
    .eq('job_ad_id', id);

  // Then delete the ad
  const { error } = await supabase
    .from('job_ads')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error deleting job ad: ${error.message}`);
}

export type JobAdsFilter = {
  status?: string;
  company_id?: string;
  search?: string;
  location?: string;
  employment_type?: string;
  page?: number;
  pageSize?: number;
}

export async function getJobAds(filters?: JobAdsFilter): Promise<{ data: JobAd[], count: number }> {
  let query = supabase
    .from('job_ads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.company_id) query = query.eq('company_id', filters.company_id);
  if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
  }

  if (filters?.page && filters?.pageSize) {
    const from = (filters.page - 1) * filters.pageSize;
    const to = from + filters.pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`Error fetching job ads: ${error.message}`);
  return { data: data || [], count: count || 0 };
}

export async function getPublicJobAds(filters: JobAdsFilter = {}): Promise<{ data: JobAd[], count: number }> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('job_ads')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .gte('expiration_date', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters.location && filters.location !== 'all') {
    query = query.ilike('location', `%${filters.location}%`);
  }

  if (filters.employment_type && filters.employment_type !== 'all') {
    query = query.eq('employment_type', filters.employment_type);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  
  if (error) throw new Error(`Error fetching public job ads: ${error.message}`);
  
  return { data: data || [], count: count || 0 };
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

export async function getJobAdMetrics(jobAdId: string, days: number = 30): Promise<any[]> {
  const { data, error } = await supabase
    .from('job_ad_daily_metrics')
    .select('*')
    .eq('job_ad_id', jobAdId)
    .order('date', { ascending: true })
    .limit(days);

  if (error) throw new Error(`Error fetching metrics: ${error.message}`);
  return data || [];
}

export async function incrementJobAdView(id: string): Promise<void> {
  const { error } = await supabase.rpc('increment_job_ad_view', { ad_id: id });
  if (error) console.error('Error incrementing view count:', error);
}

export async function incrementJobAdApplication(id: string): Promise<void> {
  const { error } = await supabase.rpc('increment_job_ad_application', { ad_id: id });
  if (error) console.error('Error incrementing application count:', error);
}

export async function getJobAdStats(): Promise<{
  total: number;
  published: number;
  expiringSoon: number;
  expired: number;
}> {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  // We can do this with multiple queries or a single RPC if performance matters.
  // For now, let's use separate count queries which is simpler to implement without new SQL.
  
  const { count: total } = await supabase.from('job_ads').select('*', { count: 'exact', head: true });
  
  const { count: published } = await supabase
    .from('job_ads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  const { count: expiringSoon } = await supabase
    .from('job_ads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .gt('expiration_date', now.toISOString())
    .lte('expiration_date', sevenDaysFromNow.toISOString());

  const { count: expired } = await supabase
    .from('job_ads')
    .select('*', { count: 'exact', head: true })
    .lt('expiration_date', now.toISOString());

  return {
    total: total || 0,
    published: published || 0,
    expiringSoon: expiringSoon || 0,
    expired: expired || 0
  };
}
