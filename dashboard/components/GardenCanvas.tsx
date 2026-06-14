'use client'

import { useRef } from 'react'
import Sketch from 'react-p5'
import type P5 from 'p5'
import type { KnowledgeEntry } from '@/types'

// ─── Prop types ────────────────────────────────────────────────────────────

export interface GardenCanvasProps {
  entries: KnowledgeEntry[]
  onEntryClick: (id: string) => void
  searchFilter: string
  lang: 'zh' | 'en'
}

// ─── Internal types ────────────────────────────────────────────────────────

interface BgFlower {
  x: number
  y: number
  colorIdx: number
  size: number
  noiseOff: number
  type: number  // 0 = circle bloom, 1 = petals, 2 = star cluster
}

interface CloudCircle {
  dx: number
  dy: number
  r: number
}

interface Cloud {
  x: number
  y: number
  speed: number
  alpha: number
  circles: CloudCircle[]
}

interface KnowledgePlant {
  x: number
  baseY: number
  entry: KnowledgeEntry
  color: [number, number, number]
  glowColor: [number, number, number]
  noiseOff: number
}

interface PineTree {
  x: number
  hillBase: number
  height: number
  width: number
}

interface GardenState {
  bgFlowers: BgFlower[]
  clouds: Cloud[]
  plants: KnowledgePlant[]
  pines1: PineTree[]
  pines2: PineTree[]
  hoveredIdx: number
  frame: number
  W: number
  H: number
}

// ─── Visual constants ──────────────────────────────────────────────────────

const FLOWER_COLORS = [
  '#6B9FD4', // blue iris
  '#9B7FD4', // purple lavender
  '#F0F0F0', // white
  '#F0D060', // yellow
  '#7CBFDA', // sky blue
  '#C4A0E8', // soft violet
  '#A0D080', // pale green
  '#FFB7C5', // cherry pink
]

// ─── Helpers ───────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function categoryColor(cat: string): { color: string; glow: string } {
  switch (cat) {
    case '计算机科学': return { color: '#00E5FF', glow: '#00B8D4' }
    case '算法':       return { color: '#CE93D8', glow: '#AB47BC' }
    case '数学':       return { color: '#FFD54F', glow: '#FFA000' }
    default:           return { color: '#F48FB1', glow: '#E91E8C' }
  }
}

function hashId(id: string): number {
  let h = 5381
  for (let i = 0; i < id.length; i++) {
    h = (((h << 5) + h) + id.charCodeAt(i)) & 0x7fffffff
  }
  return h
}

// Deterministic random from seed + salt
function seededRng(seed: number, salt: number): number {
  const x = Math.sin(seed * 127.1 + salt * 311.7) * 43758.5453123
  return x - Math.floor(x)
}

// ─── Hill profile functions ────────────────────────────────────────────────

function hill1Y(t: number, H: number): number {
  return H * 0.535
    - Math.sin(t * Math.PI * 2.5) * H * 0.032
    + Math.sin(t * Math.PI * 1.3 + 0.4) * H * 0.024
    + Math.cos(t * Math.PI * 3.7 + 1.1) * H * 0.014
}

function hill2Y(t: number, H: number): number {
  return H * 0.630
    - Math.sin(t * Math.PI * 2.0 + 0.3) * H * 0.027
    + Math.sin(t * Math.PI * 1.5 + 0.8) * H * 0.020
    + Math.cos(t * Math.PI * 2.8 + 0.5) * H * 0.012
}

function hill3Y(t: number, H: number): number {
  return H * 0.700
    - Math.sin(t * Math.PI * 1.8 + 0.5) * H * 0.022
    + Math.sin(t * Math.PI * 2.5 + 1.2) * H * 0.014
    + Math.cos(t * Math.PI * 1.2 + 0.8) * H * 0.010
}

// ─── Drawing helpers ───────────────────────────────────────────────────────

