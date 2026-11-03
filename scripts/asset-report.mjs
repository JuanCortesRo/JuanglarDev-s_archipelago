#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PUBLIC = path.join(ROOT, 'public')

const KB = 1024
const MB = 1024 * 1024

const BUDGET_TOTAL_BYTES = 10 * MB
const BUDGET_TEXTURE_BYTES = 1 * MB
const MAX_TEXTURE_DIMENSION = 2048

const GROUP_ORDER = ['js', 'css', 'models', 'textures', 'other']

const EXTENSION_GROUPS = {
  js: new Set(['.js', '.mjs']),
  css: new Set(['.css']),
  models: new Set(['.glb', '.gltf', '.bin']),
  textures: new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.ktx2', '.basis']),
}

function formatBytes(bytes) {
  if (bytes >= MB) return `${(bytes / MB).toFixed(2)} MB`
  if (bytes >= KB) return `${(bytes / KB).toFixed(2)} kB`
  return `${bytes} B`
}

function isPowerOfTwo(value) {
  return value > 0 && (value & (value - 1)) === 0
}

function classifyFile(relativePath) {
  const ext = path.extname(relativePath).toLowerCase()
  for (const [group, extensions] of Object.entries(EXTENSION_GROUPS)) {
    if (extensions.has(ext)) return group
  }
  return 'other'
}

// Three.js's DRACOLoader references its decoder files with `new URL(..., import.meta.url)`,
// so Vite emits copies of them under dist/assets/. We override the decoder path with
// setDecoderPath('/draco/'), so those emitted copies are never requested at runtime. The
// decoder that actually loads lives in dist/draco/ (copied from public/draco/).
function isNotLoadedAtRuntime(relativePath) {
  const parts = relativePath.split(path.sep).join('/').split('/')
  if (parts[0] !== 'assets') return false
  return path.basename(relativePath).toLowerCase().startsWith('draco_')
}

async function walk(dir) {
  const results = []
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return results
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...(await walk(fullPath)))
    } else if (entry.isFile()) {
      results.push(fullPath)
    }
  }
  return results
}

async function reportDist() {
  const files = await walk(DIST)
  const grouped = { js: [], css: [], models: [], textures: [], other: [] }
  const notLoaded = []

  let totalBytes = 0
  let runtimeBytes = 0
  let notLoadedBytes = 0

  for (const file of files) {
    const relative = path.relative(DIST, file)
    const stat = await fs.stat(file)
    const group = classifyFile(relative)
    const isDuplicate = isNotLoadedAtRuntime(relative)

    const entry = { relative, size: stat.size, group, isDuplicate }
    grouped[group].push(entry)

    totalBytes += stat.size
    if (isDuplicate) {
      notLoadedBytes += stat.size
      notLoaded.push(entry)
    } else {
      runtimeBytes += stat.size
    }
  }

  console.log('Asset report — dist/')
  console.log()

  for (const group of GROUP_ORDER) {
    console.log(group)
    if (grouped[group].length === 0) {
      console.log('  (none)')
    } else {
      const sorted = [...grouped[group]].sort((a, b) => b.size - a.size)
      for (const entry of sorted) {
        const tag = entry.isDuplicate ? '  (not loaded at runtime)' : ''
        console.log(`  ${entry.relative.padEnd(40)} ${formatBytes(entry.size).padStart(10)}${tag}`)
      }
    }
    console.log()
  }

  console.log(`Total (all files):           ${formatBytes(totalBytes).padStart(10)}`)
  console.log(`Loaded at runtime (budget):  ${formatBytes(runtimeBytes).padStart(10)}`)
  console.log(`Not loaded at runtime:       ${formatBytes(notLoadedBytes).padStart(10)}`)
  if (notLoaded.length > 0) {
    console.log('  (Three.js DRACOLoader `new URL` artifacts — never requested, see below)')
  }
  console.log(`Budget:                      ${formatBytes(BUDGET_TOTAL_BYTES).padStart(10)}`)
  console.log()

  let budgetOk = true
  if (runtimeBytes > BUDGET_TOTAL_BYTES) {
    budgetOk = false
    console.warn(
      `⚠  WARNING: loaded-at-runtime total (${formatBytes(runtimeBytes)}) exceeds the ${formatBytes(BUDGET_TOTAL_BYTES)} budget.`
    )
  } else {
    console.log(
      `✓  Total within budget (${formatBytes(runtimeBytes)} ≤ ${formatBytes(BUDGET_TOTAL_BYTES)})`
    )
  }

  const oversizedTextures = grouped.textures.filter(
    (entry) => !entry.isDuplicate && entry.size > BUDGET_TEXTURE_BYTES
  )
  if (oversizedTextures.length > 0) {
    budgetOk = false
    for (const entry of oversizedTextures) {
      console.warn(
        `⚠  WARNING: texture "${entry.relative}" (${formatBytes(entry.size)}) exceeds the 1 MB limit.`
      )
    }
  } else {
    console.log('✓  No texture exceeds 1 MB')
  }

  if (notLoaded.length > 0) {
    console.log()
    console.log(
      'Files excluded from the budget (emitted by Three.js DRACOLoader, not loaded at runtime):'
    )
    for (const entry of notLoaded.sort((a, b) => b.size - a.size)) {
      console.log(`  - ${entry.relative} (${formatBytes(entry.size)})`)
    }
  }

  return budgetOk
}

