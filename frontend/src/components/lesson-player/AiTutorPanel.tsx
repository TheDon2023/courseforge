import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Send, User, AlertCircle, Zap } from 'lucide-react'
import type { ChatMessage } from './types'
import { callOpenRouterWithFallback } from '../../lib/AiProvider'

interface AiTutorPanelProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  courseTitle: string
  lessonId: string
  lessonTitle: string
  lessonContent: string
}

// Build contextual demo responses using the actual lesson title
function buildDemoResponses(lessonTitle: string): Record<string, string> {
  return {
    'Explain this concept': `I'd be happy to explain a key concept from "${lessonTitle}"!\n\nThink of the main ideas in this lesson like building blocks. Each concept connects to form a bigger picture. The core principle is breaking complex topics into smaller, manageable pieces that each have a specific purpose. When you understand each piece, the whole topic becomes much clearer.\n\nWould you like me to go deeper into any specific part?`,
    'Give me an example': `Here's a practical example related to "${lessonTitle}":\n\nImagine you're teaching this concept to a friend who has never heard of it before. You'd start with the most basic idea, show them how it works in a real situation, then gradually build up to the more complex parts.\n\nFor instance, start with: "What problem does this solve?" → "How does it work step by step?" → "What happens if we change one piece?"\n\nThis same approach works for mastering any topic!`,
    'Quiz me on this': `Here's a quick quiz question about "${lessonTitle}":\n\n**What is the PRIMARY purpose or main takeaway of this lesson?**\n\nA) To memorize technical definitions\nB) To understand how the concepts work and apply them\nC) To learn the history of the topic\nD) To compare different unrelated ideas\n\nTake a moment to think about it, then tell me your answer!`,
    'Simplify this': `Let me simplify the key ideas from "${lessonTitle}":\n\nThink of it like this:\n\n1. There's a problem or question this lesson addresses\n2. The core concept is the solution or explanation\n3. The details support and expand on that core idea\n\nStart by identifying: "What problem does this solve?" Once you get that, the rest of the details will fall into place naturally.\n\nWould you like me to break down a specific concept from this lesson?`,
  }
}

const QUICK_CHIPS = ['Explain this concept', 'Give me an example', 'Quiz me on this', 'Simplify this']

