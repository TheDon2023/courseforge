import { ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer
      className="w-full"
      style={{
        background: 'var(--gradient-hero)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="mx-auto px-6 py-8"
        style={{ maxWidth: 'var(--max-width-lg)' }}
      >
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" style={{ width: '24px', height: '24px', opacity: 0.7 }} />
            <span
              className="text-sm"
              style={{
                color: 'var(--ice)',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 400,
              }}
            >
              CourseForge
            </span>
          </div>

          {/* Tagline */}
          <p
            className="text-xs"
            style={{
              color: 'var(--cyan)',
              opacity: 0.5,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
            }}
          >
            Built with YouTube + OpenRouter AI
          </p>

          {/* Link */}
          <a
            href="https://openrouter.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs transition-colors hover:text-white"
            style={{
              color: 'var(--cyan)',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
            }}
          >
            OpenRouter <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </footer>
  )
}