// --- image dimension parsing (no dependencies) ---

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function parsePng(buffer) {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

function parseJpeg(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null

  let offset = 2
  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++
      continue
    }

    const marker = buffer[offset + 1]
    if (marker === 0xff) {
      offset++
      continue
    }

    // Standalone markers without a length field.
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2
      continue
    }

    // SOF markers (C0–CF except C4, C8, CC) carry width/height.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) }
    }

    const length = buffer.readUInt16BE(offset + 2)
    offset += 2 + length
  }

  return null
}

function parseWebp(buffer) {
  if (buffer.length < 30) return null
  if (buffer.toString('ascii', 0, 4) !== 'RIFF') return null
  if (buffer.toString('ascii', 8, 12) !== 'WEBP') return null

  const chunk = buffer.toString('ascii', 12, 16)

  if (chunk === 'VP8X') {
    const width = 1 + buffer.readUIntLE(24, 3)
    const height = 1 + buffer.readUIntLE(27, 3)
    return { width, height }
  }

  if (chunk === 'VP8L' || (chunk === 'VP8 ' && buffer[20] === 0x2f)) {
    if (buffer[20] !== 0x2f) return null
    const b0 = buffer[21]
    const b1 = buffer[22]
    const b2 = buffer[23]
    const b3 = buffer[24]
    const width = 1 + (((b1 & 0x3f) << 8) | b0)
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6))
    return { width, height }
  }

  if (chunk === 'VP8 ') {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    }
  }

  return null
}

const IMAGE_PARSERS = {
  '.png': parsePng,
  '.jpg': parseJpeg,
  '.jpeg': parseJpeg,
  '.webp': parseWebp,
}

async function reportImages() {
  console.log()
  console.log('Image dimensions — public/')
  console.log()

  const files = await walk(PUBLIC)
  const images = files.filter((file) => path.extname(file).toLowerCase() in IMAGE_PARSERS)

  if (images.length === 0) {
    console.log('  (no PNG/JPG/WebP images found)')
    console.log()
    return true
  }

  let ok = true

  for (const file of images) {
    const relative = path.relative(PUBLIC, file)
    const buffer = await fs.readFile(file)
    const parser = IMAGE_PARSERS[path.extname(file).toLowerCase()]
    const dimensions = parser(buffer)

    if (!dimensions) {
      console.warn(`⚠  WARNING: could not parse dimensions of "${relative}".`)
      ok = false
      continue
    }

    const { width, height } = dimensions
    const problems = []

    if (!isPowerOfTwo(width) || !isPowerOfTwo(height)) {
      problems.push(`not power-of-two (${width}×${height})`)
    }
    if (width > MAX_TEXTURE_DIMENSION || height > MAX_TEXTURE_DIMENSION) {
      problems.push(`exceeds ${MAX_TEXTURE_DIMENSION}px (${width}×${height})`)
    }

    if (problems.length > 0) {
      ok = false
      console.warn(`⚠  WARNING: ${relative} (${width}×${height}): ${problems.join(', ')}`)
    } else {
      console.log(`✓  ${relative} (${width}×${height})`)
    }
  }

  console.log()
  return ok
}

async function main() {
  let distExists = true
  try {
    await fs.access(DIST)
  } catch {
    distExists = false
  }

  if (!distExists) {
    console.error(
      'dist/ does not exist. Run "npm run build" first, then re-run "npm run report:assets".'
    )
    process.exitCode = 1
    return
  }

  const distOk = await reportDist()
  const imagesOk = await reportImages()

  if (distOk && imagesOk) {
    console.log('All asset checks passed.')
  } else {
    console.log('One or more asset checks produced warnings — review the output above.')
  }
}

main()
