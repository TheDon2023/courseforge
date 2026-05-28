/**
 * AiProvider — Centralized AI wrapper for all LLM calls.
 *
 * Rules:
 * - One callOpenRouter() and one callKimi() function.
 * - No fake fallback quizzes. If AI fails, return structured error.
 * - Answers are shuffled so correct answer isn't always A.
 * - Keys are cleaned via aiKeys.ts.
 * - All outputs are validated hard — reject generic/off-topic content.
 */

import type { Quiz, QuizQuestion, LessonGuide } from '../types/course'
import type { AiResult } from '../types/course'
import { getAiKeys, hasAnyAIKey, diagnoseKeys, maskKey } from './aiKeys'

// ─── Connection Test Types ───────────────────────────────────────────────

export interface ConnectionTestResult {
  provider: 'kimi' | 'openrouter' | 'youtube'
  status: 'connected' | 'failed' | 'no_key'
  error?: string
  latencyMs?: number
}

// ─── Constants ───────────────────────────────────────────────────────────

const OR_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Free models on OpenRouter to try in order until one works
export const OR_FREE_MODELS = [
  'meta-llama/llama-3.1-8b-instruct',
  'google/gemini-2.0-flash-001',
  'google/gemini-flash-1.5',
  'mistralai/mistral-7b-instruct',
  'openrouter/auto',
] as const

// ─── Reusable: call OpenRouter with model fallback ───────────────────────

export async function callOpenRouterWithFallback(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  models: readonly string[] = OR_FREE_MODELS,
): Promise<string> {
  const headers: Record<string, string> = {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json',
    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://courseforge.app',
    'X-OpenRouter-Title': 'CourseForge',
  }

  const lastErrors: string[] = []

  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    console.log(`[OpenRouterFallback] Trying model ${i + 1}/${models.length}: ${model}`)

    try {
      const res = await fetch(OR_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages, temperature: 0.3 }),
      })

      if (res.status === 404) {
        console.log(`[OpenRouterFallback] ${model}: 404, trying next...`)
        lastErrors.push(`${model}: 404`)
        continue
      }

      if (res.status === 429) {
        lastErrors.push(`${model}: 429 rate limited`)
        continue
      }

      if (!res.ok) {
        const text = await res.text()
        lastErrors.push(`${model}: HTTP ${res.status}`)
        console.error(`[OpenRouterFallback] ${model}: HTTP ${res.status}:`, text.substring(0, 100))
        continue
      }

      const data = await res.json()
      if (data.error) {
        lastErrors.push(`${model}: ${JSON.stringify(data.error)}`)
        continue
      }

      const content = data.choices?.[0]?.message?.content || ''
      console.log(`[OpenRouterFallback] SUCCESS with ${model}`)
      return content

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[OpenRouterFallback] ${model} error:`, msg)
      lastErrors.push(`${model}: ${msg}`)
    }
  }

  throw new Error('All OpenRouter models failed. Last errors: ' + lastErrors.join('; '))
}
const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions'
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3'

const OR_REFERER = typeof window !== 'undefined' ? window.location.origin : 'https://courseforge.app'

// ─── Internal fetch helpers ──────────────────────────────────────────────

/** The ONLY OpenRouter fetch function in the entire app. */
async function callOpenRouter(prompt: string, model: string = OR_FREE_MODELS[0]): Promise<string> {
  const { openRouterKey } = getAiKeys()
  if (!openRouterKey) throw new Error('OpenRouter API key is missing — not saved in Settings.')

  // Validate key format
  if (!openRouterKey.startsWith('sk-or-v1-') && !openRouterKey.startsWith('sk-')) {
    throw new Error('OpenRouter API key has invalid format. Should start with "sk-or-v1-". Got: ' + maskKey(openRouterKey))
  }

  const headers: Record<string, string> = {
    'Authorization': 'Bearer ' + openRouterKey,
    'Content-Type': 'application/json',
    'HTTP-Referer': OR_REFERER,
    'X-OpenRouter-Title': 'CourseForge',
  }
  const body = JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.3 })

  console.log('[OpenRouter] Headers:', { ...headers, Authorization: maskKey(openRouterKey) })

  const res = await fetch(OR_API_URL, { method: 'POST', headers, body })
  const rawText = await res.text()

  console.log('[OpenRouter] Status:', res.status)

  if (res.status === 401) {
    console.error('[OpenRouter] 401 raw response:', rawText)
    const keyInfo = maskKey(openRouterKey)
    const isFormatWrong = !openRouterKey.startsWith('sk-or-v1-')
    const hint = isFormatWrong
      ? `Your key (${keyInfo}) doesn't start with "sk-or-v1-" — it may be the wrong key. Get a new one at openrouter.ai/keys`
      : `Key rejected (${keyInfo}). It may be expired or revoked. Get a new one at openrouter.ai/keys`
    throw new Error('OPENROUTER_UNAUTHORIZED: ' + hint)
  }
  if (res.status === 429) {
    throw new Error('OPENROUTER_RATE_LIMITED')
  }
  if (!res.ok) {
    throw new Error('[OpenRouter] HTTP ' + res.status + ': ' + rawText.substring(0, 200))
  }

  const data = JSON.parse(rawText)
  if (data.error) throw new Error('[OpenRouter] ' + JSON.stringify(data.error))
  return data.choices?.[0]?.message?.content || ''
}

