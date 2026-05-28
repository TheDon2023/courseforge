import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, BookOpen } from 'lucide-react';
import type { Course } from '@/types/course';
import { CourseStore } from '@/lib/CourseStore';
import CourseProgressBar from '@/components/course-detail/CourseProgressBar';
import ModuleAccordion from '@/components/course-detail/ModuleAccordion';
import CourseSettingsDropdown from '@/components/course-detail/CourseSettingsDropdown';

/* ─── Loading Skeleton ─── */
function CourseDetailSkeleton() {
  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--parchment)', paddingTop: '64px' }}>
      <div style={{ maxWidth: 'var(--max-width-lg)', margin: '0 auto', padding: 'var(--space-3xl) var(--space-md) var(--space-xl)' }}>
        {/* Header skeleton */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="shimmer rounded-2xl" style={{ width: '120px', height: '120px', backgroundColor: 'var(--warm-sand)' }} />
          <div className="flex flex-col gap-3">
            <div className="shimmer rounded-lg" style={{ width: '300px', height: '40px', backgroundColor: 'var(--warm-sand)' }} />
            <div className="shimmer rounded-md" style={{ width: '200px', height: '20px', backgroundColor: 'var(--warm-sand)' }} />
            <div className="shimmer rounded-md" style={{ width: '240px', height: '36px', backgroundColor: 'var(--warm-sand)', marginTop: '8px' }} />
          </div>
        </div>
      </div>
      {/* Progress skeleton */}
      <div style={{ backgroundColor: 'var(--warm-sand)', padding: 'var(--space-lg) var(--space-md)' }}>
        <div style={{ maxWidth: 'var(--max-width-lg)', margin: '0 auto' }}>
          <div className="shimmer rounded-xl" style={{ width: '100%', height: '80px', backgroundColor: 'var(--parchment)' }} />
        </div>
      </div>
      {/* Modules skeleton */}
      <div style={{ maxWidth: 'var(--max-width-lg)', margin: '0 auto', padding: 'var(--space-xl) var(--space-md) var(--space-3xl)' }}>
        <div className="mb-6 flex items-center justify-between">
          <div className="shimmer rounded-lg" style={{ width: '180px', height: '32px', backgroundColor: 'var(--warm-sand)' }} />
          <div className="shimmer rounded-md" style={{ width: '100px', height: '16px', backgroundColor: 'var(--warm-sand)' }} />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="shimmer rounded-2xl"
            style={{
              width: '100%',
              height: '64px',
              backgroundColor: 'var(--warm-sand)',
              marginBottom: 'var(--space-md)',
            }}
          />
        ))}
      </div>
      <style>{`
        .shimmer {
          background: linear-gradient(90deg, var(--warm-sand) 25%, #FFFFFF 50%, var(--warm-sand) 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

/* ─── Course Not Found ─── */
function CourseNotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 text-center"
      style={{ minHeight: '100dvh', backgroundColor: 'var(--parchment)', paddingTop: '64px' }}
    >
      <div
        className="mb-6 flex items-center justify-center rounded-full"
        style={{
          width: '80px',
          height: '80px',
          backgroundColor: 'var(--warm-sand)',
        }}
      >
        <BookOpen size={32} style={{ color: 'var(--stone)' }} />
      </div>
      <h1
        className="mb-3 font-display"
        style={{
          fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
          color: 'var(--deep-ink)',
          fontWeight: 400,
        }}
      >
        Course Not Found
      </h1>
      <p
        className="mb-8 max-w-md"
        style={{
          color: 'var(--slate)',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: '1rem',
        }}
      >
        The course you're looking for doesn't exist or has been deleted.
      </p>
      <Link
        to="/app"
        className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-normal transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'var(--gradient-accent)',
          color: 'var(--deep-ink)',
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.875rem',
          textDecoration: 'none',
          transitionDuration: '150ms',
        }}
      >
        <ChevronLeft size={16} />
        Back to Dashboard
      </Link>
    </div>
  );
}

/* ─── Main Course Detail Page ─── */
export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<number | null>(0);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    // Small delay to show skeleton animation
    const timer = setTimeout(() => {
      const found = CourseStore.load(id);
      setCourse(found);
      setLoading(false);
      // Expand first incomplete module by default
      if (found) {
        for (let i = 0; i < found.modules.length; i++) {
          const hasIncomplete = found.modules[i].lessons.some((l) => !l.completed);
          if (hasIncomplete) {
            setExpandedModule(i);
            return;
          }
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [id]);

  const handleToggleLessonComplete = useCallback(
    (moduleIndex: number, lessonIndex: number) => {
      if (!course) return;
      const lesson = course.modules[moduleIndex]?.lessons[lessonIndex];
      if (!lesson) return;
      CourseStore.toggleLesson(course.id, lesson.id);
      // Refresh from store to get synced state
      setCourse(CourseStore.load(course.id));
    },
    [course]
  );

  const handleCourseUpdated = useCallback((updated: Course) => {
    setCourse(updated);
  }, []);

  const handleCourseDeleted = useCallback(() => {
    navigate('/app');
  }, [navigate]);

  const handleResume = useCallback(() => {
    if (!course) return;
    const firstIncomplete = CourseStore.findFirstIncompleteLesson(course.id);
    if (firstIncomplete) {
      navigate(`/app/course/${course.id}/lesson/${firstIncomplete.lessonId}`);
    } else if (course.modules[0]?.lessons[0]) {
      // All complete, go to first lesson
      navigate(`/app/course/${course.id}/lesson/${course.modules[0].lessons[0].id}`);
    }
  }, [course, navigate]);

  const handleToggleModule = useCallback((index: number) => {
    setExpandedModule((prev) => (prev === index ? null : index));
  }, []);

  if (loading) {
    return <CourseDetailSkeleton />;
  }

  if (!course) {
    return <CourseNotFound />;
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--parchment)' }}>
      {/* ── Section 1: Back button ── */}
      <div style={{ paddingTop: '64px' }}>
        <div
          style={{
            maxWidth: 'var(--max-width-lg)',
            margin: '0 auto',
            padding: 'var(--space-md) var(--space-md) 0',
          }}
        >
          <Link
            to="/app"
            className="inline-flex items-center gap-1 transition-colors"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: '0.875rem',
              color: 'var(--deep-ink)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--azure)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--deep-ink)';
            }}
          >
            <ChevronLeft size={16} />
            Back
          </Link>
        </div>
      </div>

      {/* ── Section 2: Course Header ── */}
      <section
        style={{
          padding: 'var(--space-xl) var(--space-md) var(--space-xl)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--max-width-lg)',
            margin: '0 auto',
          }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Thumbnail */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
              }}
            >
              <img
                src={course.thumbnail}
                alt={course.title}
                className="rounded-2xl object-cover"
                style={{
                  width: 'clamp(80px, 15vw, 120px)',
                  height: 'clamp(80px, 15vw, 120px)',
                  boxShadow: '0 4px 16px rgba(10, 46, 82, 0.08)',
                  aspectRatio: '1 / 1',
                }}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.backgroundColor = 'var(--warm-sand)';
                  target.style.display = 'flex';
                  target.style.alignItems = 'center';
                  target.style.justifyContent = 'center';
                }}
              />
            </motion.div>

            {/* Course Info */}
            <div className="flex flex-col gap-2">
              <motion.h1
                className="font-display"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
                  delay: 0.15,
                }}
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  fontWeight: 400,
                  color: 'var(--deep-ink)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.015em',
                }}
              >
                {course.title}
              </motion.h1>

              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
                  delay: 0.3,
                }}
              >
                <a
                  href={course.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:underline"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: '0.875rem',
                    color: 'var(--azure)',
                    textDecoration: 'none',
                  }}
                >
                  {course.channelName}
                </a>
              </motion.div>

              <motion.p
                className="flex flex-wrap items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
                  delay: 0.45,
                }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: '1rem',
                  color: 'var(--stone)',
                }}
              >
                <BookOpen size={14} style={{ color: 'var(--stone)' }} />
                {course.modules.length} modules
                <span style={{ color: 'rgba(10, 46, 82, 0.2)' }}>|</span>
                {course.totalLessons} lessons
                <span style={{ color: 'rgba(10, 46, 82, 0.2)' }}>|</span>
                {course.progress}% complete
              </motion.p>

              {/* Action Row */}
              <motion.div
                className="flex flex-wrap items-center gap-3"
                style={{ marginTop: 'var(--space-md)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
                  delay: 0.6,
                }}
              >
                <button
                  onClick={handleResume}
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-normal transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'var(--gradient-accent)',
                    color: 'var(--deep-ink)',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    transitionDuration: '150ms',
                  }}
                >
                  Resume Course
                </button>

                <CourseSettingsDropdown
                  course={course}
                  onCourseUpdated={handleCourseUpdated}
                  onCourseDeleted={handleCourseDeleted}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Progress Bar ── */}
      <section
        style={{
          backgroundColor: 'var(--warm-sand)',
          padding: 'var(--space-lg) var(--space-md)',
        }}
      >
        <motion.div
          style={{ maxWidth: 'var(--max-width-lg)', margin: '0 auto' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
            delay: 0.5,
          }}
        >
          <CourseProgressBar
            progress={course.progress}
            completedLessons={course.completedLessons}
            totalLessons={course.totalLessons}
          />
        </motion.div>
      </section>

      {/* ── Section 4: Course Modules ── */}
      <section
        style={{
          padding: 'var(--space-xl) var(--space-md) var(--space-3xl)',
        }}
      >
        <div style={{ maxWidth: 'var(--max-width-lg)', margin: '0 auto' }}>
          {/* Section header */}
          <motion.div
            className="mb-6 flex items-center justify-between"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
              delay: 0.7,
            }}
          >
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                fontWeight: 400,
                color: 'var(--deep-ink)',
              }}
            >
              Course Modules
            </h2>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 300,
                fontSize: '0.875rem',
                color: 'var(--stone)',
              }}
            >
              {course.totalLessons} lessons total
            </span>
          </motion.div>

          {/* Module accordions */}
          <div>
            {course.modules.map((mod, idx) => (
              <ModuleAccordion
                key={mod.title}
                module={mod}
                moduleIndex={idx}
                isExpanded={expandedModule === idx}
                onToggle={() => handleToggleModule(idx)}
                onToggleLessonComplete={handleToggleLessonComplete}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
