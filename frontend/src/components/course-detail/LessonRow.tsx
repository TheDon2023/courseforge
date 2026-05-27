import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ChevronRight, Trophy, BookOpen, FileText } from 'lucide-react';
import type { Lesson } from '@/types/course';
import { CourseStore } from '@/lib/CourseStore';
import AnimatedCheckbox from './AnimatedCheckbox';

interface LessonRowProps {
  lesson: Lesson;
  lessonNumber: string;
  moduleIndex: number;
  lessonIndex: number;
  onToggleComplete: (moduleIndex: number, lessonIndex: number) => void;
}

export default function LessonRow({
  lesson,
  lessonNumber,
  moduleIndex,
  lessonIndex,
  onToggleComplete,
}: LessonRowProps) {
  const navigate = useNavigate();
  const { id: courseId } = useParams<{ id: string }>();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (courseId) {
      navigate('/app/course/' + courseId + '/lesson/' + lesson.id);
    }
  };

  // Load quiz score and guide status from CourseStore
  const bestScore = courseId ? CourseStore.getBestQuizScore(courseId, lesson.id) : 0;
  const hasGuide = courseId ? !!CourseStore.loadLessonGuide(courseId, lesson.id) : false;
  const hasQuiz = courseId ? !!CourseStore.loadQuiz(courseId, lesson.id) : false;
  const transcriptStatus = lesson.transcriptStatus || 'not_requested';

  return (
    <motion.div
      className="flex cursor-pointer items-center gap-3 rounded-lg transition-colors"
      style={{
        padding: 'var(--space-sm) var(--space-md)',
        backgroundColor: isHovered ? 'rgba(0, 119, 182, 0.04)' : 'transparent',
        transitionDuration: '150ms',
        transitionTimingFunction: 'var(--ease-out)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Checkbox */}
      <AnimatedCheckbox
        checked={lesson.completed}
        onToggle={() => onToggleComplete(moduleIndex, lessonIndex)}
      />

      {/* Lesson number */}
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.75rem',
          color: 'var(--stone)',
          minWidth: '32px',
        }}
      >
        {lessonNumber}
      </span>

      {/* Lesson title */}
      <span
        className="flex-1 truncate"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: '1rem',
          color: isHovered ? 'var(--azure)' : 'var(--deep-ink)',
          transitionDuration: '150ms',
          transitionTimingFunction: 'var(--ease-out)',
        }}
      >
        {lesson.title}
      </span>

      {/* Status badges */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Quiz score */}
        {(hasQuiz || bestScore > 0) && (
          <span
            className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs"
            style={{
              backgroundColor: bestScore >= 8 ? '#F0FFF4' : bestScore >= 5 ? '#FFFAF0' : '#FFF5F5',
              color: bestScore >= 8 ? '#276749' : bestScore >= 5 ? '#975A16' : '#C53030',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <Trophy size={10} />
            {bestScore}/10
          </span>
        )}

        {/* Guide indicator */}
        {hasGuide && (
          <span
            className="inline-flex items-center rounded-full px-1.5 py-0.5"
            style={{ backgroundColor: '#EBF8FF', color: '#2C5282' }}
            title="Lesson guide available"
          >
            <BookOpen size={10} />
          </span>
        )}

        {/* Transcript status */}
        {transcriptStatus === 'available' && (
          <span
            className="inline-flex items-center rounded-full px-1.5 py-0.5"
            style={{ backgroundColor: '#F0FFF4', color: '#276749' }}
            title="Transcript available"
          >
            <FileText size={10} />
          </span>
        )}
        {transcriptStatus === 'failed' && (
          <span
            className="inline-flex items-center rounded-full px-1.5 py-0.5"
            style={{ backgroundColor: '#FFF5F5', color: '#C53030' }}
            title="Transcript unavailable"
          >
            <FileText size={10} />
          </span>
        )}
      </div>

      {/* Play button (visible on hover) */}
      <motion.div
        className="flex shrink-0 items-center justify-center"
        style={{ width: '24px', height: '24px' }}
        initial={false}
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1 : 0.8,
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: '24px',
            height: '24px',
            background: 'var(--gradient-accent)',
          }}
        >
          <Play size={10} fill="var(--deep-ink)" color="var(--deep-ink)" />
        </div>
      </motion.div>

      {/* Duration */}
      <div className="flex items-center gap-1" style={{ minWidth: '52px', justifyContent: 'flex-end' }}>
        <Play
          size={10}
          style={{
            color: 'var(--stone)',
            opacity: isHovered ? 0 : 1,
            transitionDuration: '150ms',
          }}
        />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--stone)',
          }}
        >
          {lesson.duration}
        </span>
      </div>

      {/* Chevron */}
      <ChevronRight
        size={14}
        style={{ color: 'var(--stone)', flexShrink: 0 }}
      />
    </motion.div>
  );
}
