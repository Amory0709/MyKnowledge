'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { useLang } from '@/components/LanguageProvider'
import entries from '@/data/entries.json'
import type { KnowledgeEntry } from '@/types'

// Load ThreeGarden only on client — Three.js requires browser APIs
const GardenCanvas = dynamic(() => import('@/components/ThreeGarden').then(m => ({ default: m.ThreeGarden })), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(180deg, #87CEEB 0%, #C8E8F5 60%, #6BAF3C 100%)',
      }}
    />
  ),
})

const allEntries = entries as KnowledgeEntry[]

export default function HomePage() {
  const router = useRouter()
  const { lang, setLang } = useLang()
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleEntryClick = (id: string) => {
    router.push(`/knowledge/${id}`)
  }

  const totalCount = allEntries.length

  return (
    <>
      {/* ── Full-viewport canvas backdrop ────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <GardenCanvas
          entries={allEntries}
          onEntryClick={handleEntryClick}
          searchFilter={search}
          lang={lang}
        />
      </div>

      {/* ── Floating top nav ─────────────────────────────────────────── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 2px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Logo / title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px', lineHeight: 1 }}>🌸</span>
          <span
            style={{
              fontWeight: 700,
              fontSize: '16px',
              letterSpacing: '0.02em',
              color: 'rgba(255,255,255,0.95)',
              textShadow: '0 1px 8px rgba(0,0,0,0.25)',
            }}
          >
            {lang === 'zh' ? '知识花园' : 'Knowledge Garden'}
          </span>
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.35)',
              color: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
              letterSpacing: '0.04em',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
          >
            {lang === 'zh' ? 'EN' : '中'}
          </button>

          <ThemeSwitcher />
        </div>
      </nav>

      {/* ── Bottom center: search pill ───────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          width: 'min(420px, 90vw)',
        }}
      >
        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '50px',
            background: 'rgba(255, 255, 255, 0.16)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.08) inset',
            cursor: 'text',
          }}
        >
          <span style={{ fontSize: '16px', opacity: 0.8 }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={lang === 'zh' ? '搜索知识花园...' : 'Search the garden...'}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.95)',
              fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Hint text */}
        {!search && (
          <p
            style={{
              textAlign: 'center',
              marginTop: '8px',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.06em',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          >
            {lang === 'zh'
              ? '点击花朵探索知识 · 搜索过滤'
              : 'Click a flower to explore · Type to filter'}
          </p>
        )}
      </div>

      {/* ── Bottom-right: entry count badge ──────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '20px',
          zIndex: 10,
          padding: '8px 14px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.14)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.28)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ fontSize: '14px' }}>🌱</span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.88)',
            letterSpacing: '0.04em',
            textShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        >
          {totalCount} {lang === 'zh' ? '条知识' : 'entries'}
        </span>
      </div>
    </>
  )
}
