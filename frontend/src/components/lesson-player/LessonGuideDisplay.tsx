import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Target,
  Lightbulb,
  FileText,
  Wrench,
  AlertTriangle,
  Star,
  ClipboardCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import type { LessonGuide } from '../../types/course';

interface LessonGuideDisplayProps {
  guide: LessonGuide | null | undefined;
  onGenerate?: () => void;
  generating?: boolean;
  aiError?: string | null;
  transcriptStatus?: string;
}

const Section = ({
  icon: Icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-[rgba(10,46,82,0.08)] bg-white/60 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[rgba(0,119,182,0.04)]"
      >
        <Icon size={16} className="text-[#0077B6]" />
        <span
          className="flex-1 text-sm font-medium"
          style={{ color: 'var(--deep-ink)', fontFamily: "'Inter', sans-serif" }}
        >
          {title}
        </span>
        <ChevronDown
          size={16}
          className="text-[var(--stone)] transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: '0.875rem', color: 'var(--slate)', lineHeight: 1.7 }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function LessonGuideDisplay({
  guide,
  onGenerate,
  generating,
  aiError,
  transcriptStatus,
}: LessonGuideDisplayProps) {
  if (generating) {
    return (
      <div className="rounded-xl border border-[rgba(0,119,182,0.2)] bg-[rgba(0,119,182,0.05)] p-6 text-center">
        <Sparkles size={24} className="mx-auto mb-2 animate-pulse text-[#0077B6]" />
        <p className="text-sm text-[var(--slate)]">Generating detailed lesson guide...</p>
        <p className="text-xs text-[var(--stone)] mt-1">This may take 10-30 seconds</p>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="rounded-xl border border-dashed border-[rgba(10,46,82,0.15)] bg-[rgba(10,46,82,0.02)] p-6 text-center">
        <BookOpen size={24} className="mx-auto mb-2 text-[var(--stone)]" />
        <p className="text-sm font-medium text-[var(--deep-ink)] mb-1">No Lesson Guide Yet</p>
        <p className="text-xs text-[var(--stone)] mb-3">
          {transcriptStatus === 'unavailable' || transcriptStatus === 'missing'
            ? 'Transcript unavailable — using title, description, and channel context.'
            : transcriptStatus === 'not_requested'
            ? 'Generate a detailed lesson guide with overview, key concepts, terminology, and more.'
            : 'Generate a detailed lesson guide with overview, key concepts, terminology, and more.'}
        </p>
        {aiError && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            <p className="font-medium">{aiError.substring(0, 200)}</p>
            {(aiError.includes('401') || aiError.includes('UNAUTHORIZED') || aiError.includes('Missing Authentication')) && (
              <p className="mt-1 text-amber-700">Your API key may be wrong. Open Settings and re-enter your key.</p>
            )}
            {(aiError.includes('429') || aiError.includes('QUOTA')) && (
              <p className="mt-1 text-amber-700">Quota exceeded. Try again later or switch providers.</p>
            )}
          </div>
        )}
        <button
          onClick={onGenerate || (() => {})}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0077B6] to-[#48CAE4] px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
        >
          <Sparkles size={14} />
          Generate Lesson Guide + Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Overview */}
      <Section icon={BookOpen} title="Overview" defaultOpen={true}>
        <p>{guide.overview}</p>
      </Section>

      {/* Learning Objectives */}
      <Section icon={Target} title="Learning Objectives">
        <ul className="list-disc space-y-1 pl-5">
          {guide.learningObjectives.map((obj, i) => (
            <li key={i}>{obj}</li>
          ))}
        </ul>
      </Section>

      {/* Key Concepts */}
      <Section icon={Lightbulb} title="Key Concepts">
        <ul className="list-disc space-y-1 pl-5">
          {guide.keyConcepts.map((concept, i) => (
            <li key={i}>{concept}</li>
          ))}
        </ul>
      </Section>

      {/* Detailed Explanation */}
      <Section icon={FileText} title="Detailed Explanation">
        <p className="whitespace-pre-wrap">{guide.detailedExplanation}</p>
      </Section>

      {/* Examples */}
      {guide.examples.length > 0 && (
        <Section icon={Wrench} title="Practical Examples">
          <ul className="list-decimal space-y-2 pl-5">
            {guide.examples.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Terminology */}
      {guide.terminology.length > 0 && (
        <Section icon={BookOpen} title="Terminology">
          <div className="space-y-2">
            {guide.terminology.map((t, i) => (
              <div key={i} className="rounded-lg bg-[rgba(0,119,182,0.04)] px-3 py-2">
                <span className="font-medium text-[var(--deep-ink)]">{t.term}</span>
                <span className="mx-2 text-[var(--stone)]">—</span>
                <span className="text-[var(--slate)]">{t.definition}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Common Mistakes */}
      {guide.commonMistakes.length > 0 && (
        <Section icon={AlertTriangle} title="Common Misunderstandings">
          <ul className="list-disc space-y-1 pl-5">
            {guide.commonMistakes.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Why It Matters */}
      <Section icon={Star} title="Why This Matters">
        <p>{guide.whyItMatters}</p>
      </Section>

      {/* Summary */}
      <Section icon={FileText} title="Summary">
        <p>{guide.summary}</p>
      </Section>

      {/* Review Checklist */}
      {guide.reviewChecklist.length > 0 && (
        <Section icon={ClipboardCheck} title="Review Checklist">
          <ul className="space-y-1">
            {guide.reviewChecklist.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" readOnly />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
