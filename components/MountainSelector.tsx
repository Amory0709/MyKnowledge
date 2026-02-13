'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface MountainMeta {
  id: string
  name: string
  category: string
  lat: number
  lng: number
  radiusKm: number
  minElevation: number
  maxElevation: number
  resolution: number
}

interface MountainSelectorProps {
  onSelect: (id: string) => void
}

const CATEGORY_STYLE: Record<string, { emoji: string; color: string; gradient: string }> = {
  '编程': { emoji: '💻', color: '#00E5FF', gradient: 'linear-gradient(135deg, #0a2e3d, #00596e)' },
  '财务': { emoji: '💰', color: '#FFD700', gradient: 'linear-gradient(135deg, #3d2e0a, #6e5500)' },
  '数学': { emoji: '🔢', color: '#BB80FF', gradient: 'linear-gradient(135deg, #2a1a3d, #4e2e6e)' },
  '设计': { emoji: '🎨', color: '#FF90B0', gradient: 'linear-gradient(135deg, #3d1a2a, #6e2e4e)' },
  '人文': { emoji: '📚', color: '#80CBC4', gradient: 'linear-gradient(135deg, #1a3d3a, #2e6e68)' },
  '社交': { emoji: '🤝', color: '#FF8A65', gradient: 'linear-gradient(135deg, #3d1a0a, #6e3a1e)' },
  '修身': { emoji: '🧘', color: '#CE93D8', gradient: 'linear-gradient(135deg, #2d1a3d, #5a2e6e)' },
}

export function MountainSelector({ onSelect }: MountainSelectorProps) {
  const [mountains, setMountains] = useState<MountainMeta[]>([])

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    fetch(`${basePath}/terrain/mountains.json`)
      .then((r) => r.json())
      .then(setMountains)
      .catch(console.error)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      padding: '60px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center', marginBottom: 50, paddingTop: 40 }}
      >
        <h1 style={{
          fontSize: 36, fontWeight: 700, color: '#fff',
          margin: '0 0 8px', letterSpacing: '-0.5px',
        }}>
          🏔️ Knowledge Mountains
        </h1>
        <p style={{ fontSize: 16, color: '#888', margin: 0 }}>
          Each peak, a domain of knowledge. Pick your climb.
        </p>
      </motion.div>

      {/* Mountain grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20,
        maxWidth: 1000,
        margin: '0 auto',
      }}>
        {mountains.map((m, i) => {
          const style = CATEGORY_STYLE[m.category] || CATEGORY_STYLE['编程']
          const elevDiff = m.maxElevation - m.minElevation

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              onClick={() => onSelect(m.id)}
              style={{
                background: style.gradient,
                borderRadius: 16,
                padding: 24,
                cursor: 'pointer',
                border: `1px solid ${style.color}22`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              whileHover={{
                scale: 1.03,
                boxShadow: `0 8px 30px ${style.color}33`,
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Heightmap preview (background) */}
              <div style={{
                position: 'absolute',
                top: 0, right: 0,
                width: 120, height: 120,
                opacity: 0.15,
                backgroundImage: `url(${process.env.NEXT_PUBLIC_BASE_PATH || ''}/terrain/${m.id}.png)`,
                backgroundSize: 'cover',
                filter: 'blur(1px)',
                borderRadius: '0 16px 0 0',
              }} />

              {/* Content */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>
                  {style.emoji}
                </div>
                <h3 style={{
                  fontSize: 18, fontWeight: 600, color: '#fff',
                  margin: '0 0 4px',
                }}>
                  {m.name}
                </h3>
                <p style={{
                  fontSize: 14, color: style.color,
                  margin: '0 0 12px', fontWeight: 500,
                }}>
                  {m.category}
                </p>

                <div style={{
                  display: 'flex', gap: 16,
                  fontSize: 12, color: '#aaa',
                }}>
                  <span>⛰️ {elevDiff}m</span>
                  <span>🌐 {m.radiusKm}km</span>
                  <span>📍 {m.lat.toFixed(1)}°</span>
                </div>

                {/* Mini elevation bar */}
                <div style={{
                  marginTop: 12, height: 3, borderRadius: 2,
                  background: 'rgba(255,255,255,0.1)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    background: style.color,
                    width: `${Math.min(100, (elevDiff / 8741) * 100)}%`,
                    opacity: 0.7,
                  }} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
