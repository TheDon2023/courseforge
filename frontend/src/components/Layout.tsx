import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  const location = useLocation()

  const theme = useMemo(() => {
    const path = location.pathname
    if (path === '/' || path === '/app') return 'dark'
    return 'light'
  }, [location.pathname])

  useEffect(() => {
    document.body.style.backgroundColor = theme === 'dark' ? '#03045E' : '#FDFBF6'
    document.body.style.color = theme === 'dark' ? '#CAF0F8' : '#0A2E52'
  }, [theme])

  return (
    <div className={theme === 'dark' ? 'dark' : ''} style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Navbar theme={theme} />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
