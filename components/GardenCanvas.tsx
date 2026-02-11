'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { KnowledgeEntry } from '@/types'

interface Plant {
  entry: KnowledgeEntry
  x: number
  y: number
  baseY: number
  size: number
  color: [number, number, number]
  glowColor: [number, number, number]
  swayOffset: number
  swaySpeed: number
  hovered: boolean
  stemHeight: number
}

interface Cloud {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
}

interface Wildflower {
  x: number
  y: number
  size: number
  type: number // 0=iris, 1=cotton, 2=purple, 3=yellow
  swayOffset: number
}

interface GardenCanvasProps {
  entries: KnowledgeEntry[]
  onEntryClick: (id: string) => void
  searchFilter: string
  lang: 'zh' | 'en'
}

const CATEGORY_COLORS: Record<string, [number, number, number]> = {
  '计算机科学': [0, 180, 255],
  '算法': [160, 100, 230],
  '数学': [255, 200, 50],
  '设计': [255, 150, 180],
}
const DEFAULT_COLOR: [number, number, number] = [100, 220, 150]

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

export function GardenCanvas({ entries, onEntryClick, searchFilter, lang }: GardenCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const plantsRef = useRef<Plant[]>([])
  const cloudsRef = useRef<Cloud[]>([])
  const wildflowersRef = useRef<Wildflower[]>([])
  const frameRef = useRef(0)
  const rafRef = useRef<number>(0)
  const mouseRef = useRef({ x: 0, y: 0 })
  const hoveredIdRef = useRef<string | null>(null)

  const initScene = useCallback((w: number, h: number) => {
    const meadowY = h * 0.62

    // Clouds
    cloudsRef.current = Array.from({ length: 5 }, (_, i) => ({
      x: (w / 5) * i + seededRandom(i * 7) * (w / 5),
      y: h * 0.08 + seededRandom(i * 13) * h * 0.12,
      size: 60 + seededRandom(i * 3) * 80,
      speed: 0.15 + seededRandom(i * 11) * 0.2,
      opacity: 0.7 + seededRandom(i * 5) * 0.3,
    }))

    // Wildflowers
    const flowers: Wildflower[] = []
    for (let i = 0; i < 280; i++) {
      const t = i / 280
      flowers.push({
        x: seededRandom(i * 17) * w,
        y: meadowY + seededRandom(i * 23) * h * 0.35,
        size: 3 + seededRandom(i * 7) * 5,
        type: Math.floor(seededRandom(i * 11) * 4),
        swayOffset: seededRandom(i * 3) * Math.PI * 2,
      })
    }
    wildflowersRef.current = flowers

    // Knowledge plants
    const plants: Plant[] = entries.map((entry, i) => {
      const seed = entry.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const spread = 0.1 + (i / Math.max(entries.length - 1, 1)) * 0.8
      const xJitter = (seededRandom(seed) - 0.5) * 0.12
      const x = w * Math.max(0.05, Math.min(0.95, spread + xJitter))
      const yBase = meadowY + h * 0.05 + seededRandom(seed + 1) * h * 0.12
      const color = CATEGORY_COLORS[entry.category] ?? DEFAULT_COLOR
      const glow: [number, number, number] = [
        Math.min(255, color[0] + 80),
        Math.min(255, color[1] + 80),
        Math.min(255, color[2] + 80),
      ]
      return {
        entry,
        x,
        y: yBase,
        baseY: yBase,
        size: 22 + seededRandom(seed + 2) * 10,
        color,
        glowColor: glow,
        swayOffset: seededRandom(seed + 3) * Math.PI * 2,
        swaySpeed: 0.4 + seededRandom(seed + 4) * 0.4,
        hovered: false,
        stemHeight: 28 + seededRandom(seed + 5) * 20,
      }
    })
    plantsRef.current = plants
  }, [entries])

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
    const t = frame * 0.008
    const meadowTop = h * 0.58
    const meadowY = h * 0.62
    ctx.clearRect(0, 0, w, h)

    // ── Sky gradient ──
    const sky = ctx.createLinearGradient(0, 0, 0, meadowTop)
    sky.addColorStop(0, '#5BA3D9')
    sky.addColorStop(0.4, '#82BDE8')
    sky.addColorStop(0.75, '#B8D9F0')
    sky.addColorStop(1, '#E8F4F8')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, meadowTop)

    // ── Clouds ──
    for (const cloud of cloudsRef.current) {
      cloud.x = (cloud.x + cloud.speed) % (w + 200) - 100
      ctx.save()
      ctx.globalAlpha = cloud.opacity * 0.85
      const cx = cloud.x, cy = cloud.y, cs = cloud.size
      for (const [dx, dy, dr] of [
        [0, 0, cs * 0.6], [-cs * 0.5, cs * 0.1, cs * 0.45],
        [cs * 0.5, cs * 0.1, cs * 0.45], [-cs * 0.25, -cs * 0.2, cs * 0.4],
        [cs * 0.25, -cs * 0.2, cs * 0.4],
      ] as [number, number, number][]) {
        ctx.beginPath()
        ctx.arc(cx + dx, cy + dy, dr, 0, Math.PI * 2)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()
      }
      ctx.restore()
    }

    // ── Mountain ──
    const mx = w * 0.5, mBase = meadowTop + 10
    const mHeight = h * 0.52
    ctx.save()

    // Mountain body shadow
    ctx.beginPath()
    ctx.moveTo(mx - w * 0.28, mBase)
    ctx.lineTo(mx, mBase - mHeight)
    ctx.lineTo(mx + w * 0.28, mBase)
    ctx.closePath()
    const mBodyGrad = ctx.createLinearGradient(mx - w * 0.28, mBase, mx + w * 0.28, mBase)
    mBodyGrad.addColorStop(0, '#4A5240')
    mBodyGrad.addColorStop(0.45, '#6B7260')
    mBodyGrad.addColorStop(0.55, '#585E50')
    mBodyGrad.addColorStop(1, '#3A4035')
    ctx.fillStyle = mBodyGrad
    ctx.fill()

    // Snow cap
    const snowLine = mBase - mHeight * 0.55
    ctx.beginPath()
    ctx.moveTo(mx - w * 0.07, snowLine + mHeight * 0.04)
    ctx.lineTo(mx, mBase - mHeight)
    ctx.lineTo(mx + w * 0.07, snowLine + mHeight * 0.04)
    ctx.lineTo(mx + w * 0.12, snowLine + mHeight * 0.12)
    ctx.lineTo(mx - w * 0.12, snowLine + mHeight * 0.12)
    ctx.closePath()
    const snowGrad = ctx.createLinearGradient(mx - w * 0.1, snowLine, mx + w * 0.1, snowLine)
    snowGrad.addColorStop(0, '#D0E8F8')
    snowGrad.addColorStop(0.4, '#FFFFFF')
    snowGrad.addColorStop(0.6, '#F0F8FF')
    snowGrad.addColorStop(1, '#C8DCF0')
    ctx.fillStyle = snowGrad
    ctx.fill()

    // Snow glow
    ctx.shadowColor = 'rgba(200,230,255,0.6)'
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.moveTo(mx - w * 0.04, snowLine)
    ctx.lineTo(mx, mBase - mHeight)
    ctx.lineTo(mx + w * 0.04, snowLine)
    ctx.closePath()
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.restore()

    // ── Back hills ──
    ctx.beginPath()
    ctx.moveTo(0, meadowTop)
    ctx.bezierCurveTo(w * 0.15, meadowTop - h * 0.06, w * 0.3, meadowTop + h * 0.02, w * 0.5, meadowTop - h * 0.04)
    ctx.bezierCurveTo(w * 0.7, meadowTop - h * 0.08, w * 0.85, meadowTop + h * 0.01, w, meadowTop - h * 0.03)
    ctx.lineTo(w, meadowTop + h * 0.12)
    ctx.lineTo(0, meadowTop + h * 0.12)
    ctx.closePath()
    const hillGrad1 = ctx.createLinearGradient(0, meadowTop - h * 0.08, 0, meadowTop + h * 0.1)
    hillGrad1.addColorStop(0, '#2A5C1E')
    hillGrad1.addColorStop(1, '#3A7028')
    ctx.fillStyle = hillGrad1
    ctx.fill()

    // Pine trees on back hills
    for (let i = 0; i < 22; i++) {
      const tx = seededRandom(i * 31) * w
      const ty = meadowTop - seededRandom(i * 19) * h * 0.06 + seededRandom(i * 7) * h * 0.04
      const th = 18 + seededRandom(i * 13) * 22
      ctx.save()
      ctx.fillStyle = '#1A3D12'
      ctx.beginPath()
      ctx.moveTo(tx, ty - th)
      ctx.lineTo(tx - th * 0.35, ty)
      ctx.lineTo(tx + th * 0.35, ty)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    // ── Front hill ──
    ctx.beginPath()
    ctx.moveTo(0, meadowTop + h * 0.06)
    ctx.bezierCurveTo(w * 0.2, meadowTop - h * 0.01, w * 0.4, meadowTop + h * 0.09, w * 0.6, meadowTop + h * 0.04)
    ctx.bezierCurveTo(w * 0.75, meadowTop - h * 0.01, w * 0.88, meadowTop + h * 0.07, w, meadowTop + h * 0.04)
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    const hillGrad2 = ctx.createLinearGradient(0, meadowTop, 0, h)
    hillGrad2.addColorStop(0, '#4A8A30')
    hillGrad2.addColorStop(0.3, '#5A9E38')
    hillGrad2.addColorStop(1, '#6BAF3C')
    ctx.fillStyle = hillGrad2
    ctx.fill()

    // ── Meadow wildflowers ──
    for (const f of wildflowersRef.current) {
      const sway = Math.sin(t * 1.2 + f.swayOffset) * 1.2
      ctx.save()
      ctx.translate(f.x + sway, f.y)
      // Stem
      ctx.strokeStyle = `rgba(60,110,30,0.6)`
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, -f.size * 1.4)
      ctx.stroke()
      // Petals by type
      if (f.type === 0) { // Blue iris
        ctx.fillStyle = `rgba(90,140,210,0.8)`
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2
          ctx.beginPath()
          ctx.ellipse(Math.cos(a) * f.size * 0.5, -f.size * 1.4 + Math.sin(a) * f.size * 0.5, f.size * 0.4, f.size * 0.2, a, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (f.type === 1) { // White cotton
        ctx.fillStyle = `rgba(240,240,240,0.9)`
        ctx.beginPath()
        ctx.arc(0, -f.size * 1.4, f.size * 0.7, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(200,200,200,0.5)`
        for (let p = 0; p < 6; p++) {
          const a = (p / 6) * Math.PI * 2
          ctx.beginPath()
          ctx.arc(Math.cos(a) * f.size * 0.5, -f.size * 1.4 + Math.sin(a) * f.size * 0.5, f.size * 0.3, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (f.type === 2) { // Purple lavender
        ctx.fillStyle = `rgba(150,100,200,0.75)`
        for (let p = 0; p < 4; p++) {
          ctx.beginPath()
          ctx.ellipse(0, -f.size * (1.2 + p * 0.3), f.size * 0.25, f.size * 0.4, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      } else { // Yellow
        ctx.fillStyle = `rgba(240,200,50,0.85)`
        for (let p = 0; p < 6; p++) {
          const a = (p / 6) * Math.PI * 2
          ctx.beginPath()
          ctx.ellipse(Math.cos(a) * f.size * 0.45, -f.size * 1.4 + Math.sin(a) * f.size * 0.45, f.size * 0.3, f.size * 0.15, a, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = `rgba(255,160,0,0.9)`
        ctx.beginPath()
        ctx.arc(0, -f.size * 1.4, f.size * 0.25, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    // ── Knowledge plants ──
    const mx2 = mouseRef.current.x, my2 = mouseRef.current.y
    let newHovered: string | null = null

    for (const plant of plantsRef.current) {
      const isFiltered = searchFilter.length > 0 &&
        !plant.entry.title.includes(searchFilter) &&
        !(plant.entry.titleEn ?? '').toLowerCase().includes(searchFilter.toLowerCase()) &&
        !plant.entry.tags.some(tag => tag.includes(searchFilter))

      const dist = Math.hypot(mx2 - plant.x, my2 - plant.y)
      const isHover = dist < plant.size * 1.8 && !isFiltered
      if (isHover) newHovered = plant.entry.id

      const targetSize = isHover ? plant.size * 1.6 : plant.size
      plant.hovered = isHover

      const sway = Math.sin(t * plant.swaySpeed + plant.swayOffset) * 3
      const alpha = isFiltered ? 0.2 : 1.0

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(plant.x + sway, plant.y)

      // Glow
      if (isHover) {
        ctx.shadowColor = `rgba(${plant.glowColor.join(',')},0.8)`
        ctx.shadowBlur = 24
      }

      // Stem
      ctx.strokeStyle = `rgb(50,100,30)`
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(sway * 0.5, -plant.stemHeight * 0.5, 0, -plant.stemHeight)
      ctx.stroke()

      // Petals
      const [r, g, b] = isHover ? plant.glowColor : plant.color
      const petalCount = 6
      ctx.fillStyle = `rgb(${r},${g},${b})`
      for (let p = 0; p < petalCount; p++) {
        const a = (p / petalCount) * Math.PI * 2
        const petalLen = targetSize * 0.85
        const petalW = targetSize * 0.35
        ctx.save()
        ctx.translate(0, -plant.stemHeight)
        ctx.rotate(a)
        ctx.beginPath()
        ctx.ellipse(0, -petalLen * 0.5, petalW, petalLen, 0, 0, Math.PI * 2)
        ctx.globalAlpha = alpha * 0.85
        ctx.fill()
        ctx.restore()
      }

      // Center
      ctx.shadowBlur = isHover ? 12 : 0
      ctx.beginPath()
      ctx.arc(0, -plant.stemHeight, targetSize * 0.28, 0, Math.PI * 2)
      ctx.fillStyle = '#FFF9E6'
      ctx.globalAlpha = alpha
      ctx.fill()

      // Hover label
      if (isHover) {
        const label = lang === 'zh' ? plant.entry.title : (plant.entry.titleEn ?? plant.entry.title)
        ctx.shadowBlur = 0
        ctx.font = 'bold 13px Inter, sans-serif'
        const tw = ctx.measureText(label).width
        const lx = -tw / 2 - 8
        const ly = -plant.stemHeight - targetSize - 28

        ctx.fillStyle = 'rgba(10,15,30,0.75)'
        ctx.beginPath()
        ctx.roundRect(lx, ly - 16, tw + 16, 22, 6)
        ctx.fill()

        ctx.fillStyle = '#FFFFFF'
        ctx.textAlign = 'center'
        ctx.fillText(label, 0, ly - 1)
      }

      ctx.restore()
    }

    hoveredIdRef.current = newHovered
    // Update cursor style
    const canvas = canvasRef.current
    if (canvas) canvas.style.cursor = newHovered ? 'pointer' : 'default'

  }, [entries, searchFilter, lang])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initScene(canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const loop = () => {
      frameRef.current++
      draw(ctx, canvas.width, canvas.height, frameRef.current)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    const onClick = () => {
      if (hoveredIdRef.current) onEntryClick(hoveredIdRef.current)
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('click', onClick)
    }
  }, [initScene, draw, onEntryClick])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', display: 'block' }}
    />
  )
}
