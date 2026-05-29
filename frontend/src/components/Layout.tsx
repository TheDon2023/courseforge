import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { useTheme } from '../hooks/use-theme'

export default function Layout() {
  const { theme } = useTheme()

  useEffect(() => {
    document.body.style.backgroundColor = theme === 'dark' ? '#000000' : '#FDFBF6'
    document.body.style.color = theme === 'dark' ? '#FFFFFF' : '#0A2E52'
  }, [theme])

  return (
    <div className={theme === 'dark' ? 'dark' : 'light'} style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Navbar theme={theme} />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

