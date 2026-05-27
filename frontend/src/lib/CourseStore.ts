/**
 * CourseStore — Single Source of Truth for ALL course data.
 *
 * Repository pattern: later swap localStorage for Supabase without
 * rewriting any page. Every read/write goes through this file.
 */

import type {
  Course,
  Module as CourseModule,
  Lesson,
  LessonGuide,
  Quiz,
  QuizAttempt,
  TranscriptStatus,
} from '../types/course'

const SK = {
  courses: 'courseforge_courses',
  complete: (cid: string, lid: string) => `courseforge_complete_${cid}_${lid}`,
  quiz: (cid: string, lid: string) => `courseforge_quiz_${cid}_${lid}`,
  quizScore: (cid: string, lid: string) => `courseforge_quizscore_${cid}_${lid}`,
  bestScore: (cid: string, lid: string) => `courseforge_bestscore_${cid}_${lid}`,
  guide: (cid: string, lid: string) => `courseforge_guide_${cid}_${lid}`,
  lessonGuide: (cid: string, lid: string) => `courseforge_lessonguide_${cid}_${lid}`,
  weak: (cid: string, lid: string) => `courseforge_weak_${cid}_${lid}`,
  notes: (cid: string, lid: string) => `courseforge_notes_${cid}_${lid}`,
  attempts: (cid: string, lid: string) => `courseforge_attempts_${cid}_${lid}`,
  transcript: (cid: string, lid: string) => `courseforge_transcript_${cid}_${lid}`,
}

// ─── Low-level localStorage helpers ──────────────────────────────────────

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('[CourseStore] lsSet error:', e)
  }
}

function lsRemove(key: string): void {
  try { localStorage.removeItem(key) } catch (err) {
    /* ignore — logged */ console.debug("[CourseForge] Caught (expected):", err instanceof Error ? err.message : String(err));
  }
}

// ─── Completion helpers ──────────────────────────────────────────────────

function isLessonComplete(courseId: string, lessonId: string): boolean {
  return localStorage.getItem(SK.complete(courseId, lessonId)) === 'true'
}

function setLessonCompleteRaw(courseId: string, lessonId: string, completed: boolean): void {
  localStorage.setItem(SK.complete(courseId, lessonId), completed ? 'true' : 'false')
}

// ─── Normalization: migrate old saved courses ────────────────────────────

function ensureLesson(lesson: unknown): Lesson {
  const l = lesson as Record<string, unknown>
  return {
    id: String(l.id || ''),
    videoId: l.videoId ? String(l.videoId) : undefined,
    title: String(l.title || ''),
    description: l.description ? String(l.description) : undefined,
    duration: String(l.duration || ''),
    completed: Boolean(l.completed),
    sourceUrl: l.sourceUrl ? String(l.sourceUrl) : undefined,
    thumbnailUrl: l.thumbnailUrl ? String(l.thumbnailUrl) : undefined,
    transcript: l.transcript ? String(l.transcript) : undefined,
    transcriptStatus: (l.transcriptStatus as TranscriptStatus) || 'not_requested',
    lessonGuide: l.lessonGuide as LessonGuide | undefined,
    quiz: l.quiz as Quiz | undefined,
    quizScore: typeof l.quizScore === 'number' ? l.quizScore : undefined,
    bestQuizScore: typeof l.bestQuizScore === 'number' ? l.bestQuizScore : undefined,
    weakAreas: Array.isArray(l.weakAreas) ? l.weakAreas as string[] : undefined,
    notes: l.notes ? String(l.notes) : undefined,
    sortOrder: typeof l.sortOrder === 'number' ? l.sortOrder : undefined,
  }
}

function ensureModule(mod: unknown): CourseModule {
  const m = mod as Record<string, unknown>
  const lessons = Array.isArray(m.lessons) ? m.lessons.map(ensureLesson) : []
  return {
    id: m.id ? String(m.id) : undefined,
    title: String(m.title || ''),
    summary: m.summary ? String(m.summary) : undefined,
    sortOrder: typeof m.sortOrder === 'number' ? m.sortOrder : undefined,
    lessons,
  }
}

