import { useState, useEffect, useCallback } from 'react'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'courseforge_theme'
const THEME_EVENT = 'courseforge-theme-change'

const DARK_VARS: Record<string, string> = {
  // Dark theme: black / gray / white while preserving existing gradients and layout.
  '--abyss': '#000000',
  '--deep': '#0B0B0B',
  '--navy': '#151515',
  '--ice': '#FFFFFF',
  '--cyan': '#FFFFFF',
  '--sky': '#E5E5E5',
  '--aqua': '#D4D4D4',
  '--mint': '#F5F5F5',
  '--stone': '#D1D5DB',
  '--deep-ink': '#000000',
  '--overlay-dark': 'rgba(0, 0, 0, 0.72)',
}

const LIGHT_VARS: Record<string, string> = {
  '--abyss': '#FDFBF6',
  '--deep': '#F4F0E8',
  '--navy': '#EAF4F8',
  '--ice': '#0A2E52',
  '--cyan': '#245B78',
  '--sky': '#0077B6',
  '--aqua': '#00A6C8',
  '--mint': '#007C70',
  '--overlay-dark': 'rgba(255, 255, 255, 0.72)',
}

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
  const body = document.body
  const vars = theme === 'light' ? LIGHT_VARS : DARK_VARS

  root.classList.toggle('light', theme === 'light')
  root.classList.toggle('dark', theme === 'dark')
  root.setAttribute('data-theme', theme)

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  body.style.backgroundColor = theme === 'light' ? '#FDFBF6' : '#000000'
  body.style.color = theme === 'light' ? '#0A2E52' : '#FFFFFF'

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

