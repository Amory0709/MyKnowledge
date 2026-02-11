export interface KnowledgeEntry {
  id: string
  title: string
  titleEn?: string
  category: string
  categoryEn?: string
  tags: string[]
  public: boolean
  componentType: string
  summary: string
  summaryEn?: string
  emoji?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  readTime?: number
  data: Record<string, unknown>
}

export interface FunFact {
  id: number
  title: string
  content: string
  icon: string
}

export interface ColorData {
  r: number
  g: number
  b: number
  h: number
  s: number
  l: number
  hex: string
}
