'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useTheme, type Theme } from './ThemeProvider'
import { useState } from 'react'

const themes: { id: Theme; label: string; emoji: string; desc: string }[] = [
  { id: 'dark',     label: '深夜黑', emoji: '🌙', desc: 'Dark' },
  { id: 'cream',    label: '奶油白', emoji: '☕', desc: 'Cream' },
  { id: 'colorful', label: '活力彩', emoji: '🌈', desc: 'Vivid' },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const current = themes.find(t => t.id === theme)!

  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
        style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-normal)',
          color: 'var(--text-secondary)',
          backdropFilter: 'blur(8px)',
        }}
        aria-label="Switch theme"
      >
        <span className="text-base">{current.emoji}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-xs opacity-60"
        >
          ▾
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-normal)',
                boxShadow: 'var(--shadow-lg)',
                minWidth: '160px',
              }}
            >
              {themes.map((t, i) => (
                <motion.button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setOpen(false) }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-all"
                  style={{
                    color: theme === t.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    background: theme === t.id ? 'var(--bg-glass)' : 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-glass-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = theme === t.id ? 'var(--bg-glass)' : 'transparent')}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <span className="font-medium">{t.label}</span>
                  {theme === t.id && <span className="ml-auto text-xs">✓</span>}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
