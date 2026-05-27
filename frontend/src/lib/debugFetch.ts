/**
 * debugFetch -- Drop-in debugging wrapper for fetch.
 *
 * Usage: Replace `fetch(url, options)` with `debugFetch('label', url, options)`
 * Prints: URL, headers (masked), body, status, raw response, parsed JSON.
 */

function maskSecret(value: string): string {
  if (!value) return 'MISSING'
  if (value.length <= 12) return '***'
  return value.slice(0, 6) + '...' + value.slice(-4)
}

function sanitizeHeaders(headers: unknown): Record<string, unknown> {
  const safe: Record<string, unknown> = {}
  const normalized =
    headers instanceof Headers
      ? Object.fromEntries(headers.entries())
      : (headers as Record<string, string>)

  for (const [key, value] of Object.entries(normalized || {})) {
    const lower = key.toLowerCase()
    if (
      lower.includes('authorization') ||
      lower.includes('api-key') ||
      lower.includes('apikey') ||
      lower.includes('x-goog-api-key')
    ) {
      safe[key] = maskSecret(String(value))
    } else {
      safe[key] = value
    }
  }
  return safe
}

export async function debugFetch(
  label: string,
  url: string,
  options: RequestInit = {},
): Promise<{ response: Response; rawText: string; parsed: unknown }> {
  console.group('🔍 API DEBUG: ' + label)
  console.log('URL:', url)
  console.log('Method:', options.method || 'GET')

  const headers = options.headers || {}
  console.log('Headers:', sanitizeHeaders(headers))

  if (options.body) {
    try {
      const bodyStr = typeof options.body === 'string' ? options.body : String(options.body)
      const parsed = JSON.parse(bodyStr)
      // Mask the body if it contains an api_key field
      if (parsed && typeof parsed === 'object') {
        const masked = { ...parsed }
        for (const key of Object.keys(masked)) {
          if (key.toLowerCase().includes('key')) {
            masked[key] = maskSecret(String(masked[key]))
          }
        }
        console.log('Request body:', masked)
      } else {
        console.log('Request body:', parsed)
      }
    } catch {
      console.log('Request body:', options.body)
    }
  }

  try {
    const response = await fetch(url, options)
    console.log('Status:', response.status, response.statusText)
    console.log('OK:', response.ok)

    const rawText = await response.text()
    console.log('Raw response:', rawText.substring(0, 500))

    let parsed: unknown = null
    try {
      parsed = rawText ? JSON.parse(rawText) : null
      console.log('Parsed JSON:', parsed)
    } catch {
      console.warn('Response was not valid JSON')
    }

    console.groupEnd()
    return { response, rawText, parsed }
  } catch (error) {
    console.error('Fetch FAILED:', error)
    console.groupEnd()
    throw error
  }
}

/**
 * Quick diagnostic: print all localStorage keys related to API keys.
 * Run this in the browser console to verify keys are saved.
 */
export function diagnoseKeys(): void {
  console.group('🔑 KEY DIAGNOSTIC')
  const keys = Object.keys(localStorage).filter(
    (k) =>
      k.toLowerCase().includes('key') ||
      k.toLowerCase().includes('api') ||
      k.toLowerCase().includes('openrouter') ||
      k.toLowerCase().includes('kimi') ||
      k.toLowerCase().includes('courseforge'),
  )

  if (keys.length === 0) {
    console.warn('No API keys found in localStorage!')
  } else {
    for (const k of keys) {
      const val = localStorage.getItem(k)
      console.log(k + ':', val ? val.slice(0, 8) + '...' + val.slice(-4) + ' (' + val.length + ' chars)' : 'EMPTY')
    }
  }

  // Check the specific keys AiProvider looks for
  console.log('--- Keys AiProvider expects ---')
  console.log('courseforge_openrouter_api_key:', localStorage.getItem('courseforge_openrouter_api_key') ? '✅ PRESENT (' + localStorage.getItem('courseforge_openrouter_api_key')!.length + ' chars)' : '❌ MISSING')
  console.log('courseforge_kimi_api_key:', localStorage.getItem('courseforge_kimi_api_key') ? '✅ PRESENT (' + localStorage.getItem('courseforge_kimi_api_key')!.length + ' chars)' : '❌ MISSING')
  console.log('courseforge_youtube_api_key:', localStorage.getItem('courseforge_youtube_api_key') ? '✅ PRESENT (' + localStorage.getItem('courseforge_youtube_api_key')!.length + ' chars)' : '❌ MISSING')

  console.groupEnd()
}

// Auto-run diagnostic on import
if (typeof window !== 'undefined') {
  diagnoseKeys()
}
