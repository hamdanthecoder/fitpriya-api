const express = require('express')
const axios = require('axios')

const router = express.Router()

const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const SIGNED_URL_EXPIRES_IN = 7 * 24 * 60 * 60
const FRAME_RE = /^image(\d+)(?:\.(jpg|jpeg|png|webp))?$/i

let mediaCache = null

function requireSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
  const bucket = process.env.SUPABASE_EXERCISE_BUCKET || process.env.EXPO_PUBLIC_SUPABASE_EXERCISE_BUCKET || 'exercise-frames'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    const missing = []
    if (!url) missing.push('SUPABASE_URL')
    if (!key) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    const error = new Error(`Missing Supabase env: ${missing.join(', ')}`)
    error.statusCode = 500
    throw error
  }

  return { url, bucket, key }
}

function supabaseClient(config) {
  return axios.create({
    baseURL: `${config.url}/storage/v1`,
    timeout: 20000,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
    },
  })
}

async function listObjects(client, bucket, prefix = '') {
  const { data } = await client.post(`/object/list/${bucket}`, {
    prefix,
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  })
  return Array.isArray(data) ? data : []
}

async function walkBucket(client, bucket, prefix = '') {
  const entries = await listObjects(client, bucket, prefix)
  const files = []

  for (const entry of entries) {
    const name = entry?.name
    if (!name) continue

    const path = prefix ? `${prefix}/${name}` : name
    const isFolder = !entry.metadata || entry.id === null
    if (isFolder) {
      files.push(...await walkBucket(client, bucket, path))
    } else {
      files.push(path)
    }
  }

  return files
}

function isFramePath(path) {
  const fileName = path.split('/').pop()
  return FRAME_RE.test(fileName)
}

function frameSortValue(path) {
  const fileName = path.split('/').pop()
  const match = fileName.match(FRAME_RE)
  return match ? Number(match[1]) : 999
}

function folderKeyForPath(path) {
  const parts = path.split('/')
  parts.pop()
  return parts.join('/')
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function normalizedFolderKey(folder) {
  return folder.split('/').map(slugify).filter(Boolean).join('/')
}

function publicUrl(config, path) {
  return `${config.url}/storage/v1/object/public/${config.bucket}/${path.split('/').map(encodeURIComponent).join('/')}`
}

async function signedUrl(client, config, path) {
  const { data } = await client.post(`/object/sign/${config.bucket}/${path}`, {
    expiresIn: SIGNED_URL_EXPIRES_IN,
  })
  const signedPath = data?.signedURL || data?.signedUrl
  if (!signedPath) return publicUrl(config, path)
  return signedPath.startsWith('http') ? signedPath : `${config.url}/storage/v1${signedPath}`
}

async function buildMediaMap() {
  const config = requireSupabaseConfig()
  const client = supabaseClient(config)
  const isPrivate = process.env.SUPABASE_EXERCISE_BUCKET_PRIVATE === 'true'

  const files = (await walkBucket(client, config.bucket)).filter(isFramePath)
  const grouped = {}

  for (const path of files) {
    const folder = folderKeyForPath(path)
    if (!grouped[folder]) grouped[folder] = []
    grouped[folder].push(path)
  }

  const media = {}
  for (const [folder, paths] of Object.entries(grouped)) {
    const ordered = paths.sort((a, b) => frameSortValue(a) - frameSortValue(b))
    media[normalizedFolderKey(folder)] = isPrivate
      ? await Promise.all(ordered.map((path) => signedUrl(client, config, path)))
      : ordered.map((path) => publicUrl(config, path))
  }

  return {
    generatedAt: new Date().toISOString(),
    bucket: config.bucket,
    isPrivate,
    media,
  }
}

router.get('/media', async (req, res) => {
  try {
    const now = Date.now()
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true'
    if (!forceRefresh && mediaCache && now - mediaCache.cachedAt < CACHE_TTL_MS) {
      return res.json({ success: true, data: mediaCache.data, cached: true })
    }

    const data = await buildMediaMap()
    mediaCache = { cachedAt: now, data }
    return res.json({ success: true, data, cached: false })
  } catch (error) {
    console.error('[Exercises Media]', error.response?.data || error.message)
    return res.status(error.statusCode || 500).json({
      success: false,
      message: 'Failed to load exercise media',
      detail: error.response?.data?.message || error.message,
    })
  }
})

module.exports = router
