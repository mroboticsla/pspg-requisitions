import { supabase } from './supabaseClient'

const STORAGE_OBJECT_RE =
  /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/([^?]+)/

export function getSupabasePublicOrigin(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
}

export function getStorageObjectPath(
  urlOrPath: string | null | undefined,
  expectedBucket?: string
): string | null {
  if (!urlOrPath) return null
  if (!urlOrPath.startsWith('http://') && !urlOrPath.startsWith('https://')) {
    return urlOrPath.replace(/^\//, '')
  }

  const match = urlOrPath.match(STORAGE_OBJECT_RE)
  if (!match) return null

  const bucket = match[1]
  const path = decodeURIComponent(match[2])
  if (expectedBucket && bucket !== expectedBucket) return null
  return path
}

/**
 * Rebuilds a public storage URL against the current Supabase host.
 * Existing Cloud URLs keep working in the DB until files are copied, then
 * this points them at the self-hosted instance.
 */
export function rewritePublicStorageUrl(
  url: string | null | undefined
): string | null {
  if (!url) return null
  const origin = getSupabasePublicOrigin()
  if (!origin) return url

  const match = url.match(STORAGE_OBJECT_RE)
  if (!match) return url

  const [, bucket, rawPath] = match
  return `${origin}/storage/v1/object/public/${bucket}/${rawPath}`
}

export async function resolveResumeUrl(
  resumeUrl: string | null | undefined
): Promise<string | null> {
  if (!resumeUrl) return null

  const path = getStorageObjectPath(resumeUrl, 'resumes')
  if (!path) return rewritePublicStorageUrl(resumeUrl)

  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(path, 60 * 60)

  if (!error && data?.signedUrl) return data.signedUrl
  return rewritePublicStorageUrl(resumeUrl)
}

export async function openResumeUrl(
  resumeUrl: string | null | undefined
): Promise<void> {
  const href = await resolveResumeUrl(resumeUrl)
  if (href) {
    window.open(href, '_blank', 'noopener,noreferrer')
  }
}
