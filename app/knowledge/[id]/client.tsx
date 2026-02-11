'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { ColorExplorer } from '@/components/visualizations/ColorExplorer'
import type { KnowledgeEntry, FunFact } from '@/types'

function ComingSoon({ title }: { title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-24"
    >
      <div className="text-6xl mb-6">🚧</div>
      <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        {title} 的交互页面正在建设中
      </h2>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        下次来的时候可能就有啦～
      </p>
    </motion.div>
  )
}

export function KnowledgePageClient({ entry }: { entry: KnowledgeEntry }) {
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
        <Link
          href="/"
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <span>←</span>
          <span>知识花园</span>
        </Link>
        <ThemeSwitcher />
      </nav>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-10 pb-8 max-w-5xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-3">
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{
              background: 'var(--bg-glass)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {entry.category}
          </span>
          {entry.readTime && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ⏱ {entry.readTime} 分钟
            </span>
          )}
          {!entry.public && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>🔒 私密</span>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center gap-4">
          <span>{entry.emoji || '📄'}</span>
          <span>{entry.title}</span>
        </h1>

        <p className="text-base leading-relaxed max-w-2xl mb-4" style={{ color: 'var(--text-secondary)' }}>
          {entry.summary}
        </p>

        <div className="flex gap-2 flex-wrap">
          {entry.tags.map(tag => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full"
              style={{
                background: 'var(--bg-glass)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── Visualization ── */}
      <div className="px-6 pb-24 max-w-5xl mx-auto">
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          {entry.componentType === 'color-explorer' && (
            <ColorExplorer funFacts={(entry.data as { funFacts?: FunFact[] }).funFacts ?? []} />
          )}
          {entry.componentType === 'coming-soon' && (
            <ComingSoon title={entry.title} />
          )}
        </div>
      </div>
    </div>
  )
}
