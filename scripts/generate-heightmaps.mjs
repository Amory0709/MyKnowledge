#!/usr/bin/env node
/**
 * 🏔️ Heightmap Generator for Knowledge Mountains
 *
 * Downloads real elevation data from AWS Terrain Tiles (Terrarium format)
 * and generates heightmap PNG files for each mountain zone.
 *
 * AWS Terrain Tiles encoding (Terrarium):
 *   elevation = (R * 256 + G + B / 256) - 32768
 *
 * Usage: node scripts/generate-heightmaps.mjs
 */

import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// ═══════════════════════════════════════════════
// Mountain configurations
// ═══════════════════════════════════════════════
const MOUNTAINS = {
  'fitz-roy': {
    name: 'Fitz Roy (Patagonia)',
    category: '编程',
    lat: -49.271,
    lng: -73.043,
    radiusKm: 12,
    zoom: 11,
  },
  'matterhorn': {
    name: 'Matterhorn (Alps)',
    category: '财务',
    lat: 45.9763,
    lng: 7.6586,
    radiusKm: 10,
    zoom: 11,
  },
  'everest': {
    name: 'Mount Everest (Himalayas)',
    category: '数学',
    lat: 27.9881,
    lng: 86.925,
    radiusKm: 15,
    zoom: 11,
  },
  'hotaka': {
    name: 'Hotaka (Japanese Alps)',
    category: '设计',
    lat: 36.289,
    lng: 137.648,
    radiusKm: 10,
    zoom: 11,
  },
  'preikestolen': {
    name: 'Lysefjorden (Norway)',
    category: '人文',
    lat: 59.02,
    lng: 6.15,
    radiusKm: 15,
    zoom: 11,
  },
  'olympus': {
    name: 'Mount Olympus (Greece)',
    category: '社交',
    lat: 40.0855,
    lng: 22.3583,
    radiusKm: 10,
    zoom: 11,
  },
  'fuji': {
    name: 'Mount Fuji (Japan)',
    category: '修身',
    lat: 35.3606,
    lng: 138.7274,
    radiusKm: 12,
    zoom: 11,
  },
}

const OUTPUT_SIZE = 512 // px (each heightmap will be 512x512)
const OUTPUT_DIR = path.resolve('public/terrain')

// ═══════════════════════════════════════════════
// Tile math helpers
// ═══════════════════════════════════════════════
function latLngToTile(lat, lng, zoom) {
  const n = Math.pow(2, zoom)
  const x = Math.floor(((lng + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  )
  return { x, y, z: zoom }
}

function tileBounds(x, y, z) {
  const n = Math.pow(2, z)
  const lonMin = (x / n) * 360 - 180
  const lonMax = ((x + 1) / n) * 360 - 180
  const latMaxRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)))
  const latMinRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n)))
  return {
    north: (latMaxRad * 180) / Math.PI,
    south: (latMinRad * 180) / Math.PI,
    west: lonMin,
    east: lonMax,
  }
}

// Convert km radius to approximate tile range
function getTileRange(lat, lng, radiusKm, zoom) {
  // Rough: 1 degree ≈ 111 km
  const degRadius = radiusKm / 111
  const center = latLngToTile(lat, lng, zoom)
  const topLeft = latLngToTile(lat + degRadius, lng - degRadius, zoom)
  const bottomRight = latLngToTile(lat - degRadius, lng + degRadius, zoom)

  return {
    xMin: topLeft.x,
    xMax: bottomRight.x,
    yMin: topLeft.y,
    yMax: bottomRight.y,
    centerX: center.x,
    centerY: center.y,
  }
}

// ═══════════════════════════════════════════════
// Fetch AWS Terrain Tile (Terrarium format)
// ═══════════════════════════════════════════════
async function fetchTile(z, x, y, retries = 3) {
  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) {
        if (res.status === 404) return null
        throw new Error(`HTTP ${res.status}`)
      }
      return Buffer.from(await res.arrayBuffer())
    } catch (e) {
      if (attempt === retries - 1) {
        console.warn(`  ⚠️ Failed to fetch tile ${z}/${x}/${y}: ${e.message}`)
        return null
      }
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
    }
  }
}

