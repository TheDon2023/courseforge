/**
 * Unified Course Types — Single source of truth for all course data.
 *
 * All pages, components, and stores must use these types.
 * Do NOT create duplicate Course/Lesson types in other files.
 */

// ─── Lesson Guide ────────────────────────────────────────────────────────

export interface TermDefinition {
  term: string
  definition: string
}

export interface LessonGuide {
  overview: string
  learningObjectives: string[]
  keyConcepts: string[]
  detailedExplanation: string
  examples: string[]
  terminology: TermDefinition[]
  commonMistakes: string[]
  whyItMatters: string
  summary: string
  reviewChecklist: string[]
}

// ─── Quiz ────────────────────────────────────────────────────────────────

export type Difficulty = 'beginner' | 'intermediate' | 'applied'

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  difficulty: Difficulty
  conceptTested: string
  explanation: string
  wrongAnswerExplanations?: string[]
}

export interface Quiz {
  id: string
  lessonId: string
  provider: 'kimi' | 'openrouter' | 'fallback'
  model?: string
  aiGenerated: boolean
  fallbackUsed: boolean
  questions: QuizQuestion[]
  createdAt: string
  studyOutline?: string[]
}

export interface QuizAttempt {
  id: string
  courseId: string
  lessonId: string
  quizId: string
  score: number
  totalQuestions: number
  percentage: number
  answers: {
    questionId: string
    selectedIndex: number
    correctIndex: number
    correct: boolean
    conceptTested: string
  }[]
  weakAreas: string[]
  createdAt: string
}

// ─── Lesson ──────────────────────────────────────────────────────────────

export type TranscriptStatus = 'available' | 'missing' | 'failed' | 'not_requested'

export interface Lesson {
  id: string
  videoId?: string
  title: string
  description?: string
  duration: string
  completed: boolean
  sourceUrl?: string
  thumbnailUrl?: string
  transcript?: string
  transcriptStatus?: TranscriptStatus
  lessonGuide?: LessonGuide
  quiz?: Quiz
  quizScore?: number
  bestQuizScore?: number
  weakAreas?: string[]
  notes?: string
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
}

// ─── Module ──────────────────────────────────────────────────────────────

export interface Module {
  id?: string
  title: string
  summary?: string
  sortOrder?: number
  lessons: Lesson[]
}

// ─── Course ──────────────────────────────────────────────────────────────

export interface Course {
  id: string
  userId?: string
  title: string
  description?: string
  channelName: string
  channelHandle?: string
  channelUrl: string
  youtubeChannelId?: string
  thumbnail: string
  totalLessons: number
  completedLessons: number
  progress: number
  modules: Module[]
  sample?: boolean
  demo?: boolean
  aiGenerated?: boolean
  fallbackUsed?: boolean
  provider?: 'kimi' | 'openrouter' | 'fallback' | 'none'
  model?: string
  averageQuizScore?: number
  weakAreas?: string[]
  createdAt?: string
  updatedAt?: string
}

// ─── YouTube ─────────────────────────────────────────────────────────────

export interface YouTubeChannelInfo {
  id: string
  name: string
  handle: string
  thumbnail: string
  subscriberCount: string
  videoCount: string
  demo?: boolean
}

export type GenerationStep =
  | 'Fetching channel videos...'
  | 'Extracting transcripts...'
  | 'Analyzing content with AI...'
  | 'Building course structure...'
  | 'Course ready!'

// ─── Chat ────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export type PanelType = 'tutor' | 'notes' | 'quiz' | null

// ─── Settings ────────────────────────────────────────────────────────────

export interface ApiKeys {
  youtube?: string
  openRouter?: string
  kimi?: string
}

export interface AppSettings {
  apiKeys: ApiKeys
  preferredModel: string
  preferredProvider: 'kimi' | 'openrouter' | 'auto'
}

// ─── AI Result ───────────────────────────────────────────────────────────

export interface AiSuccess<T> {
  ok: true
  provider: 'kimi' | 'openrouter'
  model: string
  data: T
}

export interface AiFailure {
  ok: false
  provider: 'kimi' | 'openrouter' | 'none'
  errorCode: string
  errorMessage: string
  fallbackUsed: true
}

export type AiResult<T> = AiSuccess<T> | AiFailure
