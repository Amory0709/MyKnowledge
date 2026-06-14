'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { KnowledgeEntry } from '@/types'

interface KnowledgeCardProps {
  entry: KnowledgeEntry
  index?: number
}

const difficultyConfig = {
  beginner:     { label: '入门',   color: '#50fa7b', bg: 'rgba(80,250,123,0.1)' },
  intermediate: { label: '进阶',   color: '#ffb86c', bg: 'rgba(255,184,108,0.1)' },
  advanced:     { label: '深入',   color: '#ff5555', bg: 'rgba(255,85,85,0.1)' },
}

export function KnowledgeCard({ entry, index = 0 }: KnowledgeCardProps) {
  const diff = entry.difficulty ? difficultyConfig[entry.difficulty] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link href={`/knowledge/${entry.id}`} className="block group">
        <div
          className="relative rounded-2xl p-5 transition-all duration-300 overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.transform = 'translateY(-4px)'
            el.style.boxShadow = 'var(--shadow-md)'
            el.style.borderColor = 'var(--border-normal)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.transform = 'translateY(0)'
            el.style.boxShadow = 'var(--shadow-sm)'
            el.style.borderColor = 'var(--border-subtle)'
          }}
        >
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ background: 'var(--gradient-card)' }}
          />

          {/* Private badge */}
          {!entry.public && (
            <div
              className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
            >
              🔒 私密
            </div>
          )}

          {/* Emoji */}
          <div className="text-4xl mb-3 relative z-10">
            {typeof entry.emoji === 'string' && entry.emoji.length <= 4
              ? <span>{entry.emoji}</span>
              : <span className="font-mono text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{entry.emoji}</span>
            }
          </div>

          {/* Category */}
          <div className="text-xs font-medium mb-1.5 relative z-10" style={{ color: 'var(--accent-primary)' }}>
            {entry.category}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold mb-1 relative z-10 leading-tight" style={{ color: 'var(--text-primary)' }}>
            {entry.title}
          </h3>
          {entry.titleEn && (
            <p className="text-xs mb-2 relative z-10" style={{ color: 'var(--text-muted)' }}>
              {entry.titleEn}
            </p>
          )}

          {/* Summary */}
          <p className="text-sm leading-relaxed mb-4 relative z-10 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {entry.summary}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.slice(0, 3).map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {diff && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ color: diff.color, background: diff.bg }}
                >
                  {diff.label}
                </span>
              )}
              {entry.readTime && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {entry.readTime} min
                </span>
              )}
            </div>
          </div>

          {/* Arrow indicator */}
          <motion.div
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity relative z-10"
            initial={{ x: -4 }}
            whileHover={{ x: 0 }}
          >
            <span style={{ color: 'var(--accent-primary)' }}>→</span>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  )
}
