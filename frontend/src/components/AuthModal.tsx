import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LogIn, UserPlus, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/use-auth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const auth = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await auth.login(email, password)
      } else {
        if (!name.trim()) {
          setError('Please enter your name.')
          setLoading(false)
          return
        }
        await auth.register(name, email, password)
      }
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'))
    setError('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative mx-4 w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl"
            style={{ backgroundColor: '#0B1220' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="mb-6 flex items-center gap-2">
              {mode === 'login' ? <LogIn size={22} style={{ color: '#00FF00' }} /> : <UserPlus size={22} style={{ color: '#00FF00' }} />}
              <h2 className="text-lg font-semibold" style={{ color: '#00FF00', fontFamily: "'Inter', sans-serif" }}>
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-[#00FF00]/40"
                    required
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-[#00FF00]/40"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-[#00FF00]/40"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#00FF00', color: '#0B1220' }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Toggle mode */}
            <div className="mt-4 text-center">
              <button
                onClick={toggleMode}
                className="text-xs transition-colors hover:text-white"
                style={{ color: '#94A3B8' }}
              >
                {mode === 'login'
                  ? "Don't have an account? Create one"
                  : 'Already have an account? Sign in'}
              </button>
            </div>

            {/* Guest mode note */}
            <div className="mt-3 text-center">
              <button
                onClick={onClose}
                className="text-xs transition-colors hover:text-white"
                style={{ color: '#64748B' }}
              >
                Continue as guest (courses saved locally)
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
