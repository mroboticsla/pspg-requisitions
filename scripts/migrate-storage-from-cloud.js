/**
 * Copy Storage buckets + objects from Supabase Cloud to self-hosted,
 * then rewrite avatar_url / resume_url to the new host.
 *
 * Reads destination keys from NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Reads source keys from SUPABASE_CLOUD_URL + SUPABASE_CLOUD_SERVICE_ROLE_KEY,
 * or from the commented Cloud block already in .env.local.
 *
 * Usage: node scripts/migrate-storage-from-cloud.js
 */
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const BUCKETS = [
  { id: 'avatars', public: true },
  { id: 'resumes', public: false },
]

function readCommentedCloudConfig() {
  const envPath = path.join(process.cwd(), '.env.local')
  const raw = fs.readFileSync(envPath, 'utf8')
  const url = raw.match(/#\s*NEXT_PUBLIC_SUPABASE_URL="(https:\/\/[^"]+\.supabase\.co)"/)
  const key = raw.match(/#\s*SUPABASE_SERVICE_ROLE_KEY="(eyJ[^"]+)"/)
  return {
    url: url ? url[1] : null,
    key: key ? key[1] : null,
  }
}

function requireEnv(name, value) {
  if (!value) {
    console.error(`Falta ${name}`)
    process.exit(1)
  }
  return value
}

async function listRecursive(client, bucket, prefix = '') {
  const { data, error } = await client.storage.from(bucket).list(prefix, {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  })
  if (error) throw new Error(`[${bucket}] list ${prefix || '/'}: ${error.message}`)

  const files = []
  for (const item of data || []) {
    const objectPath = prefix ? `${prefix}/${item.name}` : item.name
    const isFolder = item.id === null
    if (isFolder) {
      files.push(...(await listRecursive(client, bucket, objectPath)))
    } else {
      files.push(objectPath)
    }
  }
  return files
}

function rewriteHost(url, fromHost, toHost) {
  if (!url || typeof url !== 'string') return url
  return url.split(fromHost).join(toHost)
}

async function rewriteTableUrls(dest, table, column, fromOrigin, toOrigin) {
  const { data, error } = await dest
    .from(table)
    .select(`id, ${column}`)
    .like(column, `%${fromOrigin}%`)

  if (error) {
    console.warn(`No se pudieron leer ${table}.${column}: ${error.message}`)
    return 0
  }

  let updated = 0
  for (const row of data || []) {
    const next = rewriteHost(row[column], fromOrigin, toOrigin)
    if (!next || next === row[column]) continue
    const { error: updateError } = await dest
      .from(table)
      .update({ [column]: next })
      .eq('id', row.id)
    if (updateError) {
      console.warn(`  No se actualizó ${table} ${row.id}: ${updateError.message}`)
    } else {
      updated += 1
    }
  }
  return updated
}

async function main() {
  const destUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
  const destKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)

  const commented = readCommentedCloudConfig()
  const sourceUrl = process.env.SUPABASE_CLOUD_URL || commented.url
  const sourceKey = process.env.SUPABASE_CLOUD_SERVICE_ROLE_KEY || commented.key
  requireEnv('SUPABASE_CLOUD_URL', sourceUrl)
  requireEnv('SUPABASE_CLOUD_SERVICE_ROLE_KEY', sourceKey)

  if (sourceUrl.replace(/\/$/, '') === destUrl.replace(/\/$/, '')) {
    console.error('Origen y destino son el mismo host. Revisa .env.local.')
    process.exit(1)
  }

  const source = createClient(sourceUrl, sourceKey)
  const dest = createClient(destUrl, destKey)

  console.log(`Origen:  ${sourceUrl}`)
  console.log(`Destino: ${destUrl}`)

  for (const bucket of BUCKETS) {
    const { error } = await dest.storage.createBucket(bucket.id, {
      public: bucket.public,
    })
    if (error && !/already exists|duplicate/i.test(error.message)) {
      throw new Error(`No se pudo crear bucket ${bucket.id}: ${error.message}`)
    }
    const { error: updateError } = await dest.storage.updateBucket(bucket.id, {
      public: bucket.public,
    })
    if (updateError) {
      console.warn(`No se pudo actualizar bucket ${bucket.id}: ${updateError.message}`)
    } else {
      console.log(`Bucket listo: ${bucket.id} (public=${bucket.public})`)
    }
  }

  let copied = 0
  let failed = 0
  for (const bucket of BUCKETS) {
    console.log(`\nCopiando ${bucket.id}...`)
    const files = await listRecursive(source, bucket.id)
    console.log(`  ${files.length} archivo(s) en Cloud`)

    for (const objectPath of files) {
      const { data, error: downloadError } = await source.storage
        .from(bucket.id)
        .download(objectPath)
      if (downloadError || !data) {
        console.warn(`  SKIP download ${objectPath}: ${downloadError?.message || 'sin data'}`)
        failed += 1
        continue
      }

      const buffer = Buffer.from(await data.arrayBuffer())
      const contentType = data.type || undefined
      const { error: uploadError } = await dest.storage.from(bucket.id).upload(objectPath, buffer, {
        upsert: true,
        contentType,
      })
      if (uploadError) {
        console.warn(`  SKIP upload ${objectPath}: ${uploadError.message}`)
        failed += 1
        continue
      }
      copied += 1
      console.log(`  OK ${objectPath}`)
    }
  }

  const fromOrigin = sourceUrl.replace(/\/$/, '')
  const toOrigin = destUrl.replace(/\/$/, '')
  const avatarsRewritten = await rewriteTableUrls(
    dest,
    'user_metadata',
    'avatar_url',
    fromOrigin,
    toOrigin
  )
  const resumesRewritten = await rewriteTableUrls(
    dest,
    'candidate_profiles',
    'resume_url',
    fromOrigin,
    toOrigin
  )

  console.log('\nListo.')
  console.log(`  Archivos copiados: ${copied}`)
  console.log(`  Archivos fallidos: ${failed}`)
  console.log(`  avatar_url reescritas: ${avatarsRewritten}`)
  console.log(`  resume_url reescritas: ${resumesRewritten}`)
  console.log('\nDespués de esto, ejecuta scripts/setup-storage-selfhosted.sql en el SQL Editor self-hosted para las políticas RLS.')
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