// Decode Terrarium tile to elevation array
async function decodeTerrariumTile(pngBuffer) {
  const { data, info } = await sharp(pngBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const elevations = new Float32Array(info.width * info.height)
  for (let i = 0; i < elevations.length; i++) {
    const r = data[i * info.channels]
    const g = data[i * info.channels + 1]
    const b = data[i * info.channels + 2]
    elevations[i] = r * 256 + g + b / 256 - 32768
  }
  return { elevations, width: info.width, height: info.height }
}

// ═══════════════════════════════════════════════
// Stitch tiles into one large elevation grid
// ═══════════════════════════════════════════════
async function fetchElevationGrid(mountain) {
  const { lat, lng, radiusKm, zoom } = mountain
  const range = getTileRange(lat, lng, radiusKm, zoom)
  const tilesX = range.xMax - range.xMin + 1
  const tilesY = range.yMax - range.yMin + 1
  const tileSize = 256

  console.log(
    `  📦 Fetching ${tilesX}x${tilesY} = ${tilesX * tilesY} tiles at zoom ${zoom}...`
  )

  const totalWidth = tilesX * tileSize
  const totalHeight = tilesY * tileSize
  const grid = new Float32Array(totalWidth * totalHeight)
  grid.fill(-9999) // no-data

  let fetched = 0
  const total = tilesX * tilesY

  for (let ty = range.yMin; ty <= range.yMax; ty++) {
    for (let tx = range.xMin; tx <= range.xMax; tx++) {
      const buf = await fetchTile(zoom, tx, ty)
      fetched++
      if (fetched % 5 === 0 || fetched === total) {
        process.stdout.write(`  ⬇️  ${fetched}/${total}\r`)
      }
      if (!buf) continue

      const tile = await decodeTerrariumTile(buf)
      const offX = (tx - range.xMin) * tileSize
      const offY = (ty - range.yMin) * tileSize

      for (let py = 0; py < tile.height; py++) {
        for (let px = 0; px < tile.width; px++) {
          const gx = offX + px
          const gy = offY + py
          if (gx < totalWidth && gy < totalHeight) {
            grid[gy * totalWidth + gx] = tile.elevations[py * tile.width + px]
          }
        }
      }
    }
  }
  console.log('')

  return { grid, width: totalWidth, height: totalHeight }
}

// ═══════════════════════════════════════════════
// Resize and normalize to heightmap PNG
// ═══════════════════════════════════════════════
async function generateHeightmap(mountain, id) {
  console.log(`\n🏔️  Processing: ${mountain.name} (${mountain.category})`)

  const { grid, width, height } = await fetchElevationGrid(mountain)

  // Find min/max elevation (ignore no-data)
  let minElev = Infinity,
    maxElev = -Infinity
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] > -9000) {
      minElev = Math.min(minElev, grid[i])
      maxElev = Math.max(maxElev, grid[i])
    }
  }
  console.log(`  📊 Elevation range: ${minElev.toFixed(0)}m – ${maxElev.toFixed(0)}m`)

  // Normalize to 0-255 grayscale
  const range = maxElev - minElev || 1
  const buf = Buffer.alloc(width * height)
  for (let i = 0; i < grid.length; i++) {
    const elev = grid[i] > -9000 ? grid[i] : minElev
    buf[i] = Math.round(((elev - minElev) / range) * 255)
  }

  // Create grayscale PNG and resize to OUTPUT_SIZE
  const outputPath = path.join(OUTPUT_DIR, `${id}.png`)
  await sharp(buf, { raw: { width, height, channels: 1 } })
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'cover' })
    .png()
    .toFile(outputPath)

  // Save metadata JSON
  const meta = {
    id,
    name: mountain.name,
    category: mountain.category,
    lat: mountain.lat,
    lng: mountain.lng,
    radiusKm: mountain.radiusKm,
    minElevation: Math.round(minElev),
    maxElevation: Math.round(maxElev),
    resolution: OUTPUT_SIZE,
  }
  await writeFile(
    path.join(OUTPUT_DIR, `${id}.json`),
    JSON.stringify(meta, null, 2)
  )

  console.log(`  ✅ Saved: ${outputPath} (${OUTPUT_SIZE}x${OUTPUT_SIZE})`)
  return meta
}

// ═══════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════
async function main() {
  console.log('🌍 Knowledge Mountains — Heightmap Generator\n')
  console.log('═'.repeat(50))

  await mkdir(OUTPUT_DIR, { recursive: true })

  const allMeta = []
  for (const [id, mountain] of Object.entries(MOUNTAINS)) {
    const meta = await generateHeightmap(mountain, id)
    allMeta.push(meta)
  }

  // Save index file
  await writeFile(
    path.join(OUTPUT_DIR, 'mountains.json'),
    JSON.stringify(allMeta, null, 2)
  )

  console.log('\n═'.repeat(50))
  console.log('🎉 All heightmaps generated!')
  console.log(`📁 Output: ${OUTPUT_DIR}/`)
  console.log(`📄 Index: ${OUTPUT_DIR}/mountains.json`)
}

main().catch(console.error)
