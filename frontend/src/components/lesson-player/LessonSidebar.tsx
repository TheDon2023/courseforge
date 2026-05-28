import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  CheckCircle2,
  Circle,
  Play,
} from 'lucide-react'
import type { Course } from './types'
import { getCompletedLessonsCount, getTotalLessonsCount, isLessonCompleted } from './data'

interface LessonSidebarProps {
  course: Course
  currentLessonId: string
  isOpen: boolean
  onToggle: () => void
  isMobileOpen: boolean
  onMobileClose: () => void
}

interface ModuleSectionProps {
  module: Course['modules'][number]
  moduleIndex: number
  currentLessonId: string
  courseId: string
  onLessonClick: (lessonId: string) => void
  defaultOpen: boolean
}

function ModuleSection({
  module,
  moduleIndex,
  currentLessonId,
  courseId,
  onLessonClick,
  defaultOpen,
}: ModuleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen)

  useEffect(() => {
    if (defaultOpen) setIsExpanded(true)
  }, [defaultOpen])

  const completedCount = module.lessons.filter((l) => isLessonCompleted(courseId, l.id)).length

  return (
    <div style={{ borderBottom: '1px solid rgba(10, 46, 82, 0.06)' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between transition-colors"
        style={{
          padding: 'var(--space-sm) var(--space-sm)',
          backgroundColor: 'transparent',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 119, 182, 0.04)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <span
            className="truncate"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 300,
              color: 'var(--deep-ink)',
            }}
          >
            {moduleIndex + 1}. {module.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.6875rem',
              color: 'var(--stone)',
            }}
          >
            {completedCount}/{module.lessons.length}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={14} style={{ color: 'var(--stone)' }} />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
            className="overflow-hidden"
          >
            <div style={{ paddingLeft: 'var(--space-lg)', paddingBottom: 'var(--space-sm)' }}>
              {module.lessons.map((lesson) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  courseId={courseId}
                  isCurrent={lesson.id === currentLessonId}
                  onClick={() => onLessonClick(lesson.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface LessonItemProps {
  lesson: Course['modules'][number]['lessons'][number]
  courseId: string
  isCurrent: boolean
  onClick: () => void
}

function LessonItem({ lesson, courseId, isCurrent, onClick }: LessonItemProps) {
  const completed = isLessonCompleted(courseId, lesson.id)

  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-2 text-left transition-colors"
      style={{
        padding: '6px var(--space-sm)',
        borderRadius: '6px',
        backgroundColor: 'transparent',
        borderLeft: isCurrent ? '2px solid var(--azure)' : '2px solid transparent',
        marginLeft: '-2px',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 119, 182, 0.04)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <div className="mt-0.5 flex-shrink-0">
        {completed ? (
          <CheckCircle2 size={14} style={{ color: 'var(--azure)' }} />
        ) : isCurrent ? (
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Play size={14} style={{ color: 'var(--azure)', marginLeft: '1px' }} />
          </motion.div>
        ) : (
          <Circle size={14} style={{ color: 'var(--stone)' }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="truncate"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.8125rem',
            fontWeight: isCurrent ? 400 : 300,
            color: isCurrent ? 'var(--azure)' : 'var(--slate)',
            lineHeight: 1.4,
          }}
        >
          {lesson.title}
        </p>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6875rem',
            color: 'var(--stone)',
          }}
        >
          {lesson.duration}
        </span>
      </div>
    </button>
  )
}

export default function LessonSidebar({
  course,
  currentLessonId,
  isOpen,
  onToggle,
  isMobileOpen,
  onMobileClose,
}: LessonSidebarProps) {
  const navigate = useNavigate()
  const completedCount = getCompletedLessonsCount(course)
  const totalCount = getTotalLessonsCount(course)
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  let currentModuleIndex = 0
  for (let mi = 0; mi < course.modules.length; mi++) {
    if (course.modules[mi].lessons.some((l) => l.id === currentLessonId)) {
      currentModuleIndex = mi
      break
    }
  }

  const handleLessonClick = (lessonId: string) => {
    navigate(`/app/course/${course.id}/lesson/${lessonId}`)
    onMobileClose()
  }

  const allLessons = course.modules.flatMap((m) => m.lessons)
  const currentIdx = allLessons.findIndex((l) => l.id === currentLessonId)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  const sidebarContent = (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Course Title */}
      <div style={{ padding: 'var(--space-md)' }}>
        <h2
          className="truncate font-display"
          style={{
            fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
            color: 'var(--deep-ink)',
            fontWeight: 400,
            lineHeight: 1.3,
            marginBottom: 'var(--space-sm)',
          }}
        >
          {course.title}
        </h2>
        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 overflow-hidden rounded-full"
            style={{ height: '4px', backgroundColor: 'rgba(10, 46, 82, 0.08)' }}
          >
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ background: 'var(--gradient-accent)' }}
            />
          </div>
        </div>
        <p
          className="mt-1"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6875rem',
            color: 'var(--stone)',
          }}
        >
          {completedCount}/{totalCount} lessons
        </p>
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          backgroundColor: 'rgba(10, 46, 82, 0.06)',
          margin: '0 var(--space-md)',
        }}
      />

      {/* Module List */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: 'var(--space-sm) var(--space-md)' }}
      >
        {course.modules.map((mod, mi) => (
          <ModuleSection
            key={mod.id}
            module={mod}
            moduleIndex={mi}
            currentLessonId={currentLessonId}
            courseId={course.id}
            onLessonClick={handleLessonClick}
            defaultOpen={mi === currentModuleIndex}
          />
        ))}
      </div>

      {/* Bottom Navigation */}
      <div style={{ padding: 'var(--space-md)', borderTop: '1px solid rgba(10, 46, 82, 0.06)' }}>
        <div className="flex gap-2">
          <button
            onClick={() => prevLesson && handleLessonClick(prevLesson.id)}
            disabled={!prevLesson}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-sm transition-all"
            style={{
              backgroundColor: prevLesson ? 'var(--parchment)' : 'rgba(10, 46, 82, 0.04)',
              border: '1px solid rgba(10, 46, 82, 0.08)',
              color: prevLesson ? 'var(--deep-ink)' : 'var(--stone)',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: '0.75rem',
              cursor: prevLesson ? 'pointer' : 'not-allowed',
              opacity: prevLesson ? 1 : 0.5,
            }}
            title={prevLesson?.title || ''}
          >
            <ChevronLeft size={14} />
            <span className="truncate">Prev</span>
          </button>
          <button
            onClick={() => nextLesson && handleLessonClick(nextLesson.id)}
            disabled={!nextLesson}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-sm transition-all"
            style={{
              background: nextLesson ? 'var(--gradient-accent)' : 'rgba(10, 46, 82, 0.04)',
              color: nextLesson ? 'var(--deep-ink)' : 'var(--stone)',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: '0.75rem',
              cursor: nextLesson ? 'pointer' : 'not-allowed',
              opacity: nextLesson ? 1 : 0.5,
            }}
            title={nextLesson?.title || ''}
          >
            <span className="truncate">Next</span>
            <ChevronRightIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Toggle Button */}
      <button
        onClick={onToggle}
        className="hidden lg:flex fixed z-[25] items-center justify-center rounded-r-lg transition-all"
        style={{
          top: '80px',
          left: isOpen ? '280px' : '0',
          width: '20px',
          height: '40px',
          backgroundColor: 'var(--warm-sand)',
          border: '1px solid rgba(10, 46, 82, 0.08)',
          borderLeft: 'none',
          color: 'var(--slate)',
          cursor: 'pointer',
          transitionDuration: '300ms',
          transitionTimingFunction: 'var(--ease-out)',
        }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronLeft size={14} />
        </motion.div>
      </button>

      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[25] bg-black/20 lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div
        className="hidden lg:flex flex-col flex-shrink-0 sticky top-0 overflow-hidden transition-all"
        style={{
          top: '64px',
          height: 'calc(100dvh - 64px)',
          width: isOpen ? '280px' : '0',
          backgroundColor: 'var(--warm-sand)',
          borderRight: '1px solid rgba(10, 46, 82, 0.06)',
          transitionDuration: '300ms',
          transitionTimingFunction: 'var(--ease-out)',
        }}
      >
        {isOpen && sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
            className="fixed left-0 top-0 z-[26] flex flex-col lg:hidden"
            style={{
              top: '64px',
              width: '85vw',
              maxWidth: '320px',
              height: 'calc(100dvh - 64px)',
              backgroundColor: 'var(--warm-sand)',
              borderRight: '1px solid rgba(10, 46, 82, 0.06)',
            }}
          >
            {/* Mobile Header with close */}
            <div className="flex items-center justify-between lg:hidden" style={{ padding: 'var(--space-md)' }}>
              <h2
                className="truncate font-display"
                style={{
                  fontSize: '1rem',
                  color: 'var(--deep-ink)',
                  fontWeight: 400,
                  maxWidth: '200px',
                }}
              >
                {course.title}
              </h2>
              <button
                onClick={onMobileClose}
                className="rounded-lg p-1 transition-colors hover:bg-[rgba(10,46,82,0.04)]"
                style={{ color: 'var(--stone)' }}
              >
                <ChevronLeft size={20} />
              </button>
            </div>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
