import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  CheckCircle2,
  Trophy,
  BrainCircuit,
  Sparkles,
  AlertTriangle,
  Database,
} from 'lucide-react';
import type { Course } from '../../types/course';
import { CourseStore } from '../../lib/CourseStore';

interface CourseCardProps {
  course: Course;
  index: number;
  onDelete?: () => void;
}

export default function CourseCard({ course, index }: CourseCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/app/course/' + course.id);
  };

  const { average, lessonsWithQuizzes } = CourseStore.getAverageCourseQuizScore(course.id);
  const hasQuizzes = lessonsWithQuizzes > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(10, 46, 82, 0.15)' }}
      onClick={handleClick}
      className="cursor-pointer overflow-hidden rounded-2xl border transition-all"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(10, 46, 82, 0.06)',
        boxShadow: '0 2px 12px rgba(10, 46, 82, 0.04)',
      }}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
        <img
          src={course.thumbnail}
          alt={course.title}
          className="h-full w-full object-cover"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        {/* Sample badge */}
        {course.sample && (
          <div
            className="absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#975A16' }}
          >
            <AlertTriangle size={10} />
            SAMPLE
          </div>
        )}
        {/* AI badge */}
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: course.aiGenerated && !course.fallbackUsed
              ? 'rgba(56, 161, 105, 0.9)'
              : course.fallbackUsed
              ? 'rgba(221, 107, 32, 0.9)'
              : 'rgba(160, 174, 192, 0.9)',
            color: '#FFFFFF',
          }}
        >
          {course.aiGenerated && !course.fallbackUsed ? (
            <><Sparkles size={10} /> AI</>
          ) : course.fallbackUsed ? (
            <><AlertTriangle size={10} /> Fallback</>
          ) : (
            <><Database size={10} /> Local</>
          )}
        </div>
        {/* Progress overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
        >
          <span className="text-xs text-white" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>
            {course.completedLessons}/{course.totalLessons} lessons
          </span>
          <span className="text-xs text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {course.progress}%
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 'var(--space-md)' }}>
        <h3
          className="mb-1 truncate font-display"
          style={{ fontSize: '1.125rem', color: 'var(--deep-ink)', fontWeight: 400 }}
        >
          {course.title}
        </h3>
        <p
          className="mb-3 truncate"
          style={{ fontSize: '0.8125rem', color: 'var(--stone)', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
        >
          {course.channelName}
        </p>

        {/* Progress bar */}
        <div className="mb-3 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--warm-sand)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--gradient-accent)' }}
            initial={{ width: 0 }}
            animate={{ width: course.progress + '%' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <CheckCircle2 size={12} style={{ color: course.progress === 100 ? '#38A169' : 'var(--azure)' }} />
            <span style={{ fontSize: '0.6875rem', color: 'var(--stone)', fontFamily: "'Inter', sans-serif" }}>
              {course.progress === 100 ? 'Complete' : course.progress + '%'}
            </span>
          </div>

          {hasQuizzes && (
            <div className="flex items-center gap-1">
              <Trophy size={12} style={{ color: '#D69E2E' }} />
              <span style={{ fontSize: '0.6875rem', color: 'var(--stone)', fontFamily: "'Inter', sans-serif" }}>
                {average}% avg
              </span>
            </div>
          )}

          {course.provider && course.provider !== 'none' && (
            <div className="flex items-center gap-1">
              <BrainCircuit size={12} style={{ color: 'var(--azure)' }} />
              <span style={{ fontSize: '0.6875rem', color: 'var(--stone)', fontFamily: "'Inter', sans-serif" }}>
                {course.provider === 'kimi' ? 'Kimi' : course.provider === 'openrouter' ? 'OR' : 'AI'}
              </span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-1">
            <Play size={12} style={{ color: 'var(--azure)' }} />
            <span
              style={{ fontSize: '0.6875rem', color: 'var(--azure)', fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
            >
              {course.progress > 0 ? 'Continue' : 'Start'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