export default function AiTutorPanel({
  isOpen,
  onClose,
  courseTitle,
  lessonTitle,
  lessonContent,
}: AiTutorPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Check for API key
  useEffect(() => {
    const key = localStorage.getItem('courseforge_openrouter_api_key')
    setHasApiKey(!!key && key.length > 0)
  }, [isOpen])

  // Send system message when panel opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        role: 'system',
        content: `Hello! I'm your AI tutor for **${lessonTitle}**. Ask me anything about this lesson, or try one of the quick actions below.`,
        timestamp: new Date(),
      }
      setMessages([systemMessage])
    }
  }, [isOpen, lessonTitle])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Build system prompt for API
  const buildSystemPrompt = useCallback(() => {
    return `You are a helpful and knowledgeable tutor teaching "${courseTitle}". The current lesson is "${lessonTitle}". Here is the lesson content: ${lessonContent || 'General programming lesson'}. Provide clear, concise explanations. Use examples when helpful. Keep responses under 200 words unless asked for more detail.`
  }, [courseTitle, lessonTitle, lessonContent])

  // Convert messages for API
  const buildApiMessages = useCallback(
    (userMessage: string) => {
      const history = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))

      return [
        { role: 'system' as const, content: buildSystemPrompt() },
        ...history,
        { role: 'user' as const, content: userMessage },
      ]
    },
    [messages, buildSystemPrompt]
  )

  // Simulate typewriter streaming effect
  const streamResponse = useCallback((fullText: string, messageId: string) => {
    const chars = fullText.split('')
    let index = 0

    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      },
    ])

    const interval = setInterval(() => {
      index++
      if (index >= chars.length) {
        clearInterval(interval)
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, content: fullText, isStreaming: false } : m))
        )
        setIsLoading(false)
        return
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, content: chars.slice(0, index).join('') } : m))
      )
    }, 12)

    return () => clearInterval(interval)
  }, [])

  // Send message handler
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return

      setError(null)
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput('')
      setIsLoading(true)

      // Check if this matches a quick chip
      const trimmedText = text.trim()
      const matchedChip = QUICK_CHIPS.find((chip) => chip.toLowerCase() === trimmedText.toLowerCase())

      if (!hasApiKey) {
        // Use contextual demo responses based on actual lesson title
        const demoResponses = buildDemoResponses(lessonTitle)
        const responseText = matchedChip
          ? demoResponses[matchedChip]
          : `That's a great question about "${lessonTitle}"!\n\nIn a real session with an API key configured, I would provide a detailed, context-aware answer based on the lesson content.\n\nFor now, try clicking one of the quick action buttons below for a demo response.`

        setTimeout(() => {
          streamResponse(responseText, `assistant-${Date.now()}`)
        }, matchedChip ? 300 : 500)
        return
      }

      // Real API call with model fallback
      const apiKey = localStorage.getItem('courseforge_openrouter_api_key') || ''

      // Build chip-specific prompt for better AI responses
      let userPrompt = trimmedText
      if (matchedChip === 'Explain this concept') {
        userPrompt = `Explain the main concepts from this lesson in clear, simple terms. Use analogies where helpful. Lesson: "${lessonTitle}". Content: ${lessonContent || 'General lesson'}. Keep it under 200 words.`
      } else if (matchedChip === 'Give me an example') {
        userPrompt = `Provide a practical, real-world example that illustrates the key concepts from "${lessonTitle}". Make it concrete and easy to understand. Content: ${lessonContent || 'General lesson'}. Keep it under 200 words.`
      } else if (matchedChip === 'Quiz me on this') {
        userPrompt = `Generate one multiple-choice quiz question about "${lessonTitle}" with 4 options (A, B, C, D), mark the correct answer, and provide a brief explanation. Make it specific to the lesson content, not generic. Content: ${lessonContent || 'General lesson'}. Format: **Question:** ... A) ... B) ... C) ... D) ... **Correct:** X **Explanation:** ...`
      } else if (matchedChip === 'Simplify this') {
        userPrompt = `Simplify the key ideas from "${lessonTitle}" as if explaining to a beginner. Break it down into 3-4 simple steps. Content: ${lessonContent || 'General lesson'}. Keep it under 150 words.`
      }

      try {
        const apiMessages = buildApiMessages(userPrompt).map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const content = await callOpenRouterWithFallback(apiKey, apiMessages)

        streamResponse(content || 'Sorry, I could not generate a response.', `assistant-${Date.now()}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'An error occurred'
        console.error('[AiTutor] All models failed:', msg)
        setError('AI service temporarily unavailable. Please try again in a moment.')
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: 'AI service temporarily unavailable. Please try again in a moment.',
            timestamp: new Date(),
          },
        ])
        setIsLoading(false)
      }
    },
    [hasApiKey, isLoading, buildApiMessages, streamResponse, lessonTitle]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleChipClick = (chip: string) => {
    sendMessage(chip)
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
                <Sparkles size={20} style={{ color: 'var(--azure)' }} />
                <h3
                  className="font-display"
                  style={{
                    fontSize: 'clamp(1.125rem, 1.5vw, 1.25rem)',
                    color: 'var(--deep-ink)',
                    fontWeight: 400,
                  }}
                >
                  AI Tutor
                </h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 transition-colors hover:bg-[rgba(10,46,82,0.04)]"
                style={{ color: 'var(--stone)' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div
              ref={chatContainerRef}
              className="flex flex-1 flex-col gap-3 overflow-y-auto"
              style={{ padding: 'var(--space-md)' }}
            >
              {/* No API key warning */}
              {!hasApiKey && (
                <div
                  className="mb-2 rounded-lg p-3"
                  style={{
                    backgroundColor: 'rgba(0, 180, 216, 0.06)',
                    border: '1px solid rgba(0, 180, 216, 0.15)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.8125rem',
                      fontWeight: 300,
                      color: 'var(--slate)',
                      lineHeight: 1.5,
                    }}
                  >
                    Add your OpenRouter API key in{' '}
                    <strong style={{ color: 'var(--azure)' }}>Settings</strong> for full AI responses.
                    Until then, enjoy demo responses from the quick action buttons below!
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: msg.role === 'user' ? 'var(--azure)' : 'var(--warm-sand)',
                    }}
                  >
                    {msg.role === 'user' ? (
                      <User size={14} color="#FFFFFF" />
                    ) : (
                      <Sparkles size={14} style={{ color: 'var(--azure)' }} />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className="max-w-[85%]"
                    style={{
                      backgroundColor:
                        msg.role === 'user'
                          ? 'var(--azure)'
                          : msg.role === 'system'
                            ? 'rgba(0, 180, 216, 0.06)'
                            : 'var(--warm-sand)',
                      color: msg.role === 'user' ? '#FFFFFF' : 'var(--deep-ink)',
                      borderRadius:
                        msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      padding: 'var(--space-sm) var(--space-md)',
                      lineHeight: 1.6,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        fontWeight: 300,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.role === 'system' ? (
                        <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      ) : (
                        msg.content
                      )}
                    </p>
                    {msg.isStreaming && (
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        style={{
                          display: 'inline-block',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--azure)',
                          marginLeft: '4px',
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-2">
                  <div
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'var(--warm-sand)' }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Zap size={14} style={{ color: 'var(--azure)' }} />
                    </motion.div>
                  </div>
                  <div
                    className="flex items-center gap-1"
                    style={{
                      backgroundColor: 'var(--warm-sand)',
                      borderRadius: '12px 12px 12px 4px',
                      padding: 'var(--space-sm) var(--space-md)',
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--azure)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div
                  className="flex items-center gap-2 rounded-lg p-3"
                  style={{
                    backgroundColor: 'rgba(230, 57, 70, 0.06)',
                    border: '1px solid rgba(230, 57, 70, 0.15)',
                  }}
                >
                  <AlertCircle size={16} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.8125rem',
                      fontWeight: 300,
                      color: 'var(--accent-red)',
                    }}
                  >
                    {error}
                  </p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Chips */}
            <div
              className="flex flex-wrap gap-2"
              style={{ padding: '0 var(--space-md) var(--space-sm)' }}
            >
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  disabled={isLoading}
                  className="rounded-full px-3.5 py-1.5 text-sm transition-colors"
                  style={{
                    backgroundColor: 'var(--warm-sand)',
                    color: 'var(--deep-ink)',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    fontSize: '0.8125rem',
                    border: '1px solid transparent',
                    opacity: isLoading ? 0.5 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 119, 182, 0.08)'
                      e.currentTarget.style.borderColor = 'rgba(0, 119, 182, 0.15)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--warm-sand)'
                    e.currentTarget.style.borderColor = 'transparent'
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2"
              style={{
                padding: 'var(--space-md)',
                borderTop: '1px solid rgba(10, 46, 82, 0.06)',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this lesson..."
                disabled={isLoading}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-2"
                style={{
                  border: '1px solid rgba(10, 46, 82, 0.12)',
                  color: 'var(--deep-ink)',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 0 0 3px transparent',
                }}
              />
              <motion.button
                type="submit"
                disabled={!input.trim() || isLoading}
                whileHover={{ scale: input.trim() && !isLoading ? 1.05 : 1 }}
                whileTap={{ scale: input.trim() && !isLoading ? 0.95 : 1 }}
                className="flex items-center justify-center rounded-xl"
                style={{
                  width: '40px',
                  height: '40px',
                  background: input.trim() && !isLoading ? 'var(--gradient-accent)' : 'var(--warm-sand)',
                  color: input.trim() && !isLoading ? 'var(--deep-ink)' : 'var(--stone)',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'all 200ms ease-out',
                }}
              >
                <Send size={18} />
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
