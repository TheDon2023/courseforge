import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  onCreateCourse: () => void;
}

const easeOut = [0.4, 0, 0.2, 1] as [number, number, number, number];

export default function EmptyState({ onCreateCourse }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 text-center"
      style={{
        minHeight: 'calc(100dvh - 64px)',
        backgroundColor: 'var(--abyss)',
      }}
    >
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: easeOut }}
        className="font-display"
        style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          color: 'var(--ice)',
          fontWeight: 400,
          letterSpacing: '-0.015em',
        }}
      >
        Your Learning Journey
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: easeOut }}
        className="mt-4 max-w-[400px]"
        style={{
          color: 'var(--cyan)',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          lineHeight: 1.6,
          fontSize: '1rem',
        }}
      >
        Start by turning a YouTube channel into your first course.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.9, ease: easeOut }}
        className="mt-10"
      >
        <motion.img
          src="/course-empty.png"
          alt="Empty state illustration"
          className="mx-auto"
          style={{ maxWidth: '400px', width: '100%' }}
          animate={{ y: [-6, 6, -6] }}
          transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity }}
        />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 1.1, ease: easeOut }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onCreateCourse}
        className="mt-10 inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-normal transition-shadow"
        style={{
          background: 'var(--gradient-accent)',
          color: 'var(--deep-ink)',
          fontFamily: "'Inter', sans-serif",
          boxShadow: '0 4px 24px rgba(0, 180, 216, 0.25)',
        }}
      >
        <Plus size={20} strokeWidth={2.5} />
        Create Your First Course
      </motion.button>
    </div>
  );
}
