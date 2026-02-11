'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { KnowledgeEntry } from '@/types'

interface SearchBarProps {
  entries: KnowledgeEntry[]
  onSelect?: (id: string) => void
}

export function SearchBar({ entries, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = query.length > 0
    ? entries.filter(e =>
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.titleEn?.toLowerCase().includes(query.toLowerCase()) ||
        e.summary.toLowerCase().includes(query.toLowerCase()) ||
        e.tags.some(t => t.toLowerCase().includes(query.toLowerCase())) ||
        e.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : []

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur()
        setQuery('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <motion.div
        animate={focused ? { boxShadow: '0 0 0 2px var(--accent-primary)' } : { boxShadow: 'none' }}
        transition={{ duration: 0.15 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-normal)',
        }}
      >
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="搜索知识... (⌘K)"
          className="w-full pl-12 pr-16 py-3.5 text-sm bg-transparent outline-none"
          style={{ color: 'var(--text-primary)' }}
        />

        {/* Kbd hint */}
        {!focused && !query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
            <kbd className="px-1.5 py-0.5 text-xs rounded" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>⌘</kbd>
            <kbd className="px-1.5 py-0.5 text-xs rounded" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>K</kbd>
          </div>
        )}

        {/* Clear button */}
        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        )}
      </motion.div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {focused && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-normal)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {results.map((entry, i) => (
              <motion.a
                key={entry.id}
                href={`/knowledge/${entry.id}`}
                onClick={() => { setQuery(''); onSelect?.(entry.id) }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 px-4 py-3 transition-colors"
                style={{ borderBottom: i < results.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-glass-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span className="text-xl">{entry.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {entry.title}
                    {entry.titleEn && <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{entry.titleEn}</span>}
                  </div>
                  <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {entry.category}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {entry.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="tag text-xs">{tag}</span>
                  ))}
                </div>
              </motion.a>
            ))}
          </motion.div>
        )}

        {focused && query && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl px-4 py-6 text-center z-50"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-normal)',
              color: 'var(--text-muted)',
            }}
          >
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-sm">没有找到「{query}」</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
