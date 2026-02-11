'use client'
import { createContext, useContext, useState } from 'react'

export type Lang = 'zh' | 'en'

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'zh',
  setLang: () => {},
})

export const useLang = () => useContext(LangContext)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  )
}
