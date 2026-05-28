import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GenerationStep } from './types';

interface GenerationLoaderProps {
  isOpen: boolean;
  onCancel: () => void;
}

const STEPS: GenerationStep[] = [
  'Fetching channel videos...',
  'Extracting transcripts...',
  'Analyzing content with AI...',
  'Building course structure...',
  'Course ready!',
];

const easeOut = [0.4, 0, 0.2, 1] as [number, number, number, number];

export default function GenerationLoader({ isOpen, onCancel }: GenerationLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepText, setStepText] = useState<GenerationStep>(STEPS[0]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setStepText(STEPS[0]);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next < STEPS.length) {
          setStepText(STEPS[next]);
          return next;
        }
        clearInterval(interval);
        return prev;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6"
          style={{ backgroundColor: 'var(--overlay-dark)', backdropFilter: 'blur(12px)' }}
        >
          {/* Animation Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
            className="relative"
            style={{ width: 200, height: 200 }}
          >
            {/* Central Orb */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(0, 180, 216, 0.4), 0 0 60px rgba(0, 180, 216, 0.2)',
                  '0 0 40px rgba(0, 180, 216, 0.7), 0 0 80px rgba(0, 180, 216, 0.4)',
                  '0 0 20px rgba(0, 180, 216, 0.4), 0 0 60px rgba(0, 180, 216, 0.2)',
                ],
              }}
              transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'var(--sky)',
              }}
            />

            {/* Orbiting Thumbnails */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
              className="absolute inset-0"
            >
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    backgroundColor: 'rgba(2, 62, 138, 0.6)',
                    border: '1px solid rgba(0, 180, 216, 0.3)',
                    backdropFilter: 'blur(8px)',
                    left: '50%',
                    top: '50%',
                    marginLeft: -24,
                    marginTop: -24,
                  }}
                  // Position at 4 points on a circle
                  // Using CSS transform in animate to position
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: 80,
                      height: 1,
                      background: 'linear-gradient(to right, rgba(0, 119, 182, 0.5), transparent)',
                      transformOrigin: 'left center',
                      transform: `rotate(${i * 90}deg)`,
                    }}
                  />
                  {/* Counter-rotate the thumbnail content so it stays upright */}
                  <motion.div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
                  >
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{ background: 'rgba(0, 119, 182, 0.2)' }}
                    >
                      <div
                        className="rounded-full"
                        style={{
                          width: 8,
                          height: 8,
                          backgroundColor: 'var(--cyan)',
                          opacity: 0.6 + i * 0.1,
                        }}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              ))}

              {/* Static positioning for the orbit items using absolute positioning */}
              <style>{`
                .orbit-item-0 { transform: translate(80px, 0); }
                .orbit-item-1 { transform: translate(0, 80px); }
                .orbit-item-2 { transform: translate(-80px, 0); }
                .orbit-item-3 { transform: translate(0, -80px); }
              `}</style>
            </motion.div>

            {/* Redo orbit items with proper positioning */}
            {[0, 1, 2, 3].map((i) => {
              const angle = (i * 90 * Math.PI) / 180;
              const x = Math.cos(angle) * 80;
              const y = Math.sin(angle) * 80;
              return (
                <motion.div
                  key={`orbit-${i}`}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    x: x - 24,
                    y: y - 24,
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    backgroundColor: 'rgba(2, 62, 138, 0.6)',
                    border: '1px solid rgba(0, 180, 216, 0.3)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {/* Connecting line */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 24,
                      top: 24,
                      width: 80,
                      height: 1,
                      background: 'linear-gradient(to right, rgba(0, 119, 182, 0.4), transparent)',
                      transformOrigin: 'left center',
                      transform: `rotate(${i * 90}deg)`,
                    }}
                  />
                  <motion.div
                    className="flex h-full w-full items-center justify-center rounded-lg"
                    style={{ background: 'rgba(0, 119, 182, 0.15)' }}
                    // Counter-rotate to keep content upright
                  >
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
                      className="flex h-full w-full items-center justify-center"
                    >
                      <div
                        className="rounded-full"
                        style={{
                          width: 6 + i * 2,
                          height: 6 + i * 2,
                          backgroundColor: 'var(--cyan)',
                          opacity: 0.5 + i * 0.1,
                        }}
                      />
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}

            {/* Rotating container */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
              className="absolute inset-0"
            >
              {/* Particle dots traveling along paths */}
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: 'var(--cyan)',
                    marginLeft: -2,
                    marginTop: -2,
                  }}
                  animate={{
                    x: [0, Math.cos((i * 90 * Math.PI) / 180) * 80],
                    y: [0, Math.sin((i * 90 * Math.PI) / 180) * 80],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: easeOut }}
            className="mt-8 text-center font-display text-2xl"
            style={{ color: 'var(--ice)', fontWeight: 400 }}
          >
            Building your course...
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: easeOut }}
            className="mt-3 max-w-[400px] text-center text-sm font-light"
            style={{
              color: 'var(--cyan)',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              lineHeight: 1.6,
            }}
          >
            Our AI is analyzing videos, structuring modules, and preparing your learning path. This may take a few minutes.
          </motion.p>

          {/* Current Step */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 flex items-center gap-2"
          >
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: 'var(--sky)' }}
            />
            <span
              style={{
                color: 'var(--sky)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.75rem',
              }}
            >
              {stepText}
            </span>
          </motion.div>

          {/* Step progress dots */}
          <div className="mt-4 flex items-center gap-2">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === currentStep ? 24 : 8,
                  backgroundColor:
                    i <= currentStep ? 'var(--sky)' : 'rgba(255,255,255,0.1)',
                }}
                animate={{
                  width: i === currentStep ? 24 : 8,
                }}
                transition={{ duration: 0.3, ease: easeOut }}
              />
            ))}
          </div>

          {/* Cancel Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            className="mt-8 rounded-xl px-6 py-2.5 text-sm font-normal transition-colors"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--ice)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Cancel
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
