/**
 * storage.ts — Centralized localStorage manager with safe error handling.
 *
 * All localStorage access goes through here. Every operation has try-catch.
 * Never throws. Returns null/empty string on failure.
 *
 * Usage:
 *   const key = StorageManager.getApiKey('openrouter')
 *   StorageManager.setApiKey('openrouter', 'sk-...')
 *   const allCourses = StorageManager.getCourses()
 */

export const STORAGE_KEYS = {
  courses: 'courseforge_courses',
  youtubeKey: 'courseforge_youtube_api_key',
  openrouterKey: 'courseforge_openrouter_api_key',
  kimiKey: 'courseforge_kimi_api_key',
  preferredModel: 'courseforge_preferred_model',
} as const

export type ApiKeyType = 'youtube' | 'openrouter' | 'kimi'

/** Generic safe localStorage get */
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch (err) {
    console.warn(`[StorageManager] get(${key}) failed:`, err)
    return null
  }
}

/** Generic safe localStorage set */
function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (err) {
    console.warn(`[StorageManager] set(${key}) failed:`, err)
    return false
  }
}

/** Generic safe localStorage remove */
function safeRemove(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (err) {
    console.warn(`[StorageManager] remove(${key}) failed:`, err)
    return false
  }
}

/** Parse JSON safely. Returns null on failure. */
function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch (err) {
    console.warn('[StorageManager] JSON parse failed:', err)
    return null
  }
}

/** Stringify safely. Returns null on failure. */
function safeStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value)
  } catch (err) {
    console.warn('[StorageManager] JSON stringify failed:', err)
    return null
  }
}

// ─── API Key management ──────────────────────────────────────────────────

function getApiKeyRaw(type: ApiKeyType): string {
  const keyMap: Record<ApiKeyType, string> = {
    youtube: STORAGE_KEYS.youtubeKey,
    openrouter: STORAGE_KEYS.openrouterKey,
    kimi: STORAGE_KEYS.kimiKey,
  }
  return safeGet(keyMap[type]) || ''
}

function setApiKeyRaw(type: ApiKeyType, value: string): boolean {
  const keyMap: Record<ApiKeyType, string> = {
    youtube: STORAGE_KEYS.youtubeKey,
    openrouter: STORAGE_KEYS.openrouterKey,
    kimi: STORAGE_KEYS.kimiKey,
  }
  return safeSet(keyMap[type], value)
}

/** Check if any AI key is saved and non-empty */
function hasAiKey(): boolean {
  return !!(getApiKeyRaw('openrouter') || getApiKeyRaw('kimi'))
}

// ─── Course data ─────────────────────────────────────────────────────────

function getCoursesRaw(): string | null {
  return safeGet(STORAGE_KEYS.courses)
}

function setCoursesRaw(value: string): boolean {
  return safeSet(STORAGE_KEYS.courses, value)
}

// ─── Completion tracking ─────────────────────────────────────────────────

function getLessonCompletion(courseId: string, lessonId: string): boolean {
  return safeGet(`courseforge_complete_${courseId}_${lessonId}`) === 'true'
}

function setLessonCompletion(courseId: string, lessonId: string, completed: boolean): boolean {
  return safeSet(`courseforge_complete_${courseId}_${lessonId}`, String(completed))
}

// ─── Public API ──────────────────────────────────────────────────────────

export const StorageManager = {
  // API Keys
  getApiKey: getApiKeyRaw,
  setApiKey: setApiKeyRaw,
  hasAiKey,

  // Courses
  getCoursesRaw,
  setCoursesRaw,

  // Completion
  getLessonCompletion,
  setLessonCompletion,

  // Generic (for one-off keys)
  get: safeGet,
  set: safeSet,
  remove: safeRemove,

  // JSON helpers
  parse: safeParse,
  stringify: safeStringify,

  // Key constants (for backward compat)
  keys: STORAGE_KEYS,
} as const
