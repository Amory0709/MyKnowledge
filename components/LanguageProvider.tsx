'use client'

import { createContext, useContext, useState } from 'react'

export type Lang = 'zh' | 'en'

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (zh: string, en: string) => string
}

const LangContext = createContext<LangContextType>({
  lang: 'zh',
  setLang: () => {},
  t: (zh) => zh,
})

export const useLang = () => useContext(LangContext)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('zh')
  const t = (zh: string, en: string) => lang === 'zh' ? zh : en
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}
