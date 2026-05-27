/**
 * quizApi.ts -- Quiz data layer.
 *
 * Wraps AiProvider.generateLessonGuideAndQuiz() and handles
 * localStorage read/write for quiz data, lesson guides, weak areas.
 */

import type { Quiz, LessonGuide } from '../../types/course'
import type { AiResult } from '../../types/course'
import {
  generateLessonGuideAndQuiz as aiGenerateLessonGuideAndQuiz,
  type LessonGuideQuizContext,
} from '../../lib/AiProvider'

const SK_QUIZ = (c: string, l: string) => `courseforge_quiz_${c}_${l}`
const SK_GUIDE = (c: string, l: string) => `courseforge_lessonguide_${c}_${l}`
const SK_WEAK = (c: string, l: string) => `courseforge_weak_${c}_${l}`

export interface QuizResult {
  quiz: Quiz
  lessonGuide: LessonGuide | null
  aiGenerated: boolean
  error?: string
}

export interface WeakArea {
  topic: string
  count: number
}

export async function generateLessonGuideAndQuiz(
  courseTitle: string,
  channelName: string,
  lessonTitle: string,
  lessonDescription: string,
  lessonIndex: number,
  _totalLessons: number,
  transcript?: string,
  neighboringTitles?: string[],
): Promise<QuizResult> {
  console.group('[CourseForge] Lesson Guide + Quiz Generation')
  console.log('courseTitle:', courseTitle)
  console.log('lessonTitle:', lessonTitle)
  console.log('descriptionLength:', lessonDescription?.length || 0)
  console.log('descriptionPreview:', lessonDescription?.substring(0, 100) || 'N/A')
  console.log('transcriptStatus:', transcript ? 'available' : 'unavailable')
  console.log('transcriptLength:', transcript?.length || 0)
  console.log('neighboringVideoTitlesCount:', neighboringTitles?.length || 0)
  console.log('neighboringVideoTitles:', neighboringTitles?.slice(0, 3) || [])
  console.log('lessonIndex:', lessonIndex)
  console.groupEnd()

  const ctx: LessonGuideQuizContext = {
    courseTitle,
    channelName,
    lessonTitle,
    lessonDescription,
    transcript,
    transcriptStatus: transcript ? 'available' : 'unavailable',
    neighboringTitles,
    lessonIndex,
  }

  const result: AiResult<{
    lessonGuide: LessonGuide
    quiz: Quiz
    provider: 'kimi' | 'openrouter'
    model: string
  }> = await aiGenerateLessonGuideAndQuiz(ctx)

  if (!result.ok) {
    console.error('[quizApi] Generation failed:', result.errorCode, result.errorMessage)
    return {
      quiz: { id: '', lessonId: '', provider: 'fallback', aiGenerated: false, fallbackUsed: true, questions: [], createdAt: new Date().toISOString() },
      lessonGuide: null,
      aiGenerated: false,
      error: result.errorMessage,
    }
  }

  console.log('[quizApi] SUCCESS — provider:', result.provider, 'model:', result.model, 'quizQuestions:', result.data.quiz.questions.length)

  return {
    quiz: result.data.quiz,
    lessonGuide: result.data.lessonGuide,
    aiGenerated: true,
  }
}

export function recordWeakArea(courseId: string, lessonId: string, topic: string): void {
  try {
    const stored = localStorage.getItem(SK_WEAK(courseId, lessonId))
    const areas: WeakArea[] = stored ? JSON.parse(stored) : []
    const existing = areas.find((a) => a.topic === topic)
    if (existing) {
      existing.count++
    } else {
      areas.push({ topic, count: 1 })
    }
    localStorage.setItem(SK_WEAK(courseId, lessonId), JSON.stringify(areas))
  } catch (e) {
    console.error('[quizApi] recordWeakArea error:', e)
  }
}

export function loadWeakAreas(courseId: string, lessonId: string): WeakArea[] {
  try {
    const stored = localStorage.getItem(SK_WEAK(courseId, lessonId))
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function loadQuiz(courseId: string, lessonId: string): Quiz | null {
  try {
    const stored = localStorage.getItem(SK_QUIZ(courseId, lessonId))
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function saveQuiz(courseId: string, lessonId: string, quiz: Quiz): void {
  localStorage.setItem(SK_QUIZ(courseId, lessonId), JSON.stringify(quiz))
}

export function loadLessonGuide(courseId: string, lessonId: string): LessonGuide | null {
  try {
    const stored = localStorage.getItem(SK_GUIDE(courseId, lessonId))
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function saveLessonGuide(courseId: string, lessonId: string, guide: LessonGuide): void {
  localStorage.setItem(SK_GUIDE(courseId, lessonId), JSON.stringify(guide))
}

export function saveQuizScore(courseId: string, lessonId: string, score: number, total: number): void {
  localStorage.setItem('courseforge_quizscore_' + courseId + '_' + lessonId, JSON.stringify({ score, total }))
  // Also update best score
  const bestKey = 'courseforge_bestscore_' + courseId + '_' + lessonId
  const currentBest = localStorage.getItem(bestKey)
  if (!currentBest || JSON.parse(currentBest).score < score) {
    localStorage.setItem(bestKey, JSON.stringify({ score, total }))
  }
}

export function getBestQuizScore(courseId: string, lessonId: string): number {
  try {
    const stored = localStorage.getItem('courseforge_bestscore_' + courseId + '_' + lessonId)
    return stored ? JSON.parse(stored).score : 0
  } catch {
    return 0
  }
}
