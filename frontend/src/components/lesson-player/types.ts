/**
 * Lesson-player-specific types.
 * Course, Lesson, Module are imported from unified types.
 * This file only contains chat/panel types.
 */

import type { Course, Lesson, Module } from '../../types/course'

export type { Course, Lesson, Module }

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export type PanelType = 'tutor' | 'notes' | 'quiz' | null
