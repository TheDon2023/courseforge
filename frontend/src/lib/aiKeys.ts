/**
 * aiKeys.ts -- Centralized AI key resolver with cleaning and diagnostics.
 *
 * Rules:
 * - One function reads ALL AI keys from localStorage + env.
 * - Keys are cleaned (strip accidental "Bearer " prefix, trim whitespace).
 * - Keys are masked in all logs (never expose full key).
 * - diagnoseKeys() auto-runs so devs can see key status in console.
 */

export interface AiKeys {
  openRouterKey: string
  kimiKey: string
  ytKey: string
}

function cleanKey(value: string | null | undefined): string {
  let key = String(value || '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    // Remove accidental surrounding quotes (copy-paste artifact)
    .replace(/^["']|["']$/g, '')
    // Remove invisible zero-width characters
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
  return key
}

export function getAiKeys(): AiKeys {
  return {
    openRouterKey: cleanKey(
      localStorage.getItem('courseforge_openrouter_api_key') ||
      localStorage.getItem('openRouterApiKey') ||
      localStorage.getItem('openrouter_api_key') ||
      import.meta.env.VITE_OPENROUTER_API_KEY,
    ),
    kimiKey: cleanKey(
      localStorage.getItem('courseforge_kimi_api_key') ||
      localStorage.getItem('kimiApiKey') ||
      localStorage.getItem('kimi_api_key') ||
      import.meta.env.VITE_KIMI_API_KEY ||
      import.meta.env.VITE_MOONSHOT_API_KEY,
    ),
    ytKey: cleanKey(
      localStorage.getItem('courseforge_youtube_api_key') ||
      localStorage.getItem('youtubeApiKey') ||
      import.meta.env.VITE_YOUTUBE_API_KEY,
    ),
  }
}

export function maskKey(key: string): string {
  if (!key) return 'MISSING'
  if (key.length <= 12) return '*** (' + key.length + ' chars)'
  return key.slice(0, 8) + '...' + key.slice(-4) + ' (' + key.length + ' chars)'
}

export function hasAnyAIKey(): boolean {
  const { openRouterKey, kimiKey } = getAiKeys()
  return Boolean(openRouterKey) || Boolean(kimiKey)
}

export function diagnoseKeys(): void {
  const { openRouterKey, kimiKey, ytKey } = getAiKeys()
  console.group('🔑 KEY DIAGNOSTIC')
  console.log('OpenRouter:', maskKey(openRouterKey))
  console.log('Kimi:', maskKey(kimiKey))
  console.log('YouTube:', maskKey(ytKey))
  console.groupEnd()
}
