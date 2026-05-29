import { useState, useEffect, useCallback } from 'react'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'courseforge_theme'
const THEME_EVENT = 'courseforge-theme-change'

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage unavailable
  }

  return 'dark'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement

  root.classList.toggle('light', theme === 'light')
  root.classList.toggle('dark', theme === 'dark')
  root.setAttribute('data-theme', theme)

  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore
  }
}

function broadcastTheme(theme: Theme) {
  try {
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }))
  } catch {
    // ignore
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const onThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<Theme>
      const next = customEvent.detail

      if (next === 'light' || next === 'dark') {
        setThemeState(next)
        applyTheme(next)
      }
    }

    window.addEventListener(THEME_EVENT, onThemeChange)
    return () => window.removeEventListener(THEME_EVENT, onThemeChange)
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    applyTheme(newTheme)
    broadcastTheme(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev: Theme) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      broadcastTheme(next)
      return next
    })
  }, [])

  return { theme, setTheme, toggleTheme }
}