/** The ONLY Kimi fetch function in the entire app. */
async function callKimi(prompt: string, model: string = 'kimi-k2.6'): Promise<string> {
  const { kimiKey } = getAiKeys()
  if (!kimiKey) throw new Error('Kimi API key is missing — not saved in Settings.')

  if (!kimiKey.startsWith('sk-')) {
    throw new Error('Kimi API key has invalid format. Should start with "sk-". Got: ' + maskKey(kimiKey))
  }

  console.log('[Kimi] Using key:', maskKey(kimiKey))

  const headers: Record<string, string> = {
    'Authorization': 'Bearer ' + kimiKey,
    'Content-Type': 'application/json',
  }
  const body = JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.3 })

  const res = await fetch(KIMI_API_URL, { method: 'POST', headers, body })
  const rawText = await res.text()

  console.log('[Kimi] Status:', res.status)

  if (res.status === 401) {
    console.error('[Kimi] 401 raw response:', rawText)
    throw new Error('KIMI_UNAUTHORIZED: Key rejected. Check your key is valid.')
  }
  if (res.status === 429) {
    throw new Error('KIMI_QUOTA_EXCEEDED')
  }
  if (!res.ok) {
    throw new Error('[Kimi] HTTP ' + res.status + ': ' + rawText.substring(0, 200))
  }

  const data = JSON.parse(rawText)
  if (data.error) throw new Error('[Kimi] ' + JSON.stringify(data.error))
  return data.choices?.[0]?.message?.content || ''
}

// ─── Shuffle helper ──────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Quality enforcement: detect and reject generic questions ────────────

const GENERIC_PATTERNS = [
  /what is the main topic/i,
  /what is this (video|lesson|section|chapter) about/i,
  /what does the (speaker|video|lesson|presenter) discuss/i,
  /what is the main idea/i,
  /what is covered in this/i,
  /what is the purpose of this/i,
  /which option best describes/i,
  /what can you learn from/i,
  /what is the key takeaway/i,
  /what is the central theme/i,
  /summarize the main/i,
  /what are the main points/i,
  /what does this video teach/i,
  /what is the video primarily about/i,
  /what is the focus of/i,
  /what is the overall/i,
  /what is discussed in/i,
  /what topic is/i,
  /what subject is/i,
  /what area is/i,
  /what field is/i,
  /what theme is/i,
  /what (is|are) the title/i,
  /identify the main/i,
  /choose the best description/i,
  /select the correct summary/i,
]

function isGenericQuestion(text: string): boolean {
  if (!text || text.length < 20) return true
  const lower = text.toLowerCase()
  return GENERIC_PATTERNS.some((p) => p.test(lower))
}

/** Remove generic questions and return filtered array */
function removeGenericQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const before = questions.length
  const filtered = questions.filter((q) => {
    if (isGenericQuestion(q.question)) {
      console.warn('[QualityFilter] REJECTED:', q.question.substring(0, 80))
      return false
    }
    return true
  })
  if (filtered.length < before) {
    console.warn(`[QualityFilter] Removed ${before - filtered.length} generic questions, ${filtered.length} remain`)
  }
  return filtered
}

