import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Search,
  Sparkles,
  Brain,
  Zap,
  MessageCircle,
  CheckCircle,
  Trophy,
  ChevronDown,
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

/* ───────────────────────── Hero Section ───────────────────────── */

function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const eyebrowRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const chevronRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

      // 1. Video fades in
      tl.fromTo(
        videoRef.current,
        { opacity: 0 },
        { opacity: 0.6, duration: 1.2 }
      )

      // 2. Eyebrow slides up
      tl.fromTo(
        eyebrowRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        '-=0.8'
      )

      // 3. Headline words stagger
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.hero-word')
        tl.fromTo(
          words,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.15 },
          '-=0.4'
        )
      }

      // 4. Subheadline
      tl.fromTo(
        subRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        '-=0.3'
      )

      // 5. CTA
      tl.fromTo(
        ctaRef.current,
        { y: 20, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8 },
        '-=0.4'
      )

      // 6. Chevron
      tl.fromTo(
        chevronRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8 },
        '-=0.2'
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: '100dvh' }}
    >
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0 }}
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

      {/* Fallback image */}
      <div
        className="absolute inset-0 h-full w-full bg-cover bg-center"
        style={{ backgroundImage: 'url(/hero-bg.jpg)', zIndex: 0, opacity: 0.6 }}
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'var(--gradient-hero)', zIndex: 1 }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex flex-col items-center px-6 text-center" style={{ maxWidth: '960px' }}>
        {/* Eyebrow */}
        <div
          ref={eyebrowRef}
          className="mb-6"
          style={{ opacity: 0 }}
        >
          <span
            className="text-xs uppercase"
            style={{
              color: 'var(--sky)',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.15em',
              fontWeight: 400,
            }}
          >
            AI-POWERED LEARNING
          </span>
        </div>

        {/* Headline */}
        <h1
          ref={headlineRef}
          className="mb-6 font-display"
          style={{
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            fontWeight: 400,
            color: 'var(--ice)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          <span className="hero-word inline-block" style={{ opacity: 0 }}>Learn</span>{' '}
          <span className="hero-word inline-block" style={{ opacity: 0 }}>Anything.</span>
        </h1>

        {/* Subheadline */}
        <p
          ref={subRef}
          className="mb-10 max-w-[560px]"
          style={{
            color: 'var(--cyan)',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: 'clamp(1rem, 2vw, 1.5rem)',
            lineHeight: 1.6,
            opacity: 0,
          }}
        >
          Turn any YouTube channel into a personal, interactive course guided by AI.
        </p>

        {/* CTA */}
        <div ref={ctaRef} style={{ opacity: 0 }}>
          <Link
            to="/app"
            className="inline-flex items-center rounded-xl px-8 py-4 font-normal transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'var(--gradient-accent)',
              color: 'var(--deep-ink)',
              fontFamily: "'Inter', sans-serif",
              fontSize: '1.125rem',
              transitionDuration: '150ms',
            }}
          >
            Start Learning Now
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        ref={chevronRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ opacity: 0, zIndex: 10 }}
      >
        <ChevronDown
          size={24}
          className="animate-pulse-down"
          style={{ color: 'var(--cyan)' }}
        />
      </div>
    </section>
  )
}

/* ─────────────────────── How It Works Section ─────────────────────── */

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Choose a Channel',
    description: 'Search for any YouTube channel or paste a URL. We index every video automatically.',
  },
  {
    icon: Sparkles,
    number: '02',
    title: 'AI Builds Your Course',
    description: "Our AI analyzes content, structures modules, and crafts quizzes — all tailored to the channel's unique knowledge.",
  },
  {
    icon: Brain,
    number: '03',
    title: 'Learn With Your AI Tutor',
    description: 'Jump into interactive lessons with a conversational AI tutor that answers questions, tests your knowledge, and adapts to you.',
  },
]

