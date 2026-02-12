'use client'

import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const MountainSelectorDynamic = dynamic(
  () => import('@/components/MountainSelector').then(m => ({ default: m.MountainSelector })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏔️</div>
          <p style={{ color: '#666', fontSize: 14 }}>加载山脉地图...</p>
        </div>
      </div>
    ),
  }
)

export default function MountainsPage() {
  const router = useRouter()

  return (
    <div style={{ position: 'relative' }}>
      {/* Back button */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          zIndex: 50,
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10,
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 13,
            color: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        >
          ← 花园
        </button>
      </div>

      <MountainSelectorDynamic onSelect={(id) => router.push(`/mountains/${id}`)} />
    </div>
  )
}