function hasFallbackOptions(options: string[]): boolean {
  const fillers = ['Unrelated concept', 'General computing', 'Historical overview', 'None of the above', 'Not applicable']
  return options.some((o) => fillers.includes(o))
}

// ─── Quiz validation ─────────────────────────────────────────────────────

/** Hard validation for quiz output. Returns {ok, error} */
function validateQuizOutput(parsed: Record<string, unknown>): { ok: boolean; error?: string } {
  // Filter generic questions before counting
  let questions = removeGenericQuestions((parsed.questions || []) as QuizQuestion[])
  ;(parsed as Record<string, unknown>).questions = questions

  if (questions.length !== 10) {
    return { ok: false, error: 'Quiz has ' + questions.length + ' questions, expected exactly 10' }
  }

  let beginnerCount = 0
  let intermediateCount = 0
  let appliedCount = 0
  const correctIndexCounts = [0, 0, 0, 0]

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    if (!q.question || !Array.isArray(q.options)) {
      return { ok: false, error: 'Question ' + (i + 1) + ' is missing question text or options' }
    }
    if (q.options.length !== 4) {
      return { ok: false, error: 'Question ' + (i + 1) + ' has ' + q.options.length + ' options, expected 4' }
    }
    if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
      return { ok: false, error: 'Question ' + (i + 1) + ' has invalid correctIndex: ' + q.correctIndex }
    }
    if (!q.explanation || q.explanation.length < 5) {
      return { ok: false, error: 'Question ' + (i + 1) + ' has missing or too-short explanation' }
    }
    if (!q.conceptTested || q.conceptTested.length < 3) {
      return { ok: false, error: 'Question ' + (i + 1) + ' missing conceptTested' }
    }
    if (!q.difficulty || !['beginner', 'intermediate', 'applied'].includes(q.difficulty)) {
      return { ok: false, error: 'Question ' + (i + 1) + ' missing or invalid difficulty' }
    }
    if (isGenericQuestion(q.question)) {
      return { ok: false, error: 'Question ' + (i + 1) + ' is too generic: "' + q.question + '"' }
    }
    if (hasFallbackOptions(q.options)) {
      return { ok: false, error: 'Question ' + (i + 1) + ' contains fallback filler options' }
    }

    // Count difficulty distribution
    if (q.difficulty === 'beginner') beginnerCount++
    if (q.difficulty === 'intermediate') intermediateCount++
    if (q.difficulty === 'applied') appliedCount++
    correctIndexCounts[q.correctIndex]++
  }

  if (beginnerCount < 2) return { ok: false, error: 'Need at least 2 beginner questions, found ' + beginnerCount }
  if (intermediateCount < 3) return { ok: false, error: 'Need at least 3 intermediate questions, found ' + intermediateCount }
  if (appliedCount < 2) return { ok: false, error: 'Need at least 2 applied questions, found ' + appliedCount }

  // Ensure correct answers are distributed (not all same index)
  const maxCount = Math.max(...correctIndexCounts)
  if (maxCount > 8) return { ok: false, error: 'Correct answers too concentrated (max ' + maxCount + ' at one index)' }

  return { ok: true }
}

function validateLessonGuide(guide: Record<string, unknown>): { ok: boolean; error?: string } {
  if (!guide.overview || String(guide.overview).length < 20) {
    return { ok: false, error: 'Lesson guide overview too short or missing' }
  }
  const objectives = guide.learningObjectives as string[]
  if (!Array.isArray(objectives) || objectives.length < 3) {
    return { ok: false, error: 'Need at least 3 learning objectives, found ' + (objectives?.length || 0) }
  }
  const concepts = guide.keyConcepts as string[]
  if (!Array.isArray(concepts) || concepts.length < 5) {
    return { ok: false, error: 'Need at least 5 key concepts, found ' + (concepts?.length || 0) }
  }
  if (!guide.detailedExplanation || String(guide.detailedExplanation).length < 50) {
    return { ok: false, error: 'Detailed explanation too short or missing' }
  }
  return { ok: true }
}

// ─── Prompt builders ─────────────────────────────────────────────────────