function drawPine(p5: P5, x: number, baseY: number, h: number, w: number, col: [number, number, number]) {
  p5.noStroke()
  p5.fill(col[0], col[1], col[2])
  // Three tiers: bottom widest, top narrowest
  p5.triangle(x, baseY - h, x - w, baseY, x + w, baseY)
  p5.fill(col[0] - 8, col[1] - 10, col[2] - 5)
  p5.triangle(x, baseY - h * 0.80, x - w * 0.75, baseY - h * 0.28, x + w * 0.75, baseY - h * 0.28)
  p5.fill(col[0] + 6, col[1] + 8, col[2] + 4)
  p5.triangle(x, baseY - h * 0.58, x - w * 0.50, baseY - h * 0.48, x + w * 0.50, baseY - h * 0.48)
  // Trunk
  p5.fill(col[0] * 0.45, col[1] * 0.35, col[2] * 0.25)
  p5.rect(x - w * 0.09, baseY, w * 0.18, h * 0.13)
}

function drawHillShape(p5: P5, hillFn: (t: number, H: number) => number, W: number, H: number) {
  const numPts = 60
  p5.beginShape()
  p5.vertex(0, H + 2)
  const startY = hillFn(0, H)
  p5.vertex(0, startY)
  for (let i = 1; i <= numPts; i++) {
    const t = i / numPts
    p5.vertex(t * W, hillFn(t, H))
  }
  p5.vertex(W, H + 2)
  p5.endShape(p5.CLOSE)
}

// ─── State factory ─────────────────────────────────────────────────────────

