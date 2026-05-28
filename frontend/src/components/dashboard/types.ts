/**
 * Dashboard-specific types.
 * Course, Lesson, Module are imported from unified types at src/types/course.ts.
 * This file only contains YouTube API and settings types.
 */

import type { Course, Lesson } from '../../types/course'

export type { Course, Lesson }

export interface YouTubeChannelInfo {
  id: string
  name: string
  handle: string
  thumbnail: string
  subscriberCount: string
  videoCount: string
  demo?: boolean
}

export type GenerationStep =
  | 'Fetching channel videos...'
  | 'Extracting transcripts...'
  | 'Analyzing content with AI...'
  | 'Building course structure...'
  | 'Course ready!'

export const AI_MODELS = [
  {
    value: 'nvidia/nemotron-3-super-120b-a12b:free',
    label: 'Nemotron 3 Super 120B — Best quality, 1M context',
    description: 'Best overall — Recommended',
  },
  {
    value: 'deepseek/deepseek-v4-flash:free',
    label: 'DeepSeek V4 Flash — Long context',
    description: '1M token context window',
  },
  {
    value: 'meta-llama/llama-3.3-70b-instruct:free',
    label: 'Llama 3.3 70B — Reliable',
    description: 'Well-tested, great general performance',
  },
  {
    value: 'nvidia/nemotron-nano-12b-v2-vl:free',
    label: 'Nemotron Nano 12B VL — Vision',
    description: 'Fast, can process images/video thumbnails',
  },
  {
    value: 'liquid/lfm-2.5-1.2b-instruct:free',
    label: 'LFM 2.5 1.2B — Fastest',
    description: 'Ultra-fast, good for quick tasks',
  },
  {
    value: 'openrouter/free',
    label: 'OpenRouter Free Router',
    description: 'Auto-routes to any working free model',
  },
]
