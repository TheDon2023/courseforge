import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Sparkles, BookOpen, MessageCircle, Trophy, Settings } from 'lucide-react'

const STEPS = [
  {
    title: 'Welcome to CourseForge',
    description: 'Turn any YouTube channel or playlist into an interactive AI-powered course. Your personal tutor is ready to help you learn.',
    icon: Sparkles,
  },
  {
    title: 'Create Your First Course',
    description: 'Paste a YouTube channel URL (@channel) or playlist URL (?list=PL...) on the dashboard. Add your free API keys in Settings to unlock full AI features.',
    icon: BookOpen,
  },
  {
    title: 'Learn with AI Tutor',
    description: 'Open any lesson and click "AI Tutor" to chat about the content. Ask for explanations, examples, quizzes, or simplifications.',
    icon: MessageCircle,
  },
  {
    title: 'Track Your Progress',
    description: 'Mark lessons complete, take notes, earn quiz scores, and watch your progress bar fill up. All your data stays in your browser.',
    icon: Trophy,
  },
  {
    title: 'Add Your API Keys',
    description: 'For the best experience, add a free YouTube API key and OpenRouter API key in Settings. This enables real channel courses and AI-generated lesson guides.',
    icon: Settings,
  },
]

export default function OnboardingOverlay() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem('courseforge_onboarding_seen')
    if (!seen) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('courseforge_onboarding_seen', 'true')
    setShow(false)
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      handleDismiss()
    }
  }

  const handlePrev = () => {
    if (step > 0) setStep(step - 1)
  }

  if (!show) return null

  const current = STEPS[step]
  const Icon = current.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative mx-4 w-full max-w-md rounded-2xl border border-white/10 p-8 shadow-2xl"
          style={{ backgroundColor: '#0B1220' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>

          {/* Progress dots */}
          <div className="mb-6 flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? '24px' : '8px',
                  backgroundColor: i === step ? '#00FF00' : i < step ? '#00FF0060' : '#ffffff20',
                }}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ backgroundColor: '#00FF0015', border: '1px solid #00FF0030' }}
            >
              <Icon size={28} style={{ color: '#00FF00' }} />
            </div>
          </div>

          {/* Content */}
          <h2
            className="mb-3 text-center text-xl font-semibold"
            style={{ color: '#00FF00', fontFamily: "'Inter', sans-serif" }}
          >
            {current.title}
          </h2>
          <p
            className="mb-8 text-center text-sm leading-relaxed"
            style={{ color: '#94A3B8', fontFamily: "'Inter', sans-serif" }}
          >
            {current.description}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={step === 0}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors disabled:opacity-30 hover:bg-white/5"
              style={{ color: '#94A3B8' }}
            >
              <ChevronLeft size={16} />
              Back
            </button>

            <span className="text-xs" style={{ color: '#64748B' }}>
              {step + 1} / {STEPS.length}
            </span>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
              style={{
                backgroundColor: '#00FF0020',
                color: '#00FF00',
                border: '1px solid #00FF0040',
              }}
            >
              {step === STEPS.length - 1 ? 'Get Started' : 'Next'}
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
