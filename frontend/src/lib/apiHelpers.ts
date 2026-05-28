/**
 * apiHelpers.ts — Reusable helpers for safe fetch operations and error handling.
 *
 * Provides:
 * - safeFetch: fetch wrapper with timeout, error handling, and JSON parsing
 * - safeJsonParse: JSON parse that never throws
 * - withTimeout: promise wrapper with timeout
 */

export interface FetchResult<T> {
  ok: boolean
  status: number
  data: T | null
  error: string | null
  raw: string
}

/** Fetch with automatic timeout and error handling */
export async function safeFetch(
  url: string,
  options?: RequestInit & { timeoutMs?: number },
): Promise<FetchResult<unknown>> {
  const { timeoutMs = 30000, ...fetchOptions } = options || {}

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const raw = await res.text()

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `HTTP ${res.status}: ${raw.substring(0, 200)}`,
        raw,
      }
    }

    // Try to parse JSON, but don't fail if it's not JSON
    let data: unknown = null
    try {
      data = JSON.parse(raw)
    } catch {
      data = raw
    }

    return { ok: true, status: res.status, data, error: null, raw }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('abort')) {
      return { ok: false, status: 0, data: null, error: 'Request timed out', raw: '' }
    }
    return { ok: false, status: 0, data: null, error: msg, raw: '' }
  }
}

/** JSON parse that never throws */
export function safeJsonParse<T>(text: string | null): T | null {
  if (!text) return null
  try {
    return JSON.parse(text) as T
  } catch (err) {
    console.warn('[safeJsonParse] Failed:', err)
    return null
  }
}

/** JSON stringify that never throws */
export function safeJsonStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value)
  } catch (err) {
    console.warn('[safeJsonStringify] Failed:', err)
    return null
  }
}

/** Wrap a promise with a timeout */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out',
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

/** Log an error with consistent formatting */
export function logError(context: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err)
  console.error(`[CourseForge Error] ${context}: ${msg}`)
}

/** Log a warning with consistent formatting */
export function logWarn(context: string, detail?: string): void {
  console.warn(`[CourseForge Warning] ${context}${detail ? ': ' + detail : ''}`)
}
