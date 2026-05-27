import { useState, useEffect } from 'react'
import { CheckCircle, Star, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CompletionCheckpointProps {
  isComplete: boolean
  onComplete: () => void
  onTakeQuiz?: () => void
  hasQuiz?: boolean
}

function FloatingStar({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [0, -60, -100, -120],
        x: [0, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40, 0],
        scale: [0.5, 1.2, 1, 0.8],
      }}
      transition={{ duration: 1.8, delay, ease: 'easeOut' }}
      className="pointer-events-none absolute"
      style={{ left: `${40 + Math.random() * 20}%`, top: '40%' }}
    >
      <Star size={18} fill="var(--accent-gold)" color="var(--accent-gold)" />
    </motion.div>
  )
}

export default function CompletionCheckpoint({
  isComplete,
  onComplete,
  onTakeQuiz,
  hasQuiz = true,
}: CompletionCheckpointProps) {
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (isComplete && showCelebration) {
      const timer = setTimeout(() => setShowCelebration(false), 2500)
      return () => clearTimeout(timer)
    }
  }, [isComplete, showCelebration])

  const handleClick = () => {
    if (!isComplete) {
      onComplete()
      setShowCelebration(true)
    }
  }

  return (
    <div
      className="relative text-center"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: 'var(--space-lg)',
        border: '1px solid rgba(10, 46, 82, 0.06)',
        marginTop: 'var(--space-md)',
      }}
    >
      <AnimatePresence>
        {showCelebration && (
          <>
            {[0, 0.15, 0.3, 0.45, 0.6].map((delay, i) => (
              <FloatingStar key={i} delay={delay} />
            ))}
          </>
        )}
      </AnimatePresence>

      <h3
        className="mb-2 font-display"
        style={{
          fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
          color: 'var(--deep-ink)',
          fontWeight: 400,
        }}
      >
        {isComplete ? 'Lesson Complete!' : 'Ready to move on?'}
      </h3>
      <p
        className="mb-4"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.875rem',
          fontWeight: 300,
          color: 'var(--stone)',
        }}
      >
        {isComplete
          ? 'Great job completing this lesson. Test your knowledge with a quiz!'
          : 'Mark this lesson as complete to track your progress.'}
      </p>

      {/* Action buttons */}
      <div className="flex flex-col items-center gap-3">
        {/* Mark Complete / Completed button */}
        <motion.button
          onClick={handleClick}
          disabled={isComplete}
          whileHover={!isComplete ? { scale: 1.02 } : {}}
          whileTap={!isComplete ? { scale: 0.98 } : {}}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-normal transition-all"
          style={{
            background: isComplete
              ? 'linear-gradient(135deg, #FFB703, #FFD670)'
              : 'var(--gradient-accent)',
            color: isComplete ? '#FFFFFF' : 'var(--deep-ink)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9375rem',
            cursor: isComplete ? 'default' : 'pointer',
            boxShadow: isComplete ? '0 4px 16px rgba(255, 183, 3, 0.3)' : '0 4px 16px rgba(0, 180, 216, 0.2)',
          }}
        >
          <motion.div
            initial={false}
            animate={isComplete ? { rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <CheckCircle size={20} />
          </motion.div>
          <span>{isComplete ? 'Completed!' : "I've completed this lesson"}</span>
          {isComplete && (
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            >
              <Star size={18} fill="#FFFFFF" />
            </motion.span>
          )}
        </motion.button>

        {/* Take Quiz button - shown when complete */}
        {isComplete && hasQuiz && onTakeQuiz && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={onTakeQuiz}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-normal transition-all"
            style={{
              background: 'linear-gradient(135deg, #0077B6, #48CAE4)',
              color: '#FFFFFF',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.9375rem',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 119, 182, 0.3)',
            }}
          >
            <HelpCircle size={20} />
            <span>Take Quiz</span>
          </motion.button>
        )}
      </div>
    </div>
  )
}