function buildLessonGuideAndQuizPrompt(ctx: LessonGuideQuizContext): string {
  const transcriptBlock = ctx.transcript
    ? 'Transcript excerpt:\n' + ctx.transcript.substring(0, 2000) + '\n\n'
    : 'No transcript available.\n\n'

  const neighborsBlock = ctx.neighboringTitles?.length
    ? 'Neighboring video titles from same channel:\n' + ctx.neighboringTitles.map((t) => '- ' + t).join('\n') + '\n\n'
    : ''

  return (
    'You are an expert instructional designer, subject-matter tutor, and assessment writer. ' +
    'Turn YouTube lesson content into a real course lesson with a study guide and a rigorous 10-question quiz.\n\n' +
    'Course title: ' + ctx.courseTitle + '\n' +
    'Channel name: ' + ctx.channelName + '\n' +
    'Lesson title: ' + ctx.lessonTitle + '\n' +
    'Video description: ' + (ctx.lessonDescription || 'N/A') + '\n' +
    'Transcript status: ' + (ctx.transcriptStatus || 'unavailable') + '\n\n' +
    transcriptBlock +
    neighborsBlock +
    'Requirements for the lesson guide:\n' +
    '1. Write a detailed overview (at least 3 sentences).\n' +
    '2. List 3 to 7 specific learning objectives.\n' +
    '3. Identify 5 to 10 key concepts.\n' +
    '4. Write a detailed step-by-step explanation.\n' +
    '5. Include practical examples.\n' +
    '6. Include terminology with definitions.\n' +
    '7. Include common misunderstandings.\n' +
    '8. Include why this lesson matters.\n' +
    '9. Include a review summary.\n' +
    '10. Include a review checklist.\n\n' +
    'Requirements for the quiz (EXACTLY 10 questions):\n' +
    '- Each question: 4 options, 1 correct, correctIndex 0-3\n' +
    '- Include difficulty: beginner/intermediate/applied\n' +
    '- Include conceptTested for each question\n' +
    '- Include detailed explanation for each question\n' +
    '- Include wrongAnswerExplanations array for each question\n' +
    '- At least 3 beginner, 4 intermediate, 3 applied questions\n' +
    '- NO generic questions like "What is the main topic?"\n' +
    '- NO filler options like "Unrelated concept"\n' +
    '- Questions must test specific understanding, not title recognition\n\n' +
    '\n=== QUALITY ENFORCEMENT ===\n' +
    'Examples of questions that WILL BE REJECTED (NEVER generate these):\n' +
    '- "What is the main topic of this video?"\n' +
    '- "What is this video about?"\n' +
    '- "Which option best describes the title?"\n' +
    '- "What does the speaker discuss?"\n' +
    '- "What is the main idea?"\n' +
    '- "What is covered in this lesson?"\n' +
    '- "What is the purpose of this video?"\n' +
    '- Any question that could be answered without watching the video\n' +
    '- Any question that only tests title recognition\n\n' +
    'Examples of questions that WILL BE ACCEPTED (generate these instead):\n' +
    'For a lesson about AutoCAD batch plotting:\n' +
    '- beginner: "What does the PUBLISH command in AutoCAD do?"\n' +
    '- intermediate: "Which file formats can AutoCAD batch plot to simultaneously?"\n' +
    '- applied: "If a user needs to plot 50 drawings to both PDF and DWF, what setup step is required before running the batch?"\n\n' +
    'For a lesson about React hooks:\n' +
    '- beginner: "What value does useState return in its array destructuring?"\n' +
    '- intermediate: "Why does React require stable references in the useEffect dependency array?"\n' +
    '- applied: "If a useEffect runs infinitely, what is the most likely cause and how do you fix it?"\n\n' +
    'RULE: Every question must test SPECIFIC KNOWLEDGE from the lesson content.\n' +
    'RULE: A student should NOT be able to answer correctly just from the question title.\n' +
    'RULE: Include at least 2 beginner, 3 intermediate, 2 applied questions.\n' +
    'RULE: Wrong answers must be plausible and related to the topic, not random.\n\n' +
    'Return ONLY valid JSON (no markdown, no backticks, no commentary):\n' +
    '{"lessonGuide":{"overview":"...","learningObjectives":["..."],"keyConcepts":["..."],"detailedExplanation":"...","examples":["..."],"terminology":[{"term":"...","definition":"..."}],"commonMistakes":["..."],"whyItMatters":"...","summary":"...","reviewChecklist":["..."]},"quiz":{"studyOutline":["..."],"questions":[{"id":"q1","question":"...","options":["A","B","C","D"],"correctIndex":0,"difficulty":"beginner","conceptTested":"...","explanation":"...","wrongAnswerExplanations":["...","...","...","..."]}}]}'
  )
}

