'use client'

import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const TerrainViewerDynamic = dynamic(
  () => import('@/components/TerrainViewer').then(m => ({ default: m.TerrainViewer })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: '100%',
          height: '100vh',
          background: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏔️</div>
          <p style={{ color: '#888', fontSize: 14 }}>正在加载地形数据...</p>
        </div>
      </div>
    ),
  }
)

interface MountainPageClientProps {
  mountainId: string
}

export function MountainPageClient({ mountainId }: MountainPageClientProps) {
  const router = useRouter()

  return (
    <TerrainViewerDynamic
      mountainId={mountainId}
      onBack={() => router.push('/mountains')}
    />
  )
}
