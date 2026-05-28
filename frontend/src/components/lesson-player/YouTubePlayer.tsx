import { useState } from 'react'
import { Play, KeyRound, AlertCircle } from 'lucide-react'
import type { Lesson } from './types'
import type { Course } from './types'

interface YouTubePlayerProps {
  lesson: Lesson
  course?: Course
}

export default function YouTubePlayer({ lesson, course }: YouTubePlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  const videoId = lesson.videoId || ''
  // Known placeholder IDs from old demo courses - treat as demo
  const PLACEHOLDER_IDS = ['dQw4w9WgXcQ', 'rfscVS0vtbw', '9bZkp7q19f0', 'M7lc1UVf-VE', 'jNQXAC9IVRw', 'LXb3EKWsInQ']
  const isDemo = videoId === 'DEMO' || course?.demo === true || PLACEHOLDER_IDS.includes(videoId)
  const hasValidId = !isDemo && videoId.length > 0 && videoId !== 'undefined'

  // Demo mode placeholder
  if (isDemo) {
    return (
      <div className="w-full">
        <div
          className="relative w-full overflow-hidden flex flex-col items-center justify-center"
          style={{
            aspectRatio: '16/9',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(10, 46, 82, 0.08)',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          }}
        >
          <div className="flex flex-col items-center justify-center text-center px-6">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(0, 119, 182, 0.2)' }}
            >
              <KeyRound size={28} style={{ color: '#48CAE4' }} />
            </div>
            <h3
              style={{
                color: '#CAF0F8',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '1.25rem',
                fontWeight: 500,
                marginBottom: '8px',
              }}
            >
              Demo Mode
            </h3>
            <p
              style={{
                color: '#90E0EF',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 300,
                maxWidth: '400px',
                lineHeight: 1.5,
                marginBottom: '16px',
              }}
            >
              Add your YouTube API Key to see actual videos from <strong>{course?.channelName || 'this channel'}</strong> mapped to each lesson.
            </p>
            <button
              onClick={() => {
                // Dispatch custom event to open settings
                window.dispatchEvent(new CustomEvent('open-settings'))
              }}
              style={{
                background: 'linear-gradient(135deg, #0077B6, #48CAE4)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Add API Key in Settings
            </button>
          </div>
        </div>

        {/* Video Details */}
        <div style={{ padding: 'var(--space-md)' }}>
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
              color: 'var(--deep-ink)',
              fontWeight: 400,
              lineHeight: 1.3,
              marginBottom: 'var(--space-sm)',
            }}
          >
            {lesson.title}
          </h2>
          <div
            className="flex items-center gap-2"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: 'var(--stone)' }}
          >
            <Play size={12} style={{ color: 'var(--azure)' }} />
            <span>{lesson.duration}</span>
          </div>
        </div>
      </div>
    )
  }

  // Valid video ID - show YouTube embed
  if (hasValidId) {
    return (
      <div className="w-full">
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: '16/9',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(10, 46, 82, 0.08)',
          }}
        >
          {!isLoaded && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'var(--warm-sand)' }}
            >
              <div
                className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(0, 119, 182, 0.1)' }}
              >
                <Play size={28} style={{ color: 'var(--azure)', marginLeft: '4px' }} />
              </div>
              <p
                className="text-sm"
                style={{
                  color: 'var(--stone)',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                }}
              >
                Loading video...
              </p>
            </div>
          )}
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
            onLoad={() => setIsLoaded(true)}
            style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 300ms ease-out' }}
          />
        </div>

        {/* Video Details */}
        <div style={{ padding: 'var(--space-md)' }}>
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
              color: 'var(--deep-ink)',
              fontWeight: 400,
              lineHeight: 1.3,
              marginBottom: 'var(--space-sm)',
            }}
          >
            {lesson.title}
          </h2>
          <div
            className="flex items-center gap-2"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: 'var(--stone)' }}
          >
            <Play size={12} style={{ color: 'var(--azure)' }} />
            <span>{lesson.duration}</span>
          </div>
        </div>
      </div>
    )
  }

  // No valid video ID
  return (
    <div className="w-full">
      <div
        className="relative w-full overflow-hidden flex flex-col items-center justify-center"
        style={{
          aspectRatio: '16/9',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(10, 46, 82, 0.08)',
          backgroundColor: 'var(--abyss)',
        }}
      >
        <div className="flex flex-col items-center justify-center text-center px-6">
          <div
            className="mb-3 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(0, 119, 182, 0.1)' }}
          >
            <AlertCircle size={28} style={{ color: 'var(--azure)' }} />
          </div>
          <p
            style={{
              color: 'var(--parchment)',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 400,
            }}
          >
            Video unavailable
          </p>
          <p
            style={{
              color: 'var(--stone)',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 300,
              marginTop: '4px',
            }}
          >
            No video ID assigned to this lesson
          </p>
        </div>
      </div>

      {/* Video Details */}
      <div style={{ padding: 'var(--space-md)' }}>
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
            color: 'var(--deep-ink)',
            fontWeight: 400,
            lineHeight: 1.3,
            marginBottom: 'var(--space-sm)',
          }}
        >
          {lesson.title}
        </h2>
        <div
          className="flex items-center gap-2"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: 'var(--stone)' }}
        >
          <Play size={12} style={{ color: 'var(--azure)' }} />
          <span>{lesson.duration}</span>
        </div>
      </div>
    </div>
  )
}
