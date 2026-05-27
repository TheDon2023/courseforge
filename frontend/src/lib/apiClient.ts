/**
 * apiClient.ts — Frontend API client for the CourseForge backend.
 *
 * Provides:
 * - pollJob helper for async job polling
 * - Transcript job start/status methods
 * - Graceful fallback when backend is unavailable
 */

// Backend URL — configurable via env var, defaults to localhost for dev
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ─── Types ───────────────────────────────────────────────────────────────

export interface TranscriptJobStartBody {
  courseId: string
  videos: Array<{
    lessonId: string
    videoId: string
    title: string
    sourceUrl: string
  }>
}

export interface TranscriptJobResponse {
  jobId: string
  status: 'queued' | 'running' | 'complete' | 'failed'
  progress: number
  stage: string
  completed: number
  total: number
  result?: TranscriptResult[]
  error?: string | null
}

export interface TranscriptResult {
  lessonId: string
  videoId: string
  transcript: string
  transcriptStatus: 'available' | 'missing' | 'failed'
  language: string
  source: string
  error?: string
}

export interface PollOptions<T> {
  start: () => Promise<{ jobId: string }>
  checkStatus: (jobId: string) => Promise<T>
  intervalMs?: number
  timeoutMs?: number
  onProgress?: (data: T) => void
  onComplete?: (data: T) => void
  onError?: (error: string) => void
}

export interface PollController {
  abort: () => void
  promise: Promise<void>
}

// ─── Low-level fetch ─────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }

  return res.json() as Promise<T>
}

// ─── Transcript Jobs ─────────────────────────────────────────────────────

export async function startTranscriptJob(body: TranscriptJobStartBody): Promise<{ jobId: string; status: string }> {
  return apiFetch('/api/jobs/transcript', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getTranscriptJobStatus(jobId: string): Promise<TranscriptJobResponse> {
  return apiFetch(`/api/jobs/${jobId}`)
}

// ─── Health Check ────────────────────────────────────────────────────────

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

// ─── Polling Helper ──────────────────────────────────────────────────────

export function pollJob<T extends { status: string; progress?: number; stage?: string }>(
  options: PollOptions<T>,
): PollController {
  const { start, checkStatus, intervalMs = 2000, timeoutMs = 10 * 60 * 1000 } = options
  const abortController = new AbortController()
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let intervalId: ReturnType<typeof setInterval> | null = null

  const promise = new Promise<void>((resolve, reject) => {
    // Overall timeout
    timeoutId = setTimeout(() => {
      cleanup()
      const msg = 'Job timed out after ' + Math.round(timeoutMs / 1000) + ' seconds'
      options.onError?.(msg)
      reject(new Error(msg))
    }, timeoutMs)

    function cleanup() {
      if (timeoutId) clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
      abortController.abort()
    }

    abortController.signal.addEventListener('abort', () => {
      cleanup()
      reject(new Error('Polling aborted'))
    })

    // Start the job
    start()
      .then(({ jobId }) => {
        if (abortController.signal.aborted) return

        // Initial status check
        checkStatus(jobId)
          .then((data) => {
            if (abortController.signal.aborted) return
            options.onProgress?.(data)

            if (data.status === 'complete') {
              cleanup()
              options.onComplete?.(data)
              resolve()
              return
            }

            if (data.status === 'failed') {
              cleanup()
              const msg = 'Job failed: ' + ((data as unknown as Record<string, string>)?.error || 'Unknown error')
              options.onError?.(msg)
              reject(new Error(msg))
              return
            }

            // Start polling interval
            intervalId = setInterval(() => {
              if (abortController.signal.aborted) return

              checkStatus(jobId)
                .then((data) => {
                  if (abortController.signal.aborted) return
                  options.onProgress?.(data)

                  if (data.status === 'complete') {
                    cleanup()
                    options.onComplete?.(data)
                    resolve()
                  } else if (data.status === 'failed') {
                    cleanup()
                    const msg = 'Job failed: ' + ((data as unknown as Record<string, string>)?.error || 'Unknown error')
                    options.onError?.(msg)
                    reject(new Error(msg))
                  }
                })
                .catch((err) => {
                  if (abortController.signal.aborted) return
                  const msg = err instanceof Error ? err.message : String(err)
                  options.onError?.(msg)
                  // Don't stop polling on transient errors
                })
            }, intervalMs)
          })
          .catch((err) => {
            cleanup()
            const msg = err instanceof Error ? err.message : String(err)
            options.onError?.(msg)
            reject(err)
          })
      })
      .catch((err) => {
        cleanup()
        const msg = err instanceof Error ? err.message : String(err)
        options.onError?.(msg)
        reject(err)
      })
  })

  return {
    abort: () => abortController.abort(),
    promise,
  }
}
