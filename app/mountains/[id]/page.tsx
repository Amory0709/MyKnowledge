import { notFound } from 'next/navigation'
import mountains from '@/public/terrain/mountains.json'
import { MountainPageClient } from './client'

const mountainList = mountains as { id: string }[]

export function generateStaticParams() {
  return mountainList.map(m => ({ id: m.id }))
}

export default function MountainPage({ params }: { params: { id: string } }) {
  const exists = mountainList.some(m => m.id === params.id)
  if (!exists) notFound()
  return <MountainPageClient mountainId={params.id} />
}
