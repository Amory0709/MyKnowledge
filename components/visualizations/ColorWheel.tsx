'use client'

import { useEffect, useRef, useCallback } from 'react'

interface ColorWheelProps {
  selectedH: number
  selectedS: number
  selectedL: number
  onChange: (h: number, s: number, l: number) => void
  size?: number
}

export function ColorWheel({ selectedH, selectedS, selectedL, onChange, size = 280 }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDragging = useRef(false)
  const animFrameRef = useRef<number>(0)

  const hslToRgb = (h: number, s: number, l: number) => {
    s /= 100; l /= 100
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    }
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
  }

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = size * dpr
    const h = size * dpr
    const cx = w / 2
    const cy = h / 2
    const outerR = (size / 2 - 8) * dpr
    const innerR = outerR * 0.45

    ctx.clearRect(0, 0, w, h)

    // Draw color wheel using image data for performance
    const imageData = ctx.createImageData(w, h)
    const data = imageData.data

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx
        const dy = y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist > innerR && dist < outerR) {
          let angle = Math.atan2(dy, dx) * (180 / Math.PI)
          if (angle < 0) angle += 360

          // Saturation based on radial position
          const t = (dist - innerR) / (outerR - innerR)
          const sat = t * 100

          const [r, g, b] = hslToRgb(angle, sat, 55)
          const idx = (y * w + x) * 4
          data[idx]     = r
          data[idx + 1] = g
          data[idx + 2] = b
          data[idx + 3] = 255
        }
      }
    }
    ctx.putImageData(imageData, 0, 0)

    // Draw inner white circle
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR * 0.9)
    grad.addColorStop(0, 'rgba(255,255,255,0)')
    grad.addColorStop(0.6, 'rgba(255,255,255,0)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    
    // Fill center
    ctx.beginPath()
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
    ctx.fillStyle = `hsl(${selectedH}, ${selectedS}%, ${selectedL}%)`
    ctx.fill()
    
    // Center text - show current hue
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const [lr, lg, lb] = hslToRgb(selectedH, selectedS, selectedL)
    const brightness = (lr * 299 + lg * 587 + lb * 114) / 1000
    ctx.fillStyle = brightness > 128 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)'
    ctx.font = `bold ${14 * dpr}px Inter, sans-serif`
    ctx.fillText(`${Math.round(selectedH)}°`, cx, cy - 8 * dpr)
    ctx.font = `${11 * dpr}px Inter, sans-serif`
    ctx.fillStyle = brightness > 128 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'
    ctx.fillText('Hue', cx, cy + 10 * dpr)

    // Draw selector dot
    const angleRad = (selectedH * Math.PI) / 180
    const satT = selectedS / 100
    const dotR = innerR + satT * (outerR - innerR)
    const dotX = cx + Math.cos(angleRad) * dotR
    const dotY = cy + Math.sin(angleRad) * dotR

    // Outer ring
    ctx.beginPath()
    ctx.arc(dotX, dotY, 10 * dpr, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 3 * dpr
    ctx.stroke()

    // Inner fill
    ctx.beginPath()
    ctx.arc(dotX, dotY, 7 * dpr, 0, Math.PI * 2)
    ctx.fillStyle = `hsl(${selectedH}, ${selectedS}%, ${selectedL}%)`
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = 1.5 * dpr
    ctx.stroke()

  }, [selectedH, selectedS, selectedL, size])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    drawWheel()
  }, [size, drawWheel])

  const getHSFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    const x = (clientX - rect.left) * dpr
    const y = (clientY - rect.top) * dpr
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    
    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    const outerR = (size / 2 - 8) * dpr
    const innerR = outerR * 0.45
    
    if (dist < innerR || dist > outerR) return null

    let angle = Math.atan2(dy, dx) * (180 / Math.PI)
    if (angle < 0) angle += 360
    
    const satT = Math.max(0, Math.min(1, (dist - innerR) / (outerR - innerR)))
    const newS = Math.round(satT * 100)
    
    return { h: Math.round(angle), s: newS }
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    isDragging.current = true
    const result = getHSFromEvent(e)
    if (result) onChange(result.h, result.s, selectedL)
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return
    e.preventDefault()
    const result = getHSFromEvent(e)
    if (result) onChange(result.h, result.s, selectedL)
  }

  const handleEnd = () => { isDragging.current = false }

  return (
    <canvas
      ref={canvasRef}
      style={{
        borderRadius: '50%',
        cursor: 'crosshair',
        touchAction: 'none',
        display: 'block',
      }}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    />
  )
}
