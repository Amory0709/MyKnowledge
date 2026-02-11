'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ColorWheel } from './ColorWheel'
import type { FunFact } from '@/types'

// ── Color Conversion Utilities ──────────────────────────────────────
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  }
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = d / (l > 0.5 ? 2 - max - min : max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

function getRelatedColors(h: number, s: number, l: number) {
  return {
    complementary: [{ h: (h + 180) % 360, s, l }],
    triadic: [
      { h: (h + 120) % 360, s, l },
      { h: (h + 240) % 360, s, l },
    ],
    analogous: [
      { h: (h + 30) % 360, s, l },
      { h: (h - 30 + 360) % 360, s, l },
    ],
    split: [
      { h: (h + 150) % 360, s, l },
      { h: (h + 210) % 360, s, l },
    ],
    tetradic: [
      { h: (h + 90) % 360, s, l },
      { h: (h + 180) % 360, s, l },
      { h: (h + 270) % 360, s, l },
    ],
  }
}

// ── Copied State ────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={copy}
      className="text-xs px-2 py-0.5 rounded transition-all"
      style={{
        background: copied ? 'var(--accent-tertiary)' : 'var(--bg-glass)',
        color: copied ? '#000' : 'var(--text-muted)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {copied ? '✓ 已复制' : '复制'}
    </button>
  )
}

// ── Color Swatch ────────────────────────────────────────────────────
function ColorSwatch({ h, s, l, label, size = 'md' }: { h: number; s: number; l: number; label: string; size?: 'sm' | 'md' | 'lg' }) {
  const [r, g, b] = hslToRgb(h, s, l)
  const hex = rgbToHex(r, g, b)
  const [copied, setCopied] = useState(false)

  const sizes = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' }

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5 cursor-pointer"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={async () => {
        await navigator.clipboard.writeText(hex)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      <div
        className={`${sizes[size]} rounded-xl shadow-md transition-shadow hover:shadow-lg relative`}
        style={{ background: `hsl(${h},${s}%,${l}%)`, border: '2px solid rgba(255,255,255,0.15)' }}
      >
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center rounded-xl text-xs font-bold"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
            >
              ✓
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </motion.div>
  )
}

// ── Main Component ──────────────────────────────────────────────────
interface ColorExplorerProps {
  funFacts?: FunFact[]
}

type Tab = 'wheel' | 'converter' | 'relationships' | 'facts'

