'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'dark' | 'cream' | 'colorful'

interface ThemeContextType {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('mk-theme') as Theme | null
    if (saved && ['dark', 'cream', 'colorful'].includes(saved)) {
      setThemeState(saved)
      document.documentElement.setAttribute('data-theme', saved)
    }
    setMounted(true)
  }, [])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem('mk-theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
