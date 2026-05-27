import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnimatedCheckboxProps {
  checked: boolean;
  onToggle: () => void;
}

export default function AnimatedCheckbox({ checked, onToggle }: AnimatedCheckboxProps) {
  const [isChecked, setIsChecked] = useState(checked);

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsChecked(!isChecked);
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: '18px', height: '18px' }}
      aria-label={isChecked ? 'Mark as incomplete' : 'Mark as complete'}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <motion.circle
          cx="9"
          cy="9"
          r="8.5"
          fill={isChecked ? 'var(--azure)' : 'transparent'}
          stroke={isChecked ? 'var(--azure)' : 'rgba(10, 46, 82, 0.15)'}
          strokeWidth="1.5"
          initial={false}
          animate={{
            fill: isChecked ? 'var(--azure)' : 'transparent',
            stroke: isChecked ? 'var(--azure)' : 'rgba(10, 46, 82, 0.15)',
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        />
        {/* Checkmark path */}
        <motion.path
          d="M5 9L7.5 11.5L13 6"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{
            pathLength: isChecked ? 1 : 0,
            opacity: isChecked ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: 0,
          }}
        />
      </svg>
    </button>
  );
}
