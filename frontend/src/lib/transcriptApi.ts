/**
 * transcriptApi.ts — Frontend client for the CourseForge transcript backend.
 *
 * Endpoints (FastAPI):
 *   POST /api/transcripts/start  → { jobId, status }
 *   GET  /api/transcripts/status/{jobId} → full job state
 *   GET  /api/health             → { status: "ok" }
 *
 * Environment:
 *   VITE_TRANSCRIPT_API_BASE — URL of the transcript service
 */

// ─── Config ──────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_TRANSCRIPT_API_BASE || 'http://localhost:8000'

function apiUrl(path: string): string {
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
  return `${base}${path}`
}

// ─── Types ───────────────────────────────────────────────────────────────

export type JobStatus = 'queued' | 'running' | 'complete' | 'failed'

export interface TranscriptResult {
  lessonId: string
  videoId: string
  title?: string
  transcript: string
  segments?: Array<{ text: string; start: number; duration: number }>
  transcriptStatus: 'available' | 'missing' | 'failed'
  language?: string | null
  source: string
  error?: string | null
}

export interface TranscriptJobResponse {
  jobId: string
  status: JobStatus
  progress: number
  stage: string
  completed: number
  total: number
  partialResults?: TranscriptResult[]
  result?: TranscriptResult[]
  error?: string | null
}

export interface TranscriptVideoInput {
  lessonId: string
  videoId: string
  title: string
  sourceUrl?: string
}

// ─── Low-level fetch ─────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
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

// ─── Health Check ────────────────────────────────────────────────────────

export async function checkTranscriptBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/health'), { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

// ─── Job Start ───────────────────────────────────────────────────────────

export async function startTranscriptJob(
  courseId: string,
  videos: TranscriptVideoInput[],
): Promise<{ jobId: string; status: string }> {
  return apiFetch('/api/transcripts/start', {
    method: 'POST',
    body: JSON.stringify({ courseId, videos }),
  })
}

// ─── Job Status ──────────────────────────────────────────────────────────

export async function getTranscriptJobStatus(
  jobId: string,
  signal?: AbortSignal,
): Promise<TranscriptJobResponse> {
  const res = await fetch(apiUrl(`/api/transcripts/status/${jobId}`), { signal })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }

  return res.json()
}

// ─── Polling Helper ──────────────────────────────────────────────────────

export interface PollOptions<T> {
  jobId: string
  getStatus: (jobId: string, signal?: AbortSignal) => Promise<T>
  intervalMs?: number
  timeoutMs?: number
  onProgress?: (status: T) => void
}

export async function pollJob<T extends { status: string; error?: string | null }>({
  jobId,
  getStatus,
  intervalMs = 2000,
  timeoutMs = 10 * 60 * 1000,
  onProgress,
}: PollOptions<T>): Promise<T> {
  const controller = new AbortController()
  const startedAt = Date.now()

  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      if (timer) clearTimeout(timer)
      controller.abort()
    }

    const tick = async () => {
      try {
        if (Date.now() - startedAt > timeoutMs) {
          cleanup()
          reject(new Error(`Job ${jobId} timed out after ${Math.round(timeoutMs / 1000)}s`))
          return
        }

        const status = await getStatus(jobId, controller.signal)
        onProgress?.(status)

        if (status.status === 'complete') {
          cleanup()
          resolve(status)
          return
        }

        if (status.status === 'failed') {
          cleanup()
          reject(new Error(status.error || `Job ${jobId} failed`))
          return
        }

        timer = setTimeout(tick, intervalMs)
      } catch (err) {
        cleanup()
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    }

    tick()
  })
}

// ─── High-level: extract transcripts with polling ────────────────────────

export async function extractTranscriptsWithPolling(
  courseId: string,
  videos: TranscriptVideoInput[],
  onProgress?: (status: TranscriptJobResponse) => void,
): Promise<TranscriptResult[]> {
  const start = await startTranscriptJob(courseId, videos)

  const finalStatus = await pollJob<TranscriptJobResponse>({
    jobId: start.jobId,
    getStatus: getTranscriptJobStatus,
    intervalMs: 2000,
    timeoutMs: 10 * 60 * 1000,
    onProgress,
  })

  return finalStatus.result || []
}
