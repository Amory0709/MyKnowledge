'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { GardenCanvas } from '@/components/GardenCanvas'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { useLang } from '@/components/LanguageProvider'
import entries from '@/data/entries.json'
import type { KnowledgeEntry } from '@/types'

const allEntries = entries as KnowledgeEntry[]

export default function HomePage() {
  const router = useRouter()
  const { lang, setLang, t } = useLang()
  const [search, setSearch] = useState('')
  const [showList, setShowList] = useState(false)

  const handlePlantClick = (id: string) => {
    router.push(`/MyKnowledge/knowledge/${id}`)
  }

  const filtered = allEntries.filter(e =>
    !search ||
    e.title.includes(search) ||
    (e.titleEn ?? '').toLowerCase().includes(search.toLowerCase()) ||
    e.tags.some(t => t.includes(search))
  )

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {/* Canvas garden */}
      <GardenCanvas
        entries={allEntries}
        onEntryClick={handlePlantClick}
        searchFilter={search}
        lang={lang}
      />

      {/* ── Top Nav ── */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px',
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🌸</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#1a3a1a', textShadow: '0 1px 3px rgba(255,255,255,0.8)' }}>
            {t('知识花园', 'Knowledge Garden')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.25)',
              color: '#1a3a1a',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            {lang === 'zh' ? 'EN' : '中'}
          </button>
          <ThemeSwitcher />
        </div>
      </nav>

      {/* ── Bottom search + list toggle ── */}
      <div
        style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          width: 'min(480px, 90vw)',
        }}
      >
        {/* Search pill */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 18px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          }}
        >
          <span style={{ fontSize: 16, opacity: 0.7 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('在花园中寻找知识...', 'Search the garden...')}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 14, color: '#1a2a1a',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: 12 }}
            >
              ✕
            </button>
          )}
        </motion.div>

        {/* Entry count + list toggle */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowList(v => !v)}
            style={{
              padding: '5px 14px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.22)',
              border: '1px solid rgba(255,255,255,0.4)',
              backdropFilter: 'blur(8px)',
              fontSize: 12,
              color: '#1a3a1a',
              cursor: 'pointer',
            }}
          >
            🌱 {allEntries.length} {t('块知识', 'entries')} {showList ? '▲' : '▼'}
          </button>
        </div>

        {/* List drawer */}
        <AnimatePresence>
          {showList && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.22)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.45)',
                borderRadius: 20,
                padding: 12,
                maxHeight: 240,
                overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              }}
            >
              {filtered.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => handlePlantClick(entry.id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '8px 12px', borderRadius: 12,
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ fontSize: 20 }}>{entry.emoji ?? '🌿'}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2a1a' }}>
                      {lang === 'zh' ? entry.title : (entry.titleEn ?? entry.title)}
                    </div>
                    <div style={{ fontSize: 11, color: '#3a5a3a', opacity: 0.7 }}>{entry.category}</div>
                  </div>
                  {!entry.public && <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.5 }}>🔒</span>}
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: 16, color: '#3a5a3a', fontSize: 13 }}>
                  {t('没找到匹配的知识', 'No matching entries')}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hint text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        style={{
          position: 'fixed', bottom: 130, left: '50%', transform: 'translateX(-50%)',
          fontSize: 12, color: 'rgba(30,50,30,0.55)',
          textShadow: '0 1px 3px rgba(255,255,255,0.7)',
          whiteSpace: 'nowrap', zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        {t('✨ 悬停在花朵上探索知识', '✨ Hover over flowers to explore')}
      </motion.p>
    </div>
  )
}
