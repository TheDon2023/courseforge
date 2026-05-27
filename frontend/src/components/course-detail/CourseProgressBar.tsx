import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CourseProgressBarProps {
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

export default function CourseProgressBar({
  progress,
  completedLessons,
  totalLessons,
}: CourseProgressBarProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [displayPercent, setDisplayPercent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 600);
    return () => clearTimeout(timer);
  }, [progress]);

  useEffect(() => {
    const duration = 800;
    const startTime = performance.now();
    const startValue = 0;
    const endValue = progress;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      const current = Math.round(startValue + (endValue - startValue) * eased);
      setDisplayPercent(current);
      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    const delayTimer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, 600);

    return () => clearTimeout(delayTimer);
  }, [progress]);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: 'var(--space-md)',
        boxShadow: '0 2px 8px rgba(10, 46, 82, 0.04)',
      }}
    >
      <div
        className="mb-2 flex items-center justify-between"
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: '0.875rem',
            color: 'var(--stone)',
          }}
        >
          Overall Progress
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '1.5rem',
            fontWeight: 400,
            color: 'var(--azure)',
          }}
        >
          {displayPercent}%
        </span>
      </div>

      {/* Progress track */}
      <div
        style={{
          height: '8px',
          backgroundColor: 'rgba(10, 46, 82, 0.06)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            height: '100%',
            background: 'var(--gradient-accent)',
            borderRadius: '4px',
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${animatedProgress}%` }}
          transition={{
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
            delay: 0.3,
          }}
        />
      </div>

      {/* Detail */}
      <p
        className="mt-2"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontSize: '0.875rem',
          color: 'var(--stone)',
        }}
      >
        {completedLessons} of {totalLessons} lessons completed
      </p>
    </div>
  );
}