/**
 * normalizeCourse — safely adds missing fields to old saved courses.
 * Call this every time a course is loaded from storage.
 */
export function normalizeCourse(course: unknown): Course {
  const c = course as Record<string, unknown>
  const modules = Array.isArray(c.modules) ? c.modules.map(ensureModule) : []

  let total = 0
  let done = 0
  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      total++
      const fromStorage = isLessonComplete(String(c.id || ''), lesson.id)
      lesson.completed = !!lesson.completed || fromStorage
      if (lesson.completed) done++
    }
  }

  return {
    id: String(c.id || ''),
    userId: c.userId ? String(c.userId) : undefined,
    title: String(c.title || ''),
    description: c.description ? String(c.description) : undefined,
    channelName: String(c.channelName || ''),
    channelHandle: c.channelHandle ? String(c.channelHandle) : undefined,
    channelUrl: String(c.channelUrl || ''),
    youtubeChannelId: c.youtubeChannelId ? String(c.youtubeChannelId) : undefined,
    thumbnail: String(c.thumbnail || ''),
    totalLessons: total,
    completedLessons: done,
    progress: total > 0 ? Math.round((done / total) * 100) : 0,
    modules,
    sample: Boolean(c.sample),
    demo: Boolean(c.demo),
    aiGenerated: Boolean(c.aiGenerated),
    fallbackUsed: Boolean(c.fallbackUsed),
    provider: (c.provider as Course['provider']) || 'none',
    model: c.model ? String(c.model) : undefined,
    averageQuizScore: typeof c.averageQuizScore === 'number' ? c.averageQuizScore : undefined,
    weakAreas: Array.isArray(c.weakAreas) ? c.weakAreas as string[] : undefined,
    createdAt: c.createdAt ? String(c.createdAt) : new Date().toISOString(),
    updatedAt: c.updatedAt ? String(c.updatedAt) : new Date().toISOString(),
  }
}

// ─── Public API ──────────────────────────────────────────────────────────