function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])
  const dotRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Card reveals
      cardsRef.current.forEach((card, i) => {
        if (!card) return
        gsap.fromTo(
          card,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
            delay: i * 0.2,
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )

        // Icon scale
        const iconEl = card.querySelector('.step-icon')
        if (iconEl) {
          gsap.fromTo(
            iconEl,
            { scale: 0.8 },
            {
              scale: 1,
              duration: 0.6,
              ease: 'back.out(1.7)',
              delay: i * 0.2 + 0.1,
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          )
        }
      })

      // Traveling dot on connecting line
      if (dotRef.current && lineRef.current) {
        gsap.fromTo(
          dotRef.current,
          { left: '0%' },
          {
            left: '100%',
            duration: 2,
            ease: 'power3.inOut',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 60%',
              toggleActions: 'play none none none',
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      style={{
        backgroundColor: 'var(--abyss)',
        paddingTop: 'var(--space-4xl)',
        paddingBottom: 'var(--space-4xl)',
      }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: 'var(--max-width-lg)' }}>
        {/* Section header */}
        <div className="mb-16 text-center">
          <span
            className="mb-4 block text-xs uppercase"
            style={{
              color: 'var(--sky)',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.15em',
              fontWeight: 400,
            }}
          >
            THE PROCESS
          </span>
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
              color: 'var(--ice)',
              fontWeight: 400,
            }}
          >
            Three steps to your personal course
          </h2>
        </div>

        {/* Steps grid */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div
            ref={lineRef}
            className="absolute left-0 right-0 top-[48px] hidden md:block"
            style={{ height: '1px', backgroundColor: 'var(--azure)', opacity: 0.2 }}
          >
            <div
              ref={dotRef}
              className="absolute top-1/2 -translate-y-1/2"
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: 'var(--sky)',
                borderRadius: '50%',
                boxShadow: '0 0 8px var(--sky)',
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <div
                key={step.number}
                ref={(el) => { cardsRef.current[i] = el }}
                className="relative flex flex-col items-center text-center"
                style={{ opacity: 0 }}
              >
                {/* Icon circle */}
                <div
                  className="step-icon mb-6 flex items-center justify-center"
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(2, 62, 138, 0.4)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <step.icon size={28} style={{ color: 'var(--sky)' }} />
                </div>

                {/* Number */}
                <span
                  className="mb-3"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '2rem',
                    color: 'var(--azure)',
                    opacity: 0.4,
                    fontWeight: 400,
                  }}
                >
                  {step.number}
                </span>

                {/* Title */}
                <h3
                  className="mb-3"
                  style={{
                    fontSize: 'clamp(1.125rem, 1.5vw, 1.5rem)',
                    color: 'var(--ice)',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                  }}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    color: 'var(--cyan)',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    fontSize: '1rem',
                    lineHeight: 1.6,
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────── Features Section ─────────────────────── */

const features = [
  {
    icon: Zap,
    title: 'Smart Course Generation',
    description: 'AI automatically structures videos into logical modules with summaries, key concepts, and learning objectives.',
  },
  {
    icon: MessageCircle,
    title: 'Conversational AI Tutor',
    description: 'Ask questions in natural language. Get explanations, hints, and deeper dives on any concept — powered by free LLMs via OpenRouter.',
  },
  {
    icon: CheckCircle,
    title: 'Interactive Quizzes',
    description: 'AI-generated quizzes test your understanding after each module. Track your progress and identify knowledge gaps.',
  },
  {
    icon: Trophy,
    title: 'Progress Tracking',
    description: 'Visual progress indicators, completion badges, and a personal dashboard keep you motivated and on track.',
  },
]

