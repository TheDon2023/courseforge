import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Download, CheckCircle } from 'lucide-react'

interface NotesPanelProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  lessonId: string
  lessonTitle: string
}

export default function NotesPanel({ isOpen, onClose, courseId, lessonId, lessonTitle }: NotesPanelProps) {
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load notes on mount / lesson change
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(`courseforge_notes_${courseId}_${lessonId}`)
      setNotes(savedNotes || '')
    } catch {
      setNotes('')
    }
    setSaved(false)
  }, [courseId, lessonId])

  // Auto-save debounced
  const handleChange = useCallback(
    (value: string) => {
      setNotes(value)
      setSaved(false)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        try {
          localStorage.setItem(`courseforge_notes_${courseId}_${lessonId}`, value)
          setSaved(true)
        } catch {
          // Silently fail
        }
      }, 1000)
    },
    [courseId, lessonId]
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleDownload = () => {
    const blob = new Blob([`# Notes: ${lessonTitle}\n\n${notes}`], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notes-${lessonId}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[35] bg-black/20 lg:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
            className="fixed right-0 top-0 z-40 flex flex-col"
            style={{
              top: '64px',
              width: '100%',
              maxWidth: '420px',
              height: 'calc(100dvh - 64px)',
              backgroundColor: '#FFFFFF',
              borderLeft: '1px solid rgba(10, 46, 82, 0.08)',
              boxShadow: '-8px 0 32px rgba(10, 46, 82, 0.08)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: 'var(--space-md) var(--space-lg)',
                borderBottom: '1px solid rgba(10, 46, 82, 0.06)',
              }}
            >
              <div className="flex items-center gap-2">
                <BookOpen size={20} style={{ color: 'var(--azure)' }} />
                <h3
                  className="font-display"
                  style={{
                    fontSize: 'clamp(1.125rem, 1.5vw, 1.25rem)',
                    color: 'var(--deep-ink)',
                    fontWeight: 400,
                  }}
                >
                  Lesson Notes
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="rounded-lg p-2 transition-colors"
                  style={{ color: 'var(--stone)' }}
                  title="Download notes as .md"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 transition-colors hover:bg-[rgba(10,46,82,0.04)]"
                  style={{ color: 'var(--stone)' }}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex flex-1 flex-col" style={{ padding: 'var(--space-md)' }}>
              <textarea
                ref={textareaRef}
                value={notes}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={`Write your notes for this lesson...\n\n- Key concepts\n- Questions to review\n- Personal insights`}
                className="w-full flex-1 resize-none rounded-xl p-4 text-sm outline-none transition-all focus:ring-2"
                style={{
                  minHeight: '400px',
                  border: '1px solid rgba(10, 46, 82, 0.12)',
                  color: 'var(--deep-ink)',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  lineHeight: 1.7,
                  fontSize: '0.9375rem',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 0 0 3px transparent',
                }}
              />

              {/* Auto-save indicator */}
              <div className="mt-3 flex items-center justify-between">
                <AnimatePresence>
                  {saved && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-1.5"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.75rem',
                        color: 'var(--stone)',
                      }}
                    >
                      <CheckCircle size={12} />
                      <span>Auto-saved</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <span
                  className="ml-auto"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.6875rem',
                    color: 'var(--stone)',
                    opacity: 0.6,
                  }}
                >
                  {notes.length} characters
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