function createState(p5: P5, W: number, H: number, entries: KnowledgeEntry[]): GardenState {
  const meadowY = H * 0.65

  // 350 background wildflowers in the meadow
  const bgFlowers: BgFlower[] = []
  for (let i = 0; i < 350; i++) {
    bgFlowers.push({
      x: p5.random(0, W),
      y: p5.random(meadowY + 12, H - 8),
      colorIdx: Math.floor(p5.random(0, FLOWER_COLORS.length)),
      size: p5.random(2.5, 6.5),
      noiseOff: p5.random(0, 1000),
      type: Math.floor(p5.random(0, 3)),
    })
  }

  // 4 large, puffy clouds
  const makeCloud = (cx: number, cy: number, speed: number, alpha: number, scale: number): Cloud => ({
    x: cx, y: cy, speed, alpha,
    circles: [
      { dx: 0,          dy: 0,           r: 48 * scale },
      { dx: 40 * scale, dy: -18 * scale, r: 40 * scale },
      { dx: 74 * scale, dy: 4 * scale,   r: 44 * scale },
      { dx: 104 * scale,dy: -10 * scale, r: 34 * scale },
      { dx: 22 * scale, dy: 15 * scale,  r: 30 * scale },
      { dx: 58 * scale, dy: 18 * scale,  r: 26 * scale },
    ],
  })
  const clouds: Cloud[] = [
    makeCloud(W * 0.10, H * 0.09, 0.060, 240, 1.00),
    makeCloud(W * 0.42, H * 0.07, 0.045, 218, 0.85),
    makeCloud(W * 0.70, H * 0.09, 0.055, 228, 0.92),
    makeCloud(W * 0.88, H * 0.13, 0.035, 198, 0.70),
  ]

  // Knowledge plants — one per entry, spread across the meadow
  const plants: KnowledgePlant[] = entries.map((entry, i) => {
    const h = hashId(entry.id)
    const t = (i + 0.5) / Math.max(entries.length, 1)
    const x = W * 0.08 + W * 0.84 * t + (seededRng(h, 1) - 0.5) * W * 0.07
    const baseY = H * 0.68 + seededRng(h, 2) * H * 0.09
    const { color, glow } = categoryColor(entry.category)
    return {
      x,
      baseY,
      entry,
      color: hexToRgb(color),
      glowColor: hexToRgb(glow),
      noiseOff: seededRng(h, 3) * 1000,
    }
  })

  // Pine trees on hill 1
  const pines1: PineTree[] = []
  for (let i = 0; i < 28; i++) {
    const x = p5.random(10, W - 10)
    pines1.push({
      x,
      hillBase: hill1Y(x / W, H) + p5.random(-4, 6),
      height: p5.random(22, 46),
      width: p5.random(12, 24),
    })
  }

  // Pine trees on hill 2
  const pines2: PineTree[] = []
  for (let i = 0; i < 22; i++) {
    const x = p5.random(10, W - 10)
    pines2.push({
      x,
      hillBase: hill2Y(x / W, H) + p5.random(-3, 5),
      height: p5.random(18, 36),
      width: p5.random(10, 21),
    })
  }

  return { bgFlowers, clouds, plants, pines1, pines2, hoveredIdx: -1, frame: 0, W, H }
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function GardenCanvas({ entries, onEntryClick, searchFilter, lang }: GardenCanvasProps) {
  const stateRef = useRef<GardenState | null>(null)
  // Keep props current without requiring stable callbacks
  const propsRef = useRef({ entries, onEntryClick, searchFilter, lang })
  propsRef.current = { entries, onEntryClick, searchFilter, lang }

  // ── setup ──────────────────────────────────────────────────────────────
  const setup = (p5: P5, parentRef: Element) => {
    const W = typeof window !== 'undefined' ? window.innerWidth : 1280
    const H = typeof window !== 'undefined' ? window.innerHeight : 800
    p5.createCanvas(W, H).parent(parentRef)
    p5.frameRate(60)
    stateRef.current = createState(p5, W, H, propsRef.current.entries)
  }

  // ── draw ───────────────────────────────────────────────────────────────
  const draw = (p5: P5) => {
    const state = stateRef.current
    if (!state) return
    const { W, H, bgFlowers, clouds, plants, pines1, pines2 } = state
    const { searchFilter: sf, lang: currentLang } = propsRef.current
    const T = state.frame * 0.008

    const ctx = p5.drawingContext as CanvasRenderingContext2D

    // ── SKY gradient ──────────────────────────────────────────────────────
    const skyH = H * 0.60
    const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH)
    skyGrad.addColorStop(0.00, '#5EB5DC')  // deep sky blue at zenith
    skyGrad.addColorStop(0.35, '#87CEEB')  // classic sky blue
    skyGrad.addColorStop(0.72, '#C8E8F5')  // pale near horizon
    skyGrad.addColorStop(1.00, '#E8F4F8')  // near-white horizon haze
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, W, skyH)

    // Atmospheric light bloom at horizon
    const horizonGrad = ctx.createLinearGradient(0, skyH * 0.7, 0, skyH)
    horizonGrad.addColorStop(0, 'rgba(255,248,220,0)')
    horizonGrad.addColorStop(1, 'rgba(255,248,220,0.35)')
    ctx.fillStyle = horizonGrad
    ctx.fillRect(0, skyH * 0.7, W, skyH * 0.3)

    // ── CLOUDS ────────────────────────────────────────────────────────────
    p5.noStroke()
    for (const cloud of clouds) {
      cloud.x -= cloud.speed
      if (cloud.x < -220) cloud.x = W + 140

      for (const c of cloud.circles) {
        // Soft drop shadow
        p5.fill(180, 200, 220, Math.round(cloud.alpha * 0.25))
        p5.ellipse(cloud.x + c.dx + 7, cloud.y + c.dy + 7, c.r * 2.1, c.r * 1.6)
        // Main cloud body
        p5.fill(255, 255, 255, cloud.alpha)
        p5.ellipse(cloud.x + c.dx, cloud.y + c.dy, c.r * 2, c.r * 1.6)
        // Top highlight
        p5.fill(255, 255, 255, Math.round(cloud.alpha * 0.55))
        p5.ellipse(cloud.x + c.dx - 4, cloud.y + c.dy - 6, c.r * 1.3, c.r * 0.9)
      }
    }

    // ── MOUNTAIN ──────────────────────────────────────────────────────────
    const mx = W * 0.5
    const peakY = H * 0.12
    const mBaseY = H * 0.555
    const mLeft = mx - W * 0.275
    const mRight = mx + W * 0.275

    // Atmospheric glow (white haze around peak)
    for (let g = 14; g > 0; g--) {
      const exp = g * 4
      p5.fill(200, 215, 235, Math.round((1 - g / 14) * 20))
      p5.triangle(mx, peakY - exp, mLeft - exp * 0.6, mBaseY + exp * 0.15, mRight + exp * 0.6, mBaseY + exp * 0.15)
    }

    // Right face (lighter, sunlit)
    p5.fill(118, 116, 98)
    p5.triangle(mx, peakY, mx + (mRight - mx) * 0.25, mBaseY, mRight, mBaseY)

    // Main rocky body
    p5.fill(107, 107, 90)  // #6B6B5A
    p5.triangle(mx, peakY, mLeft, mBaseY, mRight, mBaseY)

    // Left shadow face
    p5.fill(72, 70, 58, 195)
    const shadowBase = mx + (mLeft - mx) * 0.55
    p5.triangle(mx, peakY, mLeft, mBaseY, shadowBase, mBaseY)

    // Subtle rock texture highlights
    p5.fill(130, 128, 108, 80)
    p5.triangle(mx - 5, peakY + 55, mLeft + 45, mBaseY, mx + 18, mBaseY)
    p5.fill(90, 88, 74, 60)
    p5.triangle(mx + 10, peakY + 80, mx + 45, mBaseY, mRight - 30, mBaseY)

    // Snow cap — blue shadow on left
    const snowFrac = 0.36
    const snowBaseY = peakY + (mBaseY - peakY) * snowFrac
    const snowLeft = mLeft + (mRight - mLeft) * (1 - snowFrac) * 0.84
    const snowRight = mRight - (mRight - mLeft) * (1 - snowFrac) * 0.82

    p5.fill(200, 220, 242, 190)  // blue-grey shadow #C8DCF0
    p5.quad(
      mx, peakY,
      snowLeft, snowBaseY,
      snowLeft + 18, snowBaseY + 5,
      mx - 14, peakY + 6
    )

    // Main pure-white snow
    p5.fill(255, 255, 255)
    p5.triangle(mx, peakY, snowLeft + 10, snowBaseY, snowRight, snowBaseY)

    // Snow glow (luminosity halo)
    for (let g = 9; g > 0; g--) {
      p5.fill(255, 255, 255, g * 5)
      p5.triangle(mx, peakY - g, snowLeft + 10 - g * 0.4, snowBaseY + g * 0.2, snowRight + g * 0.4, snowBaseY + g * 0.2)
    }

    // Snow surface texture / crevasse lines
    p5.stroke(190, 215, 240, 130)
    p5.strokeWeight(0.7)
    p5.line(mx - 12, peakY + 22, mx - 42, snowBaseY - 18)
    p5.line(mx + 6, peakY + 34, mx + 38, snowBaseY - 22)
    p5.noStroke()

    // ── BACK HILLS (layer 1) ──────────────────────────────────────────────
    p5.fill(45, 90, 39)  // #2D5A27
    drawHillShape(p5, hill1Y, W, H)

    // Pine forest silhouettes on hill 1
    for (const pine of pines1) {
      drawPine(p5, pine.x, pine.hillBase, pine.height, pine.width, [30, 68, 28])
    }

    // ── MID HILLS (layer 2) ───────────────────────────────────────────────
    p5.fill(58, 108, 48)
    drawHillShape(p5, hill2Y, W, H)

    // Pine forest on hill 2
    for (const pine of pines2) {
      drawPine(p5, pine.x, pine.hillBase, pine.height, pine.width, [42, 86, 36])
    }

    // ── FRONT HILLS (layer 3) ─────────────────────────────────────────────
    p5.fill(90, 143, 60)  // #5A8F3C
    drawHillShape(p5, hill3Y, W, H)

    // ── MEADOW ────────────────────────────────────────────────────────────
    const meadowY = H * 0.65
    const meadowGrad = ctx.createLinearGradient(0, meadowY, 0, H)
    meadowGrad.addColorStop(0.00, '#6BAF3C')
    meadowGrad.addColorStop(0.35, '#74B842')
    meadowGrad.addColorStop(0.70, '#6AAE3A')
    meadowGrad.addColorStop(1.00, '#5A9830')
    ctx.fillStyle = meadowGrad
    ctx.fillRect(0, meadowY, W, H - meadowY + 2)

    // Subtle meadow depth shading (darker at horizon, lighter in foreground)
    const depthGrad = ctx.createLinearGradient(0, meadowY, 0, H)
    depthGrad.addColorStop(0, 'rgba(0,30,0,0.18)')
    depthGrad.addColorStop(0.5, 'rgba(0,30,0,0.06)')
    depthGrad.addColorStop(1, 'rgba(255,255,240,0.04)')
    ctx.fillStyle = depthGrad
    ctx.fillRect(0, meadowY, W, H - meadowY + 2)

    // ── BACKGROUND WILDFLOWERS ────────────────────────────────────────────
    for (const flower of bgFlowers) {
      const sway = (p5.noise(flower.noiseOff + T * 0.55) - 0.5) * 9
      const bob  = (p5.noise(flower.noiseOff + 200 + T * 0.45) - 0.5) * 3
      const fx = flower.x + sway
      const fy = flower.y + bob

      // Perspective scale: flowers near bottom are slightly larger
      const depthScale = 0.75 + 0.25 * ((flower.y - meadowY) / (H - meadowY))
      const sz = flower.size * depthScale

      const [r, g, b] = hexToRgb(FLOWER_COLORS[flower.colorIdx])

      // Stem
      p5.stroke(65, 128, 42, 175)
      p5.strokeWeight(0.7)
      p5.line(fx, fy, fx - sway * 0.35, fy + sz * 2.2)
      p5.noStroke()

      p5.fill(r, g, b, 215)

      if (flower.type === 0) {
        // Simple round bloom
        p5.ellipse(fx, fy, sz * 2, sz * 2)

      } else if (flower.type === 1) {
        // 5-petal flower
        for (let a = 0; a < Math.PI * 2; a += Math.PI * 2 / 5) {
          p5.ellipse(
            fx + Math.cos(a + T * 0.03) * sz * 0.68,
            fy + Math.sin(a + T * 0.03) * sz * 0.68,
            sz * 1.15, sz * 1.15
          )
        }
        p5.fill(255, 228, 70, 215)
        p5.ellipse(fx, fy, sz * 0.78, sz * 0.78)

      } else {
        // Star / 6-petal cluster
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
          p5.fill(r, g, b, 200)
          p5.ellipse(
            fx + Math.cos(a) * sz * 0.72,
            fy + Math.sin(a) * sz * 0.72,
            sz, sz
          )
        }
        p5.fill(255, 255, 255, 185)
        p5.ellipse(fx, fy, sz * 0.52, sz * 0.52)
      }
    }
    p5.noStroke()

    // ── KNOWLEDGE PLANTS ──────────────────────────────────────────────────

    // Hover detection
    state.hoveredIdx = -1
    for (let i = 0; i < plants.length; i++) {
      const plant = plants[i]
      const sway = (p5.noise(plant.noiseOff + T * 0.8) - 0.5) * 11
      const px = plant.x + sway
      const py = plant.baseY - 32
      if (p5.dist(p5.mouseX, p5.mouseY, px, py) < 38) {
        state.hoveredIdx = i
        break
      }
    }
    p5.cursor(state.hoveredIdx >= 0 ? 'pointer' : 'default')

    for (let i = 0; i < plants.length; i++) {
      const plant = plants[i]
      const { entry, color, glowColor } = plant
      const isHovered = state.hoveredIdx === i

      // Search filter matching
      const isMatch = !sf
        || entry.title.includes(sf)
        || (entry.titleEn ?? '').toLowerCase().includes(sf.toLowerCase())
        || entry.tags.some(tag => tag.includes(sf))
      const wilt = !!(sf && !isMatch)
      const alpha = wilt ? 50 : 255

      const sway = (p5.noise(plant.noiseOff + T * 0.8) - 0.5) * 11
      const bob  = Math.sin(T * 2.2 + i * 0.85) * 2.5
      const px = plant.x + sway
      const stemH = wilt ? 18 : (isHovered ? 54 : 40)
      const py = plant.baseY + bob - stemH

      // Stem
      p5.stroke(50, 108, 35, alpha)
      p5.strokeWeight(wilt ? 1 : 2.8)

      if (wilt) {
        // Drooping wilted stem
        p5.line(px, py + 10, px + 10, plant.baseY)
      } else {
        p5.line(px, py, px - sway * 0.3, plant.baseY)
      }
      p5.noStroke()

      if (wilt) {
        // Tiny wilted bud
        p5.fill(color[0], color[1], color[2], alpha)
        p5.ellipse(px + 10, py + 10, 8, 8)
        continue
      }

      const flowerR = isHovered ? 22 : 15

      // Glow aura
      const glowLayers = isHovered ? 8 : 4
      for (let g = glowLayers; g > 0; g--) {
        const glowAlpha = (g / glowLayers) * (isHovered ? 75 : 38)
        const glowR = flowerR + g * (isHovered ? 9 : 5)
        p5.fill(glowColor[0], glowColor[1], glowColor[2], Math.round(glowAlpha))
        p5.ellipse(px, py, glowR * 2, glowR * 2)
      }

      // 6 petals rotating very slowly
      const rotOff = T * 0.025 + i * 0.55
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
        const petalA = a + rotOff
        p5.fill(color[0], color[1], color[2], alpha)
        p5.ellipse(
          px + Math.cos(petalA) * flowerR * 0.88,
          py + Math.sin(petalA) * flowerR * 0.88,
          flowerR, flowerR
        )
      }

      // Inner ring of smaller petals (alternating)
      for (let a = Math.PI / 6; a < Math.PI * 2; a += Math.PI / 3) {
        const petalA = a + rotOff
        p5.fill(
          Math.min(255, color[0] + 40),
          Math.min(255, color[1] + 30),
          Math.min(255, color[2] + 60),
          Math.round(alpha * 0.7)
        )
        p5.ellipse(
          px + Math.cos(petalA) * flowerR * 0.52,
          py + Math.sin(petalA) * flowerR * 0.52,
          flowerR * 0.55, flowerR * 0.55
        )
      }

      // Golden center
      p5.fill(255, 238, 80, alpha)
      p5.ellipse(px, py, flowerR * 0.68, flowerR * 0.68)
      // Center highlight dot
      p5.fill(255, 255, 200, Math.round(alpha * 0.8))
      p5.ellipse(px - 2, py - 2, flowerR * 0.28, flowerR * 0.28)

      // ── Hover label ────────────────────────────────────────────────────
      if (isHovered) {
        const title = currentLang === 'zh' ? entry.title : (entry.titleEn ?? entry.title)
        const cat   = currentLang === 'zh' ? entry.category : (entry.categoryEn ?? entry.category)
        const emoji = entry.emoji ?? '🌸'

        p5.textFont('system-ui, -apple-system, sans-serif')
        p5.textSize(13)
        const titleW = p5.textWidth(title)
        const labelW = titleW + 46  // emoji + padding
        const labelH = 34

        let labelX = px - labelW / 2
        // Clamp to canvas bounds
        labelX = Math.max(8, Math.min(W - labelW - 8, labelX))
        const labelY = py - flowerR - labelH - 16

        // Glass background
        p5.fill(10, 10, 20, 180)
        p5.rect(labelX, labelY, labelW, labelH, 12)

        // Color accent bar on left
        p5.fill(color[0], color[1], color[2], 220)
        p5.rect(labelX, labelY, 4, labelH, 12, 0, 0, 12)

        // Emoji
        p5.textSize(14)
        p5.textAlign(p5.LEFT, p5.CENTER)
        p5.fill(255, 255, 255, 230)
        p5.text(emoji, labelX + 10, labelY + labelH / 2)

        // Title
        p5.textSize(13)
        p5.fill(255, 255, 255, 240)
        p5.text(title, labelX + 28, labelY + labelH / 2)

        // Category tag below
        p5.textSize(10)
        p5.textAlign(p5.CENTER, p5.TOP)
        p5.fill(color[0], color[1], color[2], 210)
        p5.text(`· ${cat} ·`, px, labelY + labelH + 4)

        p5.textAlign(p5.LEFT, p5.BASELINE)
      }
    }

    state.frame++
  }

  // ── mouseClicked ───────────────────────────────────────────────────────
  const mouseClicked = (_p5: P5) => {
    const state = stateRef.current
    if (!state || state.hoveredIdx < 0) return
    const entry = state.plants[state.hoveredIdx].entry
    propsRef.current.onEntryClick(entry.id)
  }

  // ── windowResized ──────────────────────────────────────────────────────
  const windowResized = (p5: P5) => {
    const W = window.innerWidth
    const H = window.innerHeight
    p5.resizeCanvas(W, H)
    stateRef.current = createState(p5, W, H, propsRef.current.entries)
  }

  return (
    <Sketch
      setup={setup}
      draw={draw}
      mouseClicked={mouseClicked}
      windowResized={windowResized}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
