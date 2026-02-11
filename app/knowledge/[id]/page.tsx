import { notFound } from 'next/navigation'
import entries from '@/data/entries.json'
import type { KnowledgeEntry } from '@/types'
import { KnowledgePageClient } from './client'

const allEntries = entries as KnowledgeEntry[]

export function generateStaticParams() {
  return allEntries.map(e => ({ id: e.id }))
}

export default function KnowledgePage({ params }: { params: { id: string } }) {
  const entry = allEntries.find(e => e.id === params.id)
  if (!entry) notFound()
  return <KnowledgePageClient entry={entry} />
}
