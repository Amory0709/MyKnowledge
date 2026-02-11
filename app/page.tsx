'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import entries from '@/data/entries.json'
import type { KnowledgeEntry } from '@/types'

const allEntries = entries as KnowledgeEntry[]

const difficultyLabel: Record<string, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '深入',
}
const difficultyColor: Record<string, string> = {
  beginner: '#50fa7b',
  intermediate: '#ffb86c',
  advanced: '#ff79c6',
}

export default function HomePage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('全部')

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allEntries.map(e => e.category)))
    return ['全部', ...cats]
  }, [])

  const filtered = useMemo(() => {
    return allEntries.filter(e => {
      const matchSearch =
        !search ||
        e.title.includes(search) ||
        e.summary.includes(search) ||
        e.tags.some(t => t.includes(search))
      const matchCat = activeCategory === '全部' || e.category === activeCategory
      return matchSearch && matchCat
    })
  }, [search, activeCategory])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-4"
        style={{
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌱</span>
          <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>MyKnowledge</span>
        </div>
        <ThemeSwitcher />
      </nav>

      {/* ── Hero ── */}
      <div
        className="relative px-6 py-16 text-center overflow-hidden"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <div className="absolute inset-0" style={{ background: 'var(--gradient-glow)' }} />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative"
        >
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            我的知识花园 🌸
          </h1>
          <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            遇到的每一块知识，都值得被漂亮地记下来
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-normal)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索知识..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-primary)' }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Category Filter ── */}
      <div className="px-6 py-4 flex gap-2 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: activeCategory === cat ? 'var(--accent-primary)' : 'var(--bg-glass)',
              color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${activeCategory === cat ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Knowledge Grid ── */}
      <main className="px-6 py-4 pb-16">
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} 条知识
          {search && ` · 搜索「${search}」`}
        </p>

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {filtered.map((entry, i) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/knowledge/${entry.id}`} className="block h-full">
                  <motion.div
                    className="h-full rounded-2xl p-5 cursor-pointer transition-all"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                    whileHover={{
                      y: -4,
                      boxShadow: 'var(--shadow-glow)',
                      borderColor: 'var(--accent-primary)',
                    }}
                  >
                    {/* Emoji + category */}
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{entry.emoji || '📄'}</span>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: 'var(--bg-glass)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {entry.category}
                        </span>
                        {!entry.public && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>🔒 私密</span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h2
                      className="font-bold text-base mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {entry.title}
                    </h2>

                    {/* Summary */}
                    <p
                      className="text-sm leading-relaxed mb-4 line-clamp-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {entry.summary}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 flex-wrap">
                        {entry.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: 'var(--bg-glass)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {entry.difficulty && (
                        <span
                          className="text-xs font-medium"
                          style={{ color: difficultyColor[entry.difficulty] }}
                        >
                          {difficultyLabel[entry.difficulty]}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-4xl mb-4">🌱</p>
            <p style={{ color: 'var(--text-muted)' }}>没找到匹配的知识</p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