// ─── JSON extraction ─────────────────────────────────────────────────────

function extractJson<T>(content: string): T | null {
  try {
    // Try to find JSON object in the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0]) as T
  } catch {
    return null
  }
}

// ─── Connection Testing ──────────────────────────────────────────────────

export async function testKimiConnection(apiKey?: string): Promise<ConnectionTestResult> {
  const key = apiKey || getAiKeys().kimiKey
  if (!key) return { provider: 'kimi', status: 'no_key' }
  const start = performance.now()
  try {
    await callKimi('Say pong', 'kimi-k2.6')
    return { provider: 'kimi', status: 'connected', latencyMs: Math.round(performance.now() - start) }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { provider: 'kimi', status: 'failed', error: msg }
  }
}

export async function testOpenRouterConnection(apiKey?: string): Promise<ConnectionTestResult> {
  const key = apiKey || getAiKeys().openRouterKey
  if (!key) return { provider: 'openrouter', status: 'no_key' }
  const start = performance.now()
  try {
    await callOpenRouterWithFallback(key, [{ role: 'user', content: 'Say pong' }])
    return { provider: 'openrouter', status: 'connected', latencyMs: Math.round(performance.now() - start) }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { provider: 'openrouter', status: 'failed', error: msg }
  }
}

export async function testYouTubeConnection(apiKey?: string): Promise<ConnectionTestResult> {
  const key = apiKey || getAiKeys().ytKey
  if (!key) return { provider: 'youtube', status: 'no_key' }
  const start = performance.now()
  try {
    const res = await fetch(YOUTUBE_API_URL + '/channels?part=snippet&forHandle=google&key=' + encodeURIComponent(key))
    if (!res.ok) return { provider: 'youtube', status: 'failed', error: 'HTTP ' + res.status }
    return { provider: 'youtube', status: 'connected', latencyMs: Math.round(performance.now() - start) }
  } catch (err) {
    return { provider: 'youtube', status: 'failed', error: String(err) }
  }
}

// ─── Context types ───────────────────────────────────────────────────────

export interface LessonGuideQuizContext {
  courseTitle: string
  channelName: string
  lessonTitle: string
  lessonDescription?: string
  transcript?: string
  transcriptStatus?: string
  neighboringTitles?: string[]
  lessonIndex: number
}

// ─── Main generation function ────────────────────────────────────────────

export interface LessonGuideQuizResult {
  lessonGuide: LessonGuide
  quiz: Quiz
  provider: 'kimi' | 'openrouter'
  model: string
}