export const CourseStore = {

  /** Load all courses with normalized + synced completion data */
  loadAll(): Course[] {
    const courses: unknown[] = lsGet(SK.courses, [])
    return courses.map(normalizeCourse)
  },

  /** Load one course with normalized + synced completion data */
  load(courseId: string): Course | null {
    const courses = this.loadAll()
    return courses.find((c) => c.id === courseId) || null
  },

  /** Save (overwrite) a course */
  save(course: Course): void {
    const all = lsGet<unknown[]>(SK.courses, [])
    const idx = all.findIndex((c) => (c as Record<string, unknown>).id === course.id)
    const toSave = { ...course, updatedAt: new Date().toISOString() }
    if (idx >= 0) {
      all[idx] = toSave
    } else {
      all.push(toSave)
    }
    lsSet(SK.courses, all)
  },

  /** Delete a course and all its associated data */
  delete(courseId: string): void {
    const all = lsGet<unknown[]>(SK.courses, []).filter(
      (c) => (c as Record<string, unknown>).id !== courseId,
    )
    lsSet(SK.courses, all)
    // Clean up all per-lesson keys
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes(courseId)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(lsRemove)
  },

  /** Delete ALL courses */
  deleteAll(): void {
    lsRemove(SK.courses)
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('courseforge_')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(lsRemove)
  },

  /** Mark a lesson complete/incomplete */
  markLesson(courseId: string, lessonId: string, completed: boolean): void {
    setLessonCompleteRaw(courseId, lessonId, completed)
    const course = this.load(courseId)
    if (!course) return
    let found = false
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.id === lessonId) {
          lesson.completed = completed
          found = true
        }
      }
    }
    if (found) {
      const updated = normalizeCourse(course)
      this.save(updated)
    }
  },

  /** Toggle lesson completion */
  toggleLesson(courseId: string, lessonId: string): boolean {
    const wasComplete = isLessonComplete(courseId, lessonId)
    this.markLesson(courseId, lessonId, !wasComplete)
    return !wasComplete
  },

  /** Reset all progress for a course */
  resetProgress(courseId: string): void {
    const course = this.load(courseId)
    if (!course) return
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        lsRemove(SK.complete(courseId, lesson.id))
        lesson.completed = false
      }
    }
    this.save(normalizeCourse(course))
  },

  /** Recalculate progress for a course */
  recalculateProgress(courseId: string): Course | null {
    const course = this.load(courseId)
    if (!course) return null
    return normalizeCourse(course)
  },

  // ─── Lesson Guides ───────────────────────────────────────────────────────

  saveLessonGuide(courseId: string, lessonId: string, guide: LessonGuide): void {
    lsSet(SK.lessonGuide(courseId, lessonId), guide)
  },

  loadLessonGuide(courseId: string, lessonId: string): LessonGuide | null {
    return lsGet<LessonGuide | null>(SK.lessonGuide(courseId, lessonId), null)
  },

  // ─── Notes ───────────────────────────────────────────────────────────────

  saveNotes(courseId: string, lessonId: string, notes: string): void {
    lsSet(SK.notes(courseId, lessonId), notes)
  },

  loadNotes(courseId: string, lessonId: string): string {
    return lsGet<string>(SK.notes(courseId, lessonId), '')
  },

  // ─── Quizzes ─────────────────────────────────────────────────────────────

  saveQuiz(courseId: string, lessonId: string, quiz: Quiz): void {
    lsSet(SK.quiz(courseId, lessonId), quiz)
  },

  loadQuiz(courseId: string, lessonId: string): Quiz | null {
    return lsGet<Quiz | null>(SK.quiz(courseId, lessonId), null)
  },

  // ─── Quiz Scores ─────────────────────────────────────────────────────────

  saveQuizScore(courseId: string, lessonId: string, score: number, total: number): void {
    lsSet(SK.quizScore(courseId, lessonId), { score, total })
    // Update best score
    const currentBest = this.getBestQuizScore(courseId, lessonId)
    if (score > currentBest) {
      lsSet(SK.bestScore(courseId, lessonId), { score, total })
    }
    // Also update the lesson object
    const course = this.load(courseId)
    if (course) {
      for (const mod of course.modules) {
        for (const lesson of mod.lessons) {
          if (lesson.id === lessonId) {
            lesson.quizScore = score
            lesson.bestQuizScore = Math.max(score, lesson.bestQuizScore || 0)
          }
        }
      }
      this.save(course)
    }
  },

  loadQuizScore(courseId: string, lessonId: string): { score: number; total: number } | null {
    return lsGet<{ score: number; total: number } | null>(SK.quizScore(courseId, lessonId), null)
  },

  getBestQuizScore(courseId: string, lessonId: string): number {
    const best = lsGet<{ score: number } | null>(SK.bestScore(courseId, lessonId), null)
    return best?.score || 0
  },

  // ─── Quiz Attempts ───────────────────────────────────────────────────────

  saveQuizAttempt(attempt: QuizAttempt): void {
    const existing: QuizAttempt[] = lsGet(SK.attempts(attempt.courseId, attempt.lessonId), [])
    existing.push(attempt)
    lsSet(SK.attempts(attempt.courseId, attempt.lessonId), existing)
  },

  loadQuizAttempts(courseId: string, lessonId: string): QuizAttempt[] {
    return lsGet<QuizAttempt[]>(SK.attempts(courseId, lessonId), [])
  },

  // ─── Weak Areas ──────────────────────────────────────────────────────────

  saveWeakAreas(courseId: string, lessonId: string, weakAreas: string[]): void {
    lsSet(SK.weak(courseId, lessonId), weakAreas)
    // Also update lesson object
    const course = this.load(courseId)
    if (course) {
      for (const mod of course.modules) {
        for (const lesson of mod.lessons) {
          if (lesson.id === lessonId) {
            lesson.weakAreas = weakAreas
          }
        }
      }
      this.save(course)
    }
  },

  loadWeakAreas(courseId: string, lessonId: string): string[] {
    return lsGet<string[]>(SK.weak(courseId, lessonId), [])
  },

  // ─── Transcripts ─────────────────────────────────────────────────────────

  saveTranscript(
    courseId: string,
    lessonId: string,
    data: { transcript: string; transcriptStatus: TranscriptStatus; language?: string; source?: string },
  ): void {
    lsSet(SK.transcript(courseId, lessonId), data)
    // Also update the lesson object in the course
    const course = this.load(courseId)
    if (course) {
      for (const mod of course.modules) {
        for (const lesson of mod.lessons) {
          if (lesson.id === lessonId) {
            lesson.transcript = data.transcript
            lesson.transcriptStatus = data.transcriptStatus
          }
        }
      }
      this.save(course)
    }
  },

  saveTranscripts(courseId: string, results: Array<{ lessonId: string; transcript: string; transcriptStatus: TranscriptStatus; language?: string; source?: string }>): void {
    const course = this.load(courseId)
    if (!course) return
    for (const result of results) {
      lsSet(SK.transcript(courseId, result.lessonId), result)
      // Update lesson objects
      for (const mod of course.modules) {
        for (const lesson of mod.lessons) {
          if (lesson.id === result.lessonId) {
            lesson.transcript = result.transcript
            lesson.transcriptStatus = result.transcriptStatus
          }
        }
      }
    }
    this.save(course)
  },

  loadTranscript(courseId: string, lessonId: string): { transcript: string; transcriptStatus: TranscriptStatus; language?: string; source?: string } | null {
    return lsGet(SK.transcript(courseId, lessonId), null)
  },

  getTranscriptStatus(courseId: string, lessonId: string): TranscriptStatus {
    const lesson = this.getLesson(courseId, lessonId)
    return lesson?.transcriptStatus || 'not_requested'
  },

  updateLesson(courseId: string, lessonId: string, patch: Partial<Lesson>): void {
    const course = this.load(courseId)
    if (!course) return
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.id === lessonId) {
          Object.assign(lesson, patch)
          this.save(course)
          return
        }
      }
    }
  },

  // ─── Aggregation helpers ─────────────────────────────────────────────────

  getLesson(courseId: string, lessonId: string): Lesson | null {
    const course = this.load(courseId)
    if (!course) return null
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.id === lessonId) return lesson
      }
    }
    return null
  },

  getLessonState(courseId: string, lessonId: string): {
    completed: boolean
    hasGuide: boolean
    hasQuiz: boolean
    quizScore: number | undefined
    bestQuizScore: number | undefined
    weakAreas: string[]
    notes: string
  } {
    const lesson = this.getLesson(courseId, lessonId)
    return {
      completed: lesson?.completed || false,
      hasGuide: !!this.loadLessonGuide(courseId, lessonId),
      hasQuiz: !!this.loadQuiz(courseId, lessonId),
      quizScore: lesson?.quizScore,
      bestQuizScore: lesson?.bestQuizScore,
      weakAreas: this.loadWeakAreas(courseId, lessonId),
      notes: this.loadNotes(courseId, lessonId),
    }
  },

  getAverageCourseQuizScore(courseId: string): { average: number; lessonsWithQuizzes: number } {
    const course = this.load(courseId)
    if (!course) return { average: 0, lessonsWithQuizzes: 0 }

    let totalScore = 0
    let totalQuestions = 0
    let lessonsWithQuizzes = 0

    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        const score = this.loadQuizScore(courseId, lesson.id)
        if (score) {
          totalScore += score.score
          totalQuestions += score.total
          lessonsWithQuizzes++
        }
      }
    }

    const average = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0
    return { average, lessonsWithQuizzes }
  },

  findFirstIncompleteLesson(courseId: string): {
    moduleIndex: number
    lessonIndex: number
    lessonId: string
  } | null {
    const course = this.load(courseId)
    if (!course) return null
    for (let mi = 0; mi < course.modules.length; mi++) {
      for (let li = 0; li < course.modules[mi].lessons.length; li++) {
        if (!course.modules[mi].lessons[li].completed) {
          return { moduleIndex: mi, lessonIndex: li, lessonId: course.modules[mi].lessons[li].id }
        }
      }
    }
    return null
  },
}
