/**
 * authApi.ts — Auth API client for CourseForge backend.
 * Handles JWT token storage, registration, login, and authenticated requests.
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'https://courseforge-production-9253.up.railway.app'

export interface User {
  id: string
  name: string
  email: string
  role: string
  plan: string
}

// ─── Token management ────────────────────────────────────────────────────

const TOKEN_KEY = 'courseforge_jwt_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // ignore
  }
}

export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}

// ─── Auth header helper ──────────────────────────────────────────────────

export function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ─── Generic API fetch with auth ─────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text.substring(0, 200)}`)
  }

  return res.json() as Promise<T>
}

// ─── Auth routes ─────────────────────────────────────────────────────────

export async function registerUser(name: string, email: string, password: string): Promise<User> {
  const data = await apiFetch<{ id: string; name: string; email: string; role: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
  return { ...data, plan: 'free' }
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: User }> {
  const data = await apiFetch<{ token: string; user: { id: string; name: string; email: string; role: string } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(data.token)
  return { token: data.token, user: { ...data.user, plan: 'free' } }
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getToken()
  if (!token) return null
  try {
    const user = await apiFetch<{ id: string; name: string; email: string; role: string; plan?: string }>('/api/auth/me')
    return { ...user, plan: user.plan || 'free' }
  } catch {
    removeToken()
    return null
  }
}

export function logoutUser(): void {
  removeToken()
}

// ─── Course routes (authenticated) ───────────────────────────────────────

export async function saveCourseToBackend(courseData: {
  title: string
  description?: string
  channel_name?: string
  thumbnail_url?: string
  is_playlist?: boolean
  lessons: any[]
  generated_data?: any
}): Promise<{ id: string }> {
  return apiFetch('/api/courses', {
    method: 'POST',
    body: JSON.stringify(courseData),
  })
}

export async function fetchCoursesFromBackend(): Promise<any[]> {
  return apiFetch('/api/courses')
}

export async function fetchCourseFromBackend(courseId: string): Promise<any> {
  return apiFetch(`/api/courses/${courseId}`)
}

export async function deleteCourseFromBackend(courseId: string): Promise<void> {
  await apiFetch(`/api/courses/${courseId}`, { method: 'DELETE' })
}

// ─── Progress routes ─────────────────────────────────────────────────────

export async function saveProgressToBackend(courseId: string, lessonId: string, data: {
  completed?: boolean
  quiz_score?: number
  quiz_attempts?: any
}): Promise<void> {
  await apiFetch(`/api/progress/${courseId}`, {
    method: 'PATCH',
    body: JSON.stringify({ lesson_id: lessonId, ...data }),
  })
}

export async function fetchProgressFromBackend(courseId: string): Promise<any> {
  return apiFetch(`/api/progress/${courseId}`)
}