export async function generateLessonGuideAndQuiz(
  ctx: LessonGuideQuizContext,
): Promise<AiResult<LessonGuideQuizResult>> {
  diagnoseKeys()

  // Safe debug logging — NEVER log full API keys
  console.group('[CourseForge] Lesson Guide + Quiz Generation')
  console.log('courseTitle:', ctx.courseTitle)
  console.log('lessonTitle:', ctx.lessonTitle)
  console.log('lessonDescription length:', ctx.lessonDescription?.length || 0)
  console.log('lessonDescription preview:', ctx.lessonDescription?.substring(0, 100) || 'N/A')
  console.log('transcriptStatus:', ctx.transcriptStatus)
  console.log('transcript length:', ctx.transcript?.length || 0)
  console.log('neighboringVideoTitles count:', ctx.neighboringTitles?.length || 0)
  console.log('lessonIndex:', ctx.lessonIndex)
  const { openRouterKey, kimiKey } = getAiKeys()
  console.log('openRouterKey:', maskKey(openRouterKey))
  console.log('kimiKey:', maskKey(kimiKey))
  console.groupEnd()

  if (!hasAnyAIKey()) {
    return {
      ok: false,
      provider: 'none',
      errorCode: 'NO_AI_KEY',
      errorMessage: 'No AI API key found. Add a Kimi or OpenRouter key in Settings.',
      fallbackUsed: true,
    }
  }

  const prompt = buildLessonGuideAndQuizPrompt(ctx)
  const errors: string[] = []

  // Try Kimi first
  try {
    console.log('[AiProvider] Trying Kimi for lesson guide + 10-question quiz...')
    const content = await callKimi(prompt, 'kimi-k2.6')
    console.log('[AiProvider] Kimi raw response length:', content.length)
    const parsed = extractJson<{ lessonGuide: unknown; quiz: unknown }>(content)

    if (!parsed) {
      errors.push('Kimi: Could not parse JSON response')
      console.error('[AiProvider] Kimi: JSON parse failed. Raw preview:', content.substring(0, 300))
    } else {
      const quizValidation = validateQuizOutput(parsed.quiz as Record<string, unknown>)
      const guideValidation = validateLessonGuide(parsed.lessonGuide as Record<string, unknown>)

      console.log('[AiProvider] Kimi quiz validation:', quizValidation.ok ? 'PASSED' : 'FAILED', quizValidation.error || '')
      console.log('[AiProvider] Kimi guide validation:', guideValidation.ok ? 'PASSED' : 'FAILED', guideValidation.error || '')

      if (!quizValidation.ok) {
        errors.push('Kimi quiz validation failed: ' + quizValidation.error)
      } else if (!guideValidation.ok) {
        errors.push('Kimi guide validation failed: ' + guideValidation.error)
      } else {
        const result = buildResult(parsed, 'kimi', 'kimi-k2.6')
        console.log('[AiProvider] Kimi SUCCESS — provider: kimi, model: kimi-k2.6, quizQuestions:', result.quiz.questions.length)
        return { ok: true, provider: 'kimi', model: 'kimi-k2.6', data: result }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[AiProvider] Kimi FAILED:', msg)
    errors.push('Kimi: ' + msg.substring(0, 100))
    if (msg.includes('KIMI_QUOTA_EXCEEDED')) {
      errors.push('(Kimi quota exceeded — falling back to OpenRouter)')
    }
  }

  // Try OpenRouter: loop through free models until one works
  try {
    let lastError = ''

    for (let i = 0; i < OR_FREE_MODELS.length; i++) {
      const model = OR_FREE_MODELS[i]
      console.log(`[AiProvider] Trying OpenRouter model ${i + 1}/${OR_FREE_MODELS.length}: ${model}`)

      // Build progressively stronger prompt on later attempts
      let attemptPrompt = prompt
      if (i === 1) {
        attemptPrompt += '\n\nCRITICAL: You MUST include exactly 10 quiz questions with difficulty distribution: at least 2 beginner, at least 3 intermediate, at least 2 applied.'
      } else if (i >= 2) {
        attemptPrompt += '\n\nMANDATORY RULE - Your JSON quiz MUST have exactly 10 questions. Difficulty counts must be: beginner≥2, intermediate≥3, applied≥2. Double-check before responding.'
      }

      try {
        const content = await callOpenRouter(attemptPrompt, model)
        console.log(`[AiProvider] ${model} response length:`, content.length)
        const parsed = extractJson<{ lessonGuide: unknown; quiz: unknown }>(content)

        if (!parsed) {
          console.error(`[AiProvider] ${model}: JSON parse failed`)
          lastError = 'JSON parse failed'
          continue // try next model
        }

        const quizValidation = validateQuizOutput(parsed.quiz as Record<string, unknown>)
        const guideValidation = validateLessonGuide(parsed.lessonGuide as Record<string, unknown>)

        console.log(`[AiProvider] ${model} quiz:`, quizValidation.ok ? 'PASSED' : 'FAILED', quizValidation.error || '')
        console.log(`[AiProvider] ${model} guide:`, guideValidation.ok ? 'PASSED' : 'FAILED', guideValidation.error || '')

        if (quizValidation.ok && guideValidation.ok) {
          const result = buildResult(parsed, 'openrouter', model)
          console.log(`[AiProvider] OpenRouter SUCCESS with ${model}`)
          return { ok: true, provider: 'openrouter', model, data: result }
        }

        if (!quizValidation.ok) {
          lastError = quizValidation.error || 'validation failed'
          errors.push(`${model}: ${lastError}`)
        } else if (!guideValidation.ok) {
          errors.push(`${model}: guide ${guideValidation.error}`)
        }
      } catch (modelErr) {
        const msg = modelErr instanceof Error ? modelErr.message : String(modelErr)
        console.error(`[AiProvider] ${model} failed:`, msg.substring(0, 100))
        lastError = msg
        if (msg.includes('404')) {
          continue // model not found, try next one
        }
        // For non-404 errors, still try next model
        errors.push(`${model}: ${msg.substring(0, 100)}`)
      }
    }

    console.log('[AiProvider] All OpenRouter models failed. Last error:', lastError)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[AiProvider] OpenRouter FAILED:', msg)
    errors.push('OpenRouter: ' + msg.substring(0, 100))
  }

  // Both providers failed validation
  console.error('[AiProvider] All providers failed. Errors:', errors)

  // Format a user-friendly error message
  // Categorize errors by their actual content
  const hasUnauthorized = errors.some((e) => e.includes('UNAUTHORIZED') || e.includes('Missing Authentication'))
  // Validation errors: "Need at least X, found Y" or count mismatches
  const hasValidationError = errors.some((e) =>
    /Need at least \d+/.test(e) ||
    /found \d+/.test(e) ||
    e.includes('too concentrated') ||
    e.includes('generic') ||
    e.includes('filler')
  )
  // Quota: only when EVERY non-empty error is a quota/429/fallback
  const quotaErrors = errors.filter((e) => e.length > 0)
  const allProvidersQuota = quotaErrors.length > 0 && quotaErrors.every((e) =>
    e.includes('QUOTA') || e.includes('429') || e.includes('RATE_LIMIT') || e.includes('falling back')
  )

  let userMessage: string
  if (hasUnauthorized) {
    userMessage = 'API key rejected (401). Your key may be wrong or expired. Open Settings and re-enter your API key.'
  } else if (hasValidationError && !allProvidersQuota) {
    // Got a response but quiz quality failed - tell user to retry
    userMessage = 'AI generated content but the quiz did not meet quality standards. Click Generate again — the system will retry with stronger instructions.'
  } else if (allProvidersQuota) {
    userMessage = 'API quota exceeded on all providers. Try again later or switch to a different AI provider in Settings.'
  } else {
    userMessage = errors.length
      ? 'All AI providers failed:\n• ' + errors.slice(0, 3).join('\n• ')
      : 'AI generation failed. No valid content was produced.'
  }

  return {
    ok: false,
    provider: 'none',
    errorCode: 'AI_VALIDATION_FAILED',
    errorMessage: userMessage,
    fallbackUsed: true,
  }
}

/** Build a validated result object from parsed JSON */
function buildResult(
  parsed: { lessonGuide: unknown; quiz: unknown },
  provider: 'kimi' | 'openrouter',
  model: string,
): LessonGuideQuizResult {
  const lg = parsed.lessonGuide as Record<string, unknown>
  const qz = parsed.quiz as Record<string, unknown>
  const rawQuestions = (qz.questions || []) as Array<Record<string, unknown>>

  // Shuffle options and recalculate correctIndex
  // Track correct answer by its original position, NOT by text value,
  // so duplicate answer texts don't all cluster at the same index.
  const questions: QuizQuestion[] = rawQuestions.map((q, i) => {
    const options = (q.options as string[]) || []
    const correctIdx = Math.min(Math.max(0, (q.correctIndex as number) || 0), options.length - 1)

    // Tag each option with its original index so we can identify the correct one after shuffling
    const tagged = options.map((opt, idx) => ({ text: opt, isCorrect: idx === correctIdx }))
    const shuffled = shuffle(tagged)
    const newCorrectIndex = shuffled.findIndex((t) => t.isCorrect)

    return {
      id: String(q.id || 'q' + (i + 1)),
      question: String(q.question || ''),
      options: shuffled.map((t) => t.text),
      correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
      difficulty: (q.difficulty as 'beginner' | 'intermediate' | 'applied') || 'intermediate',
      conceptTested: String(q.conceptTested || ''),
      explanation: String(q.explanation || ''),
      wrongAnswerExplanations: Array.isArray(q.wrongAnswerExplanations)
        ? q.wrongAnswerExplanations as string[]
        : undefined,
    }
  })

  const lessonGuide: LessonGuide = {
    overview: String(lg.overview || ''),
    learningObjectives: Array.isArray(lg.learningObjectives) ? lg.learningObjectives as string[] : [],
    keyConcepts: Array.isArray(lg.keyConcepts) ? lg.keyConcepts as string[] : [],
    detailedExplanation: String(lg.detailedExplanation || ''),
    examples: Array.isArray(lg.examples) ? lg.examples as string[] : [],
    terminology: Array.isArray(lg.terminology) ? (lg.terminology as Array<{ term: string; definition: string }>) : [],
    commonMistakes: Array.isArray(lg.commonMistakes) ? lg.commonMistakes as string[] : [],
    whyItMatters: String(lg.whyItMatters || ''),
    summary: String(lg.summary || ''),
    reviewChecklist: Array.isArray(lg.reviewChecklist) ? lg.reviewChecklist as string[] : [],
  }

  const studyOutline = Array.isArray(qz.studyOutline) ? qz.studyOutline as string[] : []

  return {
    lessonGuide,
    quiz: {
      id: 'quiz-' + Date.now(),
      lessonId: '',
      provider,
      model,
      aiGenerated: true,
      fallbackUsed: false,
      questions,
      createdAt: new Date().toISOString(),
      studyOutline,
    },
    provider,
    model,
  }
}

// ─── Course generation ───────────────────────────────────────────────────

export async function generateCourse(
  channelName: string,
  videoTitles: string[],
): Promise<AiResult<{ title: string; modules: Array<{ title: string; lessons: Array<{ title: string; duration: string }> }> }>> {
  if (!hasAnyAIKey()) {
    return {
      ok: false,
      provider: 'none',
      errorCode: 'NO_AI_KEY',
      errorMessage: 'No AI API key found. Add a key in Settings.',
      fallbackUsed: true,
    }
  }

  const videoList = videoTitles.map((v, i) => (i + 1) + '. "' + v + '"').join('\n')
  const prompt = (
    'Create a structured learning course from the YouTube channel "' + channelName + '".' +
    '\nVideo titles:\n' + videoList +
    '\nReturn ONLY JSON: {"title":"...","modules":[{"title":"...","lessons":[{"title":"...","duration":"8:32"}]}]}'
  )

  try {
    const content = await callKimi(prompt, 'kimi-k2.6')
    const parsed = extractJson<{ title: string; modules: Array<{ title: string; lessons: Array<{ title: string; duration: string }> }> }>(content)
    if (parsed) return { ok: true, provider: 'kimi', model: 'kimi-k2.6', data: parsed }
  } catch (err) {
    /* fall through — logged */ console.debug("[CourseForge] Caught (expected):", err instanceof Error ? err.message : String(err));
  }

  try {
    const { openRouterKey } = getAiKeys()
    if (openRouterKey) {
      const content = await callOpenRouterWithFallback(openRouterKey, [{ role: 'user', content: prompt }])
      const parsed = extractJson<{ title: string; modules: Array<{ title: string; lessons: Array<{ title: string; duration: string }> }> }>(content)
      if (parsed) return { ok: true, provider: 'openrouter', model: 'fallback-loop', data: parsed }
    }
  } catch (err) {
    /* fall through — logged */ console.debug("[CourseForge] Caught (expected):", err instanceof Error ? err.message : String(err));
  }

  return {
    ok: false,
    provider: 'none',
    errorCode: 'AI_FAILED',
    errorMessage: 'Course generation failed. Check your API keys.',
    fallbackUsed: true,
  }
}

// ─── Explain wrong answer ────────────────────────────────────────────────

export async function explainWrongAnswer(
  question: string,
  correctAnswer: string,
  selectedAnswer: string,
  context: string,
): Promise<string> {
  if (!hasAnyAIKey()) return 'AI unavailable. Add an API key for detailed explanations.'

  const prompt = (
    'Question: ' + question + '\n' +
    'Correct answer: ' + correctAnswer + '\n' +
    'Student selected: ' + selectedAnswer + '\n' +
    'Lesson context: ' + context + '\n\n' +
    'Explain why the student\'s answer is wrong and why the correct answer is right. Keep it under 3 sentences.'
  )

  try {
    return await callKimi(prompt, 'kimi-k2.6')
  } catch {
    try {
      const { openRouterKey } = getAiKeys()
      if (openRouterKey) {
        return await callOpenRouterWithFallback(openRouterKey, [{ role: 'user', content: prompt }])
      }
      return 'AI explanation unavailable. Add an API key for detailed explanations.'
    } catch {
      return 'AI explanation unavailable. Review the lesson content for more details.'
    }
  }
}