export function ColorExplorer({ funFacts = [] }: ColorExplorerProps) {
  const [h, setH] = useState(210)
  const [s, setS] = useState(80)
  const [l, setL] = useState(55)
  const [hexInput, setHexInput] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('wheel')
  const [activeFact, setActiveFact] = useState<number | null>(null)
  const [activeRelation, setActiveRelation] = useState<string>('complementary')

  const [r, g, b] = hslToRgb(h, s, l)
  const hex = rgbToHex(r, g, b)

  useEffect(() => {
    setHexInput(hex)
  }, [hex])

  const handleWheelChange = useCallback((nh: number, ns: number, nl: number) => {
    setH(nh); setS(ns)
  }, [])

  const handleHexInput = (val: string) => {
    setHexInput(val)
    const clean = val.startsWith('#') ? val : '#' + val
    if (clean.length === 7) {
      const rgb = hexToRgb(clean)
      if (rgb) {
        const [nh, ns, nl] = rgbToHsl(...rgb)
        setH(nh); setS(ns); setL(nl)
      }
    }
  }

  const related = getRelatedColors(h, s, l)

  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  const textOnColor = brightness > 128 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'wheel',         label: '色轮',   icon: '🎡' },
    { id: 'converter',     label: '转换器', icon: '🔄' },
    { id: 'relationships', label: '色彩关系', icon: '🔗' },
    { id: 'facts',         label: '趣味知识', icon: '💡' },
  ]

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Current color hero banner */}
      <motion.div
        className="relative rounded-2xl overflow-hidden mb-6"
        style={{ height: '120px' }}
        animate={{ background: `linear-gradient(135deg, hsl(${h},${s}%,${Math.max(l - 10, 10)}%), hsl(${h},${s}%,${l}%), hsl(${(h + 30) % 360},${s}%,${l}%))` }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0 flex items-center justify-between px-8">
          <div>
            <motion.p
              key={hex}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-mono font-bold"
              style={{ color: textOnColor }}
            >
              {hex.toUpperCase()}
            </motion.p>
            <p className="text-sm font-medium mt-1" style={{ color: textOnColor, opacity: 0.8 }}>
              rgb({r}, {g}, {b}) · hsl({h}°, {s}%, {l}%)
            </p>
          </div>
          <CopyButton text={hex} />
        </div>
      </motion.div>

      {/* Tab navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--bg-glass)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${activeTab === tab.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {/* ── Color Wheel Tab ── */}
        {activeTab === 'wheel' && (
          <motion.div
            key="wheel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Wheel */}
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-sm text-center mb-4" style={{ color: 'var(--text-muted)' }}>
                  拖动选择色相和饱和度
                </p>
                <ColorWheel
                  selectedH={h}
                  selectedS={s}
                  selectedL={l}
                  onChange={handleWheelChange}
                  size={260}
                />
                {/* Lightness slider below wheel */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <span>亮度 L</span>
                    <span>{l}%</span>
                  </div>
                  <div className="relative h-6">
                    <div
                      className="absolute inset-y-1.5 inset-x-0 rounded-full"
                      style={{
                        background: `linear-gradient(to right, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},${s}%,100%))`,
                      }}
                    />
                    <input
                      type="range" min={5} max={95} value={l}
                      onChange={e => setL(Number(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      style={{ height: '100%' }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
                      style={{
                        left: `calc(${(l - 5) / 90 * 100}% - 8px)`,
                        background: `hsl(${h},${s}%,${l}%)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Color info panel */}
            <div className="space-y-4">
              {/* Format display */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>颜色格式</h3>
                <div className="space-y-3">
                  {[
                    { label: 'HEX',  value: hex.toUpperCase(),                    icon: '🎭' },
                    { label: 'RGB',  value: `rgb(${r}, ${g}, ${b})`,              icon: '🔢' },
                    { label: 'HSL',  value: `hsl(${h}°, ${s}%, ${l}%)`,          icon: '🌈' },
                  ].map(fmt => (
                    <div
                      key={fmt.label}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span>{fmt.icon}</span>
                        <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>{fmt.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm" style={{ color: 'var(--text-primary)', background: 'none', padding: 0, border: 'none' }}>
                          {fmt.value}
                        </code>
                        <CopyButton text={fmt.value} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RGB Bars */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>RGB 通道</h3>
                {([
                  { label: 'R  红色', val: r, color: '#ff5555', setVal: (v: number) => { const [nh,ns,nl] = rgbToHsl(v, g, b); setH(nh); setS(ns); setL(nl) } },
                  { label: 'G  绿色', val: g, color: '#50fa7b', setVal: (v: number) => { const [nh,ns,nl] = rgbToHsl(r, v, b); setH(nh); setS(ns); setL(nl) } },
                  { label: 'B  蓝色', val: b, color: '#8be9fd', setVal: (v: number) => { const [nh,ns,nl] = rgbToHsl(r, g, v); setH(nh); setS(ns); setL(nl) } },
                ] as const).map(ch => (
                  <div key={ch.label} className="mb-3">
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                      <span>{ch.label}</span>
                      <span className="font-mono">{ch.val}</span>
                    </div>
                    <div className="relative h-5">
                      <div
                        className="absolute inset-y-1.5 inset-x-0 rounded-full"
                        style={{ background: `linear-gradient(to right, #111, ${ch.color})` }}
                      />
                      <input
                        type="range" min={0} max={255} value={ch.val}
                        onChange={e => ch.setVal(Number(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
                        style={{
                          left: `calc(${ch.val / 255 * 100}% - 8px)`,
                          background: ch.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Converter Tab ── */}
        {activeTab === 'converter' && (
          <motion.div
            key="converter"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* HEX Input */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                  🎭 HEX 输入
                </h3>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-normal)' }}
                >
                  <div className="w-6 h-6 rounded-md flex-shrink-0" style={{ background: hex }} />
                  <input
                    type="text"
                    value={hexInput}
                    onChange={e => handleHexInput(e.target.value)}
                    placeholder="#7b7eff"
                    className="flex-1 bg-transparent text-sm font-mono outline-none"
                    style={{ color: 'var(--text-primary)' }}
                    maxLength={7}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  输入任何 HEX 颜色码，自动转换
                </p>
              </div>

              {/* RGB Inputs */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                  🔢 RGB
                </h3>
                {(['R', 'G', 'B'] as const).map((ch, i) => {
                  const vals = [r, g, b]
                  return (
                    <div key={ch} className="flex items-center gap-2 mb-2">
                      <span className="text-xs w-4 font-bold" style={{ color: ['#ff5555','#50fa7b','#8be9fd'][i] }}>{ch}</span>
                      <input
                        type="number" min={0} max={255} value={vals[i]}
                        onChange={e => {
                          const newVals = [...vals]
                          newVals[i] = Math.max(0, Math.min(255, Number(e.target.value)))
                          const [nh, ns, nl] = rgbToHsl(newVals[0], newVals[1], newVals[2])
                          setH(nh); setS(ns); setL(nl)
                        }}
                        className="flex-1 px-2 py-1.5 rounded-lg text-sm font-mono outline-none"
                        style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  )
                })}
              </div>

              {/* HSL Inputs */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                  🌈 HSL
                </h3>
                {[
                  { label: 'H °', val: h, max: 359, set: setH },
                  { label: 'S %', val: s, max: 100, set: setS },
                  { label: 'L %', val: l, max: 100, set: setL },
                ].map(ch => (
                  <div key={ch.label} className="flex items-center gap-2 mb-2">
                    <span className="text-xs w-7 font-bold" style={{ color: 'var(--text-muted)' }}>{ch.label}</span>
                    <input
                      type="number" min={0} max={ch.max} value={ch.val}
                      onChange={e => ch.set(Math.max(0, Math.min(ch.max, Number(e.target.value))))}
                      className="flex-1 px-2 py-1.5 rounded-lg text-sm font-mono outline-none"
                      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Gradient Lightness Scale */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
                亮度色阶
              </h3>
              <div className="flex gap-2">
                {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(lightness => (
                  <motion.div
                    key={lightness}
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 h-12 rounded-lg cursor-pointer relative"
                    style={{
                      background: `hsl(${h},${s}%,${lightness}%)`,
                      outline: Math.abs(lightness - l) < 6 ? `2px solid white` : 'none',
                      outlineOffset: '2px',
                    }}
                    onClick={() => setL(lightness)}
                    title={`L: ${lightness}%`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>暗</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>→ 亮</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Relationships Tab ── */}
        {activeTab === 'relationships' && (
          <motion.div
            key="relationships"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex gap-2 mb-4 flex-wrap">
              {(Object.keys(related) as (keyof typeof related)[]).map(rel => (
                <button
                  key={rel}
                  onClick={() => setActiveRelation(rel)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: activeRelation === rel ? 'var(--accent-primary)' : 'var(--bg-glass)',
                    color: activeRelation === rel ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${activeRelation === rel ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  }}
                >
                  {{ complementary: '互补色', triadic: '三角色', analogous: '相似色', split: '分裂互补', tetradic: '四角色' }[rel]}
                </button>
              ))}
            </div>

            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex flex-wrap gap-6 items-end justify-center">
                {/* Base color */}
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    className="w-20 h-20 rounded-2xl shadow-lg"
                    style={{ background: `hsl(${h},${s}%,${l}%)` }}
                    animate={{ background: `hsl(${h},${s}%,${l}%)` }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>当前色</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{hex.toUpperCase()}</span>
                </div>

                <div className="text-2xl" style={{ color: 'var(--text-muted)' }}>+</div>

                {/* Related colors */}
                {related[activeRelation as keyof typeof related].map((color, i) => {
                  const [cr, cg, cb] = hslToRgb(color.h, color.s, color.l)
                  const chex = rgbToHex(cr, cg, cb)
                  return (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <motion.div
                        className="w-20 h-20 rounded-2xl shadow-lg cursor-pointer"
                        style={{ background: `hsl(${color.h},${color.s}%,${color.l}%)` }}
                        animate={{ background: `hsl(${color.h},${color.s}%,${color.l}%)` }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setH(color.h); setS(color.s); setL(color.l) }}
                        title="点击选择此颜色"
                        transition={{ duration: 0.3 }}
                      />
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {{ complementary: '互补色', triadic: `三角 ${i + 1}`, analogous: i === 0 ? '+30°' : '-30°', split: `分裂 ${i + 1}`, tetradic: `四角 ${i + 1}` }[activeRelation]}
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{chex.toUpperCase()}</span>
                    </div>
                  )
                })}
              </div>

              {/* Combined preview */}
              <div className="mt-6">
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>组合预览</p>
                <div className="flex rounded-xl overflow-hidden h-12">
                  {[{ h, s, l }, ...related[activeRelation as keyof typeof related]].map((c, i) => (
                    <motion.div
                      key={i}
                      className="flex-1"
                      style={{ background: `hsl(${c.h},${c.s}%,${c.l}%)` }}
                      animate={{ background: `hsl(${c.h},${c.s}%,${c.l}%)` }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {{
                    complementary: '💡 互补色位于色轮对面，放在一起有强烈的对比感，常用于突出重点。',
                    triadic: '💡 三角色将色轮等分为三份，既有丰富的色彩变化，又保持视觉平衡。',
                    analogous: '💡 相似色相互邻近，色调统一，给人柔和、和谐的感觉。适合营造氛围。',
                    split: '💡 分裂互补色比直接互补更微妙，减少了对比的尖锐感，同时保留活力。',
                    tetradic: '💡 四角色提供最丰富的色彩方案，但使用时需要选一个主导色，避免杂乱。',
                  }[activeRelation]}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Fun Facts Tab ── */}
        {activeTab === 'facts' && (
          <motion.div
            key="facts"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {funFacts.map((fact, i) => (
              <motion.div
                key={fact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5 cursor-pointer transition-all"
                style={{
                  background: activeFact === fact.id ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                  border: `1px solid ${activeFact === fact.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  boxShadow: activeFact === fact.id ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                }}
                onClick={() => setActiveFact(activeFact === fact.id ? null : fact.id)}
              >
                <div className="text-3xl mb-3">{fact.icon}</div>
                <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                  {fact.title}
                </h3>
                <AnimatePresence>
                  {activeFact === fact.id ? (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {fact.content}
                    </motion.p>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      点击了解更多 →
                    </p>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
