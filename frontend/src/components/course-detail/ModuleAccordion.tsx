import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Module } from '@/types/course';
import LessonRow from './LessonRow';

interface ModuleAccordionProps {
  module: Module;
  moduleIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleLessonComplete: (moduleIndex: number, lessonIndex: number) => void;
}

export default function ModuleAccordion({
  module,
  moduleIndex,
  isExpanded,
  onToggle,
  onToggleLessonComplete,
}: ModuleAccordionProps) {
  const completedCount = module.lessons.filter((l) => l.completed).length;
  const totalCount = module.lessons.length;
  const isCompleted = completedCount === totalCount;

  return (
    <motion.div
      style={{
        borderRadius: '16px',
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(10, 46, 82, 0.06)',
        boxShadow: '0 2px 12px rgba(10, 46, 82, 0.04)',
        marginBottom: 'var(--space-md)',
        overflow: 'hidden',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
        delay: moduleIndex * 0.1,
      }}
    >
      {/* Accordion Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3"
        style={{
          padding: 'var(--space-md) var(--space-md)',
          textAlign: 'left',
        }}
      >
        {/* Chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ flexShrink: 0 }}
        >
          <ChevronDown size={16} style={{ color: 'var(--stone)' }} />
        </motion.div>

        {/* Module number */}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--azure)',
            fontWeight: 400,
          }}
        >
          Module {moduleIndex + 1}
        </span>

        {/* Module title */}
        <h3
          className="flex-1 truncate"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(1.125rem, 1.5vw, 1.5rem)',
            fontWeight: 400,
            color: 'var(--deep-ink)',
          }}
        >
          {module.title.replace(/^Module \d+: /, '')}
        </h3>

        {/* Progress */}
        <span
          className="hidden shrink-0 sm:inline"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--stone)',
          }}
        >
          {completedCount}/{totalCount}
        </span>

        {/* Status badge */}
        <span
          className="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: isCompleted ? 'var(--accent-gold)' : 'rgba(0, 180, 216, 0.15)',
            color: 'var(--deep-ink)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.75rem',
          }}
        >
          {isCompleted ? 'Completed' : 'In Progress'}
        </span>
      </button>

      {/* Accordion Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
              opacity: { duration: 0.2, ease: 'easeOut' },
            }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                borderTop: '1px solid rgba(10, 46, 82, 0.06)',
                padding: 'var(--space-sm) 0',
              }}
            >
              {module.lessons.map((lesson, lessonIndex) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  lessonNumber={`${moduleIndex + 1}.${lessonIndex + 1}`}
                  moduleIndex={moduleIndex}
                  lessonIndex={lessonIndex}
                  onToggleComplete={onToggleLessonComplete}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
