import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Settings, Menu, X, Wifi, WifiOff, Loader2, Moon, Sun } from 'lucide-react'
import { testKimiConnection, testOpenRouterConnection, testYouTubeConnection } from '../lib/AiProvider'
import { maskKey } from '../lib/aiKeys'
import type { ConnectionTestResult } from '../lib/AiProvider'
import { StorageManager } from '../lib/storage'
import { useTheme } from '../hooks/use-theme'
import { useAuth } from '../hooks/use-auth'
import AuthModal from './AuthModal'

interface NavbarProps {
  theme?: string
}

export default function Navbar({ theme: _theme = 'dark' }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const auth = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const isHome = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8)
    }
    if (isHome) {
      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [isHome])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  void theme
  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'My Courses', href: '/#/app' },
  ]

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    setMobileMenuOpen(false)
  }

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all"
        style={{
          height: '64px',
          backgroundColor: isHome
            ? scrolled ? 'rgba(2, 62, 138, 0.95)' : 'transparent'
            : 'rgba(2, 62, 138, 0.95)',
          backdropFilter: isHome && !scrolled ? 'none' : 'blur(20px)',
          WebkitBackdropFilter: isHome && !scrolled ? 'none' : 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          transitionDuration: '300ms',
          transitionTimingFunction: 'var(--ease-out)',
        }}
      >
        <div
          className="mx-auto flex h-full items-center justify-between px-6"
          style={{ maxWidth: 'var(--max-width-lg)' }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="CourseForge" style={{ width: '32px', height: '32px' }} />
            <span
              className="font-display text-xl"
              style={{
                color: 'var(--ice)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
              }}
            >
              CourseForge
            </span>
          </Link>

          {/* Center nav links (desktop) */}
          <div className="hidden items-center gap-8 md:flex">
            {isHome && (
              <>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-sm font-light transition-colors hover:text-white"
                  style={{ color: 'var(--cyan)', fontFamily: "'Inter', sans-serif" }}
                >
                  How It Works
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-sm font-light transition-colors hover:text-white"
                  style={{ color: 'var(--cyan)', fontFamily: "'Inter', sans-serif" }}
                >
                  Features
                </button>
              </>
            )}
            {!isHome && navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-light transition-colors hover:text-white"
                style={{
                  color: location.pathname === link.href.replace('/#', '') ? 'var(--ice)' : 'var(--cyan)',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              to="/app"
              className="inline-flex items-center rounded-xl px-5 py-2 text-sm font-normal transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'var(--gradient-accent)',
                color: 'var(--deep-ink)',
                fontFamily: "'Inter', sans-serif",
                transitionDuration: '150ms',
              }}
            >
              Launch App
            </Link>
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-lg p-2 transition-colors"
              style={{ color: 'var(--cyan)' }}
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
              style={{ color: 'var(--cyan)' }}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Auth button */}
            {auth.isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-xs sm:inline" style={{ color: '#00FF00' }}>
                  {auth.user?.name}
                </span>
                <button
                  onClick={auth.logout}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
                  style={{ color: '#FF6B6B', border: '1px solid #FF6B6B40' }}
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#00FF0020', color: '#00FF00', border: '1px solid #00FF0040' }}
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="rounded-lg p-2 md:hidden"
            style={{ color: 'var(--ice)' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="flex flex-col gap-4 px-6 py-6 md:hidden"
            style={{
              backgroundColor: 'rgba(2, 62, 138, 0.98)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {isHome && (
              <>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-left text-sm font-light"
                  style={{ color: 'var(--cyan)' }}
                >
                  How It Works
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-left text-sm font-light"
                  style={{ color: 'var(--cyan)' }}
                >
                  Features
                </button>
              </>
            )}
            {!isHome && navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-light"
                style={{ color: 'var(--cyan)' }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/app"
              className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-normal"
              style={{
                background: 'var(--gradient-accent)',
                color: 'var(--deep-ink)',
              }}
            >
              Launch App
            </Link>
            <button
              onClick={() => { setSettingsOpen(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 text-sm font-light"
              style={{ color: 'var(--cyan)' }}
            >
              <Settings size={16} /> Settings
            </button>
          </div>
        )}
      </nav>

      {/* Settings Modal */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'var(--overlay-dark)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false); }}
        >
          <div
            className="w-full max-w-[640px] rounded-[20px] p-8"
            style={{
              backgroundColor: 'var(--abyss)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'var(--modal)',
            }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl" style={{ color: 'var(--ice)' }}>
                API Settings
              </h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg p-1 transition-colors hover:bg-white/10"
                style={{ color: 'var(--cyan)' }}
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            <ApiKeySettings onSave={() => { setSettingsOpen(false); navigate('/app'); }} />
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  )
}

interface ApiKeySettingsProps {
  onSave?: () => void;
}

type TestState = 'idle' | 'testing' | 'done';

function ApiKeySettings({ onSave }: ApiKeySettingsProps) {
  const [youtubeKey, setYoutubeKey] = useState('')
  const [openRouterKey, setOpenRouterKey] = useState('')
  const [kimiKey, setKimiKey] = useState('')
  const [showYt, setShowYt] = useState(false)
  const [showOr, setShowOr] = useState(false)
  const [showKimi, setShowKimi] = useState(false)

  // Connection test states
  const [ytTest, setYtTest] = useState<TestState>('idle');
  const [ytTestResult, setYtTestResult] = useState<ConnectionTestResult | null>(null);
  const [orTest, setOrTest] = useState<TestState>('idle');
  const [orTestResult, setOrTestResult] = useState<ConnectionTestResult | null>(null);
  const [kimiTest, setKimiTest] = useState<TestState>('idle');
  const [kimiTestResult, setKimiTestResult] = useState<ConnectionTestResult | null>(null);

  useEffect(() => {
    setYoutubeKey(StorageManager.getApiKey('youtube'))
    setOpenRouterKey(StorageManager.getApiKey('openrouter'))
    setKimiKey(StorageManager.getApiKey('kimi'))
    setShowYt(false)
    setShowOr(false)
    setShowKimi(false)
  }, [])

  const saveKeys = () => {
    StorageManager.setApiKey('youtube', youtubeKey)
    StorageManager.setApiKey('openrouter', openRouterKey)
    StorageManager.setApiKey('kimi', kimiKey)
    if (typeof onSave === 'function') {
      onSave()
    }
  }

  const runYouTubeTest = useCallback(async () => {
    setYtTest('testing');
    const result = await testYouTubeConnection(youtubeKey);
    setYtTestResult(result);
    setYtTest('done');
  }, [youtubeKey]);

  const runOpenRouterTest = useCallback(async () => {
    setOrTest('testing');
    const result = await testOpenRouterConnection(openRouterKey);
    setOrTestResult(result);
    setOrTest('done');
  }, [openRouterKey]);

  const runKimiTest = useCallback(async () => {
    setKimiTest('testing');
    const result = await testKimiConnection(kimiKey);
    setKimiTestResult(result);
    setKimiTest('done');
  }, [kimiKey]);

  const renderTestStatus = (test: TestState, result: ConnectionTestResult | null) => {
    if (test === 'testing') {
      return <Loader2 size={14} className="animate-spin" style={{ color: 'var(--cyan)' }} />;
    }
    if (test === 'done' && result) {
      if (result.status === 'connected') {
        return <span className="inline-flex items-center gap-1" style={{ color: '#68D391', fontSize: '0.6875rem' }}><Wifi size={12} /> Connected ({result.latencyMs}ms)</span>;
      }
      if (result.status === 'no_key') {
        return <span className="inline-flex items-center gap-1" style={{ color: 'var(--stone)', fontSize: '0.6875rem' }}><WifiOff size={12} /> No key</span>;
      }
      return <span className="inline-flex items-center gap-1" style={{ color: '#FC8181', fontSize: '0.6875rem' }} title={result.error}><WifiOff size={12} /> Failed</span>;
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* YouTube */}
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.15em]" style={{ color: 'var(--sky)', fontFamily: "'JetBrains Mono', monospace" }}>
          YouTube Data API v3 Key
        </label>
        <div className="relative">
          <input
            type={showYt ? 'text' : 'password'}
            value={youtubeKey}
            onChange={(e) => setYoutubeKey(e.target.value)}
            onBlur={saveKeys}
            placeholder="Enter your YouTube API key..."
            className="w-full rounded-xl px-4 py-3 pr-10 text-sm outline-none transition-all focus:ring-2"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ice)', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
          />
          <button onClick={() => setShowYt(!showYt)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--cyan)' }} aria-label={showYt ? 'Hide' : 'Show'}>
            {showYt ? <Settings size={14} /> : <Settings size={14} />}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span style={{ color: 'var(--stone)', fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace" }}>{maskKey(youtubeKey)}</span>
          <button onClick={runYouTubeTest} disabled={ytTest === 'testing'} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-colors hover:bg-white/10" style={{ color: 'var(--cyan)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {ytTest === 'testing' ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />} Test
          </button>
        </div>
        {renderTestStatus(ytTest, ytTestResult)}
      </div>

      {/* OpenRouter */}
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.15em]" style={{ color: 'var(--sky)', fontFamily: "'JetBrains Mono', monospace" }}>
          OpenRouter API Key
        </label>
        <div className="relative">
          <input
            type={showOr ? 'text' : 'password'}
            value={openRouterKey}
            onChange={(e) => setOpenRouterKey(e.target.value)}
            onBlur={saveKeys}
            placeholder="sk-or-v1-..."
            className="w-full rounded-xl px-4 py-3 pr-10 text-sm outline-none transition-all focus:ring-2"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ice)', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
          />
          <button onClick={() => setShowOr(!showOr)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--cyan)' }} aria-label={showOr ? 'Hide' : 'Show'}>
            {showOr ? <Settings size={14} /> : <Settings size={14} />}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span style={{ color: 'var(--stone)', fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace" }}>{maskKey(openRouterKey)}</span>
          <button onClick={runOpenRouterTest} disabled={orTest === 'testing'} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-colors hover:bg-white/10" style={{ color: 'var(--cyan)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {orTest === 'testing' ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />} Test
          </button>
        </div>
        {renderTestStatus(orTest, orTestResult)}
        <p className="mt-1.5 text-xs" style={{ color: 'var(--cyan)', opacity: 0.6 }}>
          Used to power the AI tutor. Get a free key at{' '}
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline transition-colors hover:text-white" style={{ color: 'var(--sky)' }}>openrouter.ai/keys</a>.
        </p>
      </div>

      {/* Kimi */}
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.15em]" style={{ color: 'var(--sky)', fontFamily: "'JetBrains Mono', monospace" }}>
          Kimi API Key (Recommended)
        </label>
        <div className="relative">
          <input
            type={showKimi ? 'text' : 'password'}
            value={kimiKey}
            onChange={(e) => setKimiKey(e.target.value)}
            onBlur={saveKeys}
            placeholder="sk-..."
            className="w-full rounded-xl px-4 py-3 pr-10 text-sm outline-none transition-all focus:ring-2"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ice)', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
          />
          <button onClick={() => setShowKimi(!showKimi)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--cyan)' }} aria-label={showKimi ? 'Hide' : 'Show'}>
            {showKimi ? <Settings size={14} /> : <Settings size={14} />}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span style={{ color: 'var(--stone)', fontSize: '0.6875rem', fontFamily: "'JetBrains Mono', monospace" }}>{maskKey(kimiKey)}</span>
          <button onClick={runKimiTest} disabled={kimiTest === 'testing'} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-colors hover:bg-white/10" style={{ color: 'var(--cyan)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {kimiTest === 'testing' ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />} Test
          </button>
        </div>
        {renderTestStatus(kimiTest, kimiTestResult)}
        <p className="mt-1.5 text-xs" style={{ color: 'var(--cyan)', opacity: 0.6 }}>
          Primary AI for quiz generation. Get a key at{' '}
          <a href="https://platform.moonshot.cn/" target="_blank" rel="noopener noreferrer" className="underline transition-colors hover:text-white" style={{ color: 'var(--sky)' }}>platform.moonshot.cn</a>.
        </p>
      </div>

      <button
        onClick={saveKeys}
        className="mt-2 inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-normal transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{ background: 'var(--gradient-accent)', color: 'var(--deep-ink)', fontFamily: "'Inter', sans-serif", transitionDuration: '150ms' }}
      >
        Save Keys
      </button>
    </div>
  )
}