function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, i) => {
        if (!card) return
        gsap.fromTo(
          card,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out',
            delay: i * 0.1,
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )

        const iconEl = card.querySelector('.feature-icon')
        if (iconEl) {
          gsap.fromTo(
            iconEl,
            { scale: 0.8 },
            {
              scale: 1,
              duration: 0.5,
              ease: 'back.out(1.7)',
              delay: i * 0.1 + 0.15,
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          )
        }
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="features"
      style={{
        backgroundColor: 'var(--deep-blue)',
        paddingTop: 'var(--space-4xl)',
        paddingBottom: 'var(--space-4xl)',
      }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: 'var(--max-width-lg)' }}>
        {/* Section header */}
        <div className="mb-16 text-center">
          <span
            className="mb-4 block text-xs uppercase"
            style={{
              color: 'var(--sky)',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.15em',
              fontWeight: 400,
            }}
          >
            FEATURES
          </span>
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
              color: 'var(--ice)',
              fontWeight: 400,
            }}
          >
            Everything you need to master any topic
          </h2>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              ref={(el) => { cardsRef.current[i] = el }}
              className="group rounded-2xl p-8 transition-all"
              style={{
                backgroundColor: 'rgba(2, 62, 138, 0.4)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                opacity: 0,
                transitionProperty: 'all',
                transitionDuration: '200ms',
                transitionTimingFunction: 'var(--ease-out)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.borderColor = 'rgba(255,255,255,0.15)'
                el.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.borderColor = 'rgba(255,255,255,0.08)'
                el.style.transform = 'translateY(0)'
              }}
            >
              <div
                className="feature-icon mb-4"
                style={{ transition: 'transform 200ms var(--ease-out)' }}
              >
                <feature.icon
                  size={24}
                  style={{ color: 'var(--sky)' }}
                  className="transition-transform group-hover:rotate-[5deg]"
                />
              </div>
              <h3
                className="mb-3"
                style={{
                  fontSize: 'clamp(1.125rem, 1.5vw, 1.5rem)',
                  color: 'var(--ice)',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  color: 'var(--cyan)',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: '1rem',
                  lineHeight: 1.6,
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────── Demo Preview Section ─────────────────────── */

function DemoPreviewSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const mockupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (mockupRef.current) {
        gsap.fromTo(
          mockupRef.current,
          { scale: 0.92, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: mockupRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        backgroundColor: 'var(--abyss)',
        paddingTop: 'var(--space-4xl)',
        paddingBottom: 'var(--space-4xl)',
      }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: 'var(--max-width-xl)' }}>
        {/* Section header */}
        <div className="mb-16 text-center">
          <span
            className="mb-4 block text-xs uppercase"
            style={{
              color: 'var(--sky)',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.15em',
              fontWeight: 400,
            }}
          >
            SEE IT IN ACTION
          </span>
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
              color: 'var(--ice)',
              fontWeight: 400,
            }}
          >
            Your personal classroom, reimagined
          </h2>
        </div>

        {/* Mockup container */}
        <div
          ref={mockupRef}
          className="animate-float mx-auto overflow-hidden rounded-2xl"
          style={{
            maxWidth: '1000px',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.4)',
            opacity: 0,
          }}
        >
          {/* Mockup chrome */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ backgroundColor: 'var(--deep-blue)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--accent-red)', opacity: 0.7 }} />
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'var(--accent-gold)', opacity: 0.7 }} />
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#22c55e', opacity: 0.7 }} />
            </div>
            <div
              className="mx-4 flex-1 rounded-md px-3 py-1 text-center text-xs"
              style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                color: 'var(--stone)',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              courseforge.app
            </div>
          </div>

          {/* Mockup content */}
          <div className="flex" style={{ minHeight: '480px' }}>
            {/* Sidebar */}
            <div
              className="hidden w-[200px] flex-shrink-0 flex-col gap-3 p-4 sm:flex"
              style={{ backgroundColor: 'var(--warm-sand)', borderRight: '1px solid rgba(10, 46, 82, 0.06)' }}
            >
              <div
                className="mb-2 text-xs uppercase"
                style={{
                  color: 'var(--stone)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 400,
                }}
              >
                Modules
              </div>
              {[1, 2, 3].map((m) => (
                <div key={m} className="flex flex-col gap-1.5">
                  <div
                    className="rounded-lg px-3 py-2 text-xs font-medium"
                    style={{
                      backgroundColor: m === 1 ? 'rgba(10, 46, 82, 0.06)' : 'transparent',
                      color: 'var(--deep-ink)',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Module {m}: {m === 1 ? 'Introduction' : m === 2 ? 'Core Concepts' : 'Advanced Topics'}
                  </div>
                  {[1, 2].map((l) => (
                    <div
                      key={`${m}-${l}`}
                      className="flex items-center gap-2 rounded-md px-3 py-1.5"
                      style={{ opacity: m === 1 ? 1 : 0.5 }}
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: m === 1 && l === 1 ? 'var(--sky)' : 'transparent',
                          border: m === 1 && l === 1 ? 'none' : '1px solid var(--stone)',
                        }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: 'var(--slate)', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
                      >
                        Lesson {l}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Main area */}
            <div className="flex flex-1 flex-col" style={{ backgroundColor: 'var(--parchment)' }}>
              {/* Top bar */}
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid rgba(10, 46, 82, 0.06)' }}
              >
                <div>
                  <div
                    className="mb-1 text-sm font-medium"
                    style={{ color: 'var(--deep-ink)', fontFamily: "'Inter', sans-serif" }}
                  >
                    Introduction to the Course
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: 'var(--stone)', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
                  >
                    Lesson 1 of 6
                  </div>
                </div>
                <div
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    backgroundColor: 'rgba(0, 180, 216, 0.1)',
                    color: 'var(--azure)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  17% complete
                </div>
              </div>

              {/* Video + Tutor split */}
              <div className="flex flex-1 flex-col md:flex-row">
                {/* Video area */}
                <div
                  className="flex flex-1 items-center justify-center"
                  style={{ backgroundColor: '#0a0a1a', minHeight: '240px' }}
                >
                  <div className="text-center">
                    <div
                      className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <div
                        className="ml-1 h-0 w-0"
                        style={{
                          borderTop: '8px solid transparent',
                          borderBottom: '8px solid transparent',
                          borderLeft: '14px solid var(--ice)',
                        }}
                      />
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: 'var(--stone)', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
                    >
                      YouTube Video Player
                    </div>
                  </div>
                </div>

                {/* AI Tutor panel */}
                <div
                  className="w-full flex-shrink-0 p-4 md:w-[280px]"
                  style={{ backgroundColor: '#FFFFFF', borderLeft: '1px solid rgba(10, 46, 82, 0.06)' }}
                >
                  <div
                    className="mb-4 flex items-center gap-2"
                  >
                    <Brain size={16} style={{ color: 'var(--azure)' }} />
                    <span
                      className="text-xs font-medium"
                      style={{ color: 'var(--deep-ink)', fontFamily: "'Inter', sans-serif" }}
                    >
                      AI Tutor
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Tutor message */}
                    <div
                      className="rounded-xl rounded-tl-sm px-3 py-2.5"
                      style={{ backgroundColor: 'var(--warm-sand)' }}
                    >
                      <p
                        className="text-xs"
                        style={{ color: 'var(--slate)', fontFamily: "'Inter', sans-serif", fontWeight: 300, lineHeight: 1.5 }}
                      >
                        Welcome! I'm your AI tutor for this course. Ask me anything about the material!
                      </p>
                    </div>

                    {/* User message */}
                    <div
                      className="rounded-xl rounded-tr-sm px-3 py-2.5"
                      style={{ backgroundColor: 'var(--azure)' }}
                    >
                      <p
                        className="text-xs"
                        style={{ color: '#FFFFFF', fontFamily: "'Inter', sans-serif", fontWeight: 300, lineHeight: 1.5 }}
                      >
                        Can you explain the main concept?
                      </p>
                    </div>

                    {/* Tutor response */}
                    <div
                      className="rounded-xl rounded-tl-sm px-3 py-2.5"
                      style={{ backgroundColor: 'var(--warm-sand)' }}
                    >
                      <p
                        className="text-xs"
                        style={{ color: 'var(--slate)', fontFamily: "'Inter', sans-serif", fontWeight: 300, lineHeight: 1.5 }}
                      >
                        Absolutely! The key concept is understanding how the pieces connect. Think of it as a puzzle where each module builds on the previous one...
                      </p>
                    </div>
                  </div>

                  {/* Input */}
                  <div
                    className="mt-4 rounded-lg px-3 py-2 text-xs"
                    style={{
                      backgroundColor: 'var(--parchment)',
                      border: '1px solid rgba(10, 46, 82, 0.12)',
                      color: 'var(--stone)',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 300,
                    }}
                  >
                    Type a question...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────── CTA Footer Section ─────────────────────── */

function CTAFooterSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      })

      tl.fromTo(headingRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0)
      tl.fromTo(subRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.15)
      tl.fromTo(ctaRef.current, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, 0.3)
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        background: 'var(--gradient-hero)',
        paddingTop: 'var(--space-4xl)',
        paddingBottom: 'var(--space-2xl)',
      }}
    >
      <div className="mx-auto px-6 text-center" style={{ maxWidth: 'var(--max-width-lg)' }}>
        {/* CTA block */}
        <h2
          ref={headingRef}
          className="mb-4 font-display"
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
            color: 'var(--ice)',
            fontWeight: 400,
            opacity: 0,
          }}
        >
          Ready to start learning?
        </h2>
        <p
          ref={subRef}
          className="mx-auto mb-8 max-w-[480px]"
          style={{
            color: 'var(--cyan)',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: '1rem',
            lineHeight: 1.6,
            opacity: 0,
          }}
        >
          Choose a YouTube channel and let CourseForge build your first course in seconds.
        </p>
        <div ref={ctaRef} style={{ opacity: 0 }}>
          <Link
            to="/app"
            className="inline-flex items-center rounded-xl px-8 py-4 text-lg font-normal transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'var(--gradient-accent)',
              color: 'var(--deep-ink)',
              fontFamily: "'Inter', sans-serif",
              transitionDuration: '150ms',
            }}
          >
            Launch CourseForge
          </Link>
        </div>

        {/* Footer links */}
        <div
          className="mx-auto mt-16"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: 'var(--space-lg)',
          }}
        >
          <div className="mb-6 grid grid-cols-2 gap-8 sm:grid-cols-2" style={{ maxWidth: '400px', margin: '0 auto 24px' }}>
            {/* Product */}
            <div>
              <div
                className="mb-3 text-xs uppercase"
                style={{
                  color: 'var(--ice)',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.1em',
                  fontWeight: 400,
                }}
              >
                Product
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Dashboard', href: '/app' },
                  { label: 'My Courses', href: '/app' },
                  { label: 'Settings', action: true },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.href || '#'}
                    className="text-sm font-light transition-colors hover:text-white"
                    style={{ color: 'var(--cyan)', fontFamily: "'Inter', sans-serif" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <div
                className="mb-3 text-xs uppercase"
                style={{
                  color: 'var(--ice)',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.1em',
                  fontWeight: 400,
                }}
              >
                Resources
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href="https://openrouter.ai/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-light transition-colors hover:text-white"
                  style={{ color: 'var(--cyan)', fontFamily: "'Inter', sans-serif" }}
                >
                  OpenRouter Docs
                </a>
                <a
                  href="https://developers.google.com/youtube/v3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-light transition-colors hover:text-white"
                  style={{ color: 'var(--cyan)', fontFamily: "'Inter', sans-serif" }}
                >
                  YouTube API
                </a>
                <span
                  className="cursor-not-allowed text-sm font-light"
                  style={{ color: 'var(--cyan)', opacity: 0.5, fontFamily: "'Inter', sans-serif" }}
                >
                  Privacy
                </span>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <p
            className="text-center"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.75rem',
              color: 'var(--cyan)',
              opacity: 0.5,
              fontWeight: 400,
            }}
          >
            &copy; 2025 CourseForge. Built with OpenRouter.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Home Page ───────────────────────── */

export default function Home() {
  return (
    <div style={{ backgroundColor: 'var(--abyss)' }}>
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <DemoPreviewSection />
      <CTAFooterSection />
    </div>
  )
}
