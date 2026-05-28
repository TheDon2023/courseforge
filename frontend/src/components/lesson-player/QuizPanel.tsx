import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, XCircle, Trophy, RotateCcw, Loader2, AlertTriangle, Sparkles, BookOpen, Target, TrendingUp, Brain } from 'lucide-react'
import type { Quiz, QuizQuestion } from '../../types/course'
import { CourseStore } from '../../lib/CourseStore'
import { generateLessonGuideAndQuiz, loadQuiz, saveQuiz, saveQuizScore, getBestQuizScore } from './quizApi'

const OPTION_LABELS = ['A', 'B', 'C', 'D']
const BRIGHT_GREEN = '#00FF00'

const DIFFICULTY_COLORS = {
  beginner: { bg: '#003300', text: BRIGHT_GREEN, border: '#00FF0040' },
  intermediate: { bg: '#003300', text: BRIGHT_GREEN, border: '#00FF0040' },
  applied: { bg: '#003300', text: BRIGHT_GREEN, border: '#00FF0040' },
}

interface QuizPanelProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  courseTitle: string
  lessonId: string
  lessonTitle: string
  channelName?: string
  lessonIndex: number
  totalLessons: number
  lessonDescription?: string
  videoId?: string
}

export default function QuizPanel({
  isOpen, onClose, courseId, courseTitle, lessonId, lessonTitle,
  channelName = '', lessonIndex, totalLessons, lessonDescription = '',
}: QuizPanelProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)

  const [loading, setLoading] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [currentQ, setCurrentQ] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<Array<{ questionId: string; selected: number; correct: boolean }>>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [bestScore, setBestScore] = useState(0)

  const loadExisting = useCallback(() => {
    const savedQuiz = loadQuiz(courseId, lessonId)
    if (savedQuiz) {
      setQuiz(savedQuiz)
      setAiGenerated(savedQuiz.aiGenerated)
      setAiError(null)
    }
    setBestScore(getBestQuizScore(courseId, lessonId))
  }, [courseId, lessonId])

  useEffect(() => {
    if (isOpen) {
      loadExisting()
      // Reset quiz state
      setCurrentQ(0)
      setSelectedOption(null)
      setAnswered(false)
      setScore(0)
      setAnswers([])
      setQuizCompleted(false)
    }
  }, [isOpen, loadExisting])

  const handleGenerate = useCallback(() => {
    setLoading(true)
    setAiError(null)

    // Get neighboring lesson titles for context
    const course = CourseStore.load(courseId)
    const neighboringTitles: string[] = []
    if (course) {
      for (const mod of course.modules) {
        for (const lesson of mod.lessons) {
          if (lesson.id !== lessonId) neighboringTitles.push(lesson.title)
        }
      }
    }

    generateLessonGuideAndQuiz(
      courseTitle, channelName, lessonTitle, lessonDescription,
      lessonIndex, totalLessons, undefined, neighboringTitles.slice(0, 5),
    )
      .then((result) => {
        if (result.error) {
          setAiError(result.error)
        }
        if (result.quiz && result.quiz.questions.length === 10) {
          saveQuiz(courseId, lessonId, result.quiz)
          setQuiz(result.quiz)
          setAiGenerated(result.aiGenerated)
          setAiError(null)

          // Reset state
          setCurrentQ(0)
          setSelectedOption(null)
          setAnswered(false)
          setScore(0)
          setAnswers([])
          setQuizCompleted(false)
        } else if (result.error) {
          setAiError(result.error || 'Quiz generation did not produce 10 questions')
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[QuizPanel] generate error:', msg)
        setAiError('Quiz generation failed: ' + msg.substring(0, 200))
      })
      .finally(() => setLoading(false))
  }, [courseId, courseTitle, lessonId, lessonTitle, lessonDescription, channelName, lessonIndex, totalLessons])

  const handleAnswer = useCallback((optionIndex: number) => {
    if (answered || !quiz) return
    setSelectedOption(optionIndex)
    setAnswered(true)
    const q = quiz.questions[currentQ]
    const isCorrect = optionIndex === q.correctIndex
    if (isCorrect) setScore((s) => s + 1)
    setAnswers((prev) => [...prev, { questionId: q.id, selected: optionIndex, correct: isCorrect }])
  }, [answered, quiz, currentQ])

  const handleNext = useCallback(() => {
    if (!quiz) return
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ((c) => c + 1)
      setSelectedOption(null)
      setAnswered(false)
    } else {
      setQuizCompleted(true)
      saveQuizScore(courseId, lessonId, score + (selectedOption !== null && selectedOption === quiz.questions[currentQ].correctIndex ? 0 : 0), 10)
      // Recalculate: score was already incremented in handleAnswer
      const finalScore = answers.filter((a) => a.correct).length + (selectedOption !== null && selectedOption === quiz.questions[currentQ].correctIndex && !answers.find((a) => a.questionId === quiz.questions[currentQ].id) ? 1 : 0)
      saveQuizScore(courseId, lessonId, finalScore, 10)
      setBestScore(getBestQuizScore(courseId, lessonId))
    }
  }, [quiz, currentQ, courseId, lessonId, score, selectedOption, answers])

  const handleRetake = useCallback(() => {
    setCurrentQ(0)
    setSelectedOption(null)
    setAnswered(false)
    setScore(0)
    setAnswers([])
    setQuizCompleted(false)
  }, [])

  if (!isOpen) return null

  const question: QuizQuestion | undefined = quiz?.questions[currentQ]
  const progress = quiz ? ((currentQ + (answered ? 1 : 0)) / quiz.questions.length) * 100 : 0

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.25 }}
      className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#03045E] shadow-2xl"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#03045E]/95 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {quizCompleted ? <Trophy size={20} className="text-yellow-400" /> : <BookOpen size={20} style={{ color: BRIGHT_GREEN }} />}
          <h2 className="text-lg font-semibold" style={{ color: BRIGHT_GREEN }}>
            {quizCompleted ? 'Quiz Complete' : 'Quiz'}
          </h2>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-white/10" style={{ color: BRIGHT_GREEN }}>
          <X size={20} />
        </button>
      </div>

      <div className="px-6 py-4">
        {/* AI Status */}
        {aiError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <div className="flex items-center gap-2" style={{ color: BRIGHT_GREEN }}>
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">AI Unavailable</span>
            </div>
            <p className="mt-1 text-xs" style={{ color: BRIGHT_GREEN }}>{aiError}</p>
            {aiError.includes('401') || aiError.includes('UNAUTHORIZED') || aiError.includes('Missing Authentication') ? (
              <p className="mt-2 text-xs" style={{ color: BRIGHT_GREEN }}>
                Your API key may be wrong or expired. Open Settings and re-enter your OpenRouter key.
              </p>
            ) : aiError.includes('429') || aiError.includes('QUOTA') ? (
              <p className="mt-2 text-xs" style={{ color: BRIGHT_GREEN }}>
                API quota exceeded. Try again later or switch to a different AI provider in Settings.
              </p>
            ) : null}
          </div>
        )}

        {!aiError && aiGenerated && quiz && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
            <div className="flex items-center gap-2" style={{ color: BRIGHT_GREEN }}>
              <Sparkles size={16} />
              <span className="text-sm font-medium">AI-generated 10-question quiz</span>
            </div>
          </div>
        )}

        {/* Best Score */}
        {bestScore > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <TrendingUp size={16} style={{ color: BRIGHT_GREEN }} />
            <span className="text-sm" style={{ color: BRIGHT_GREEN }}>Best score: {bestScore}/10</span>
          </div>
        )}

        {/* Generate Button */}
        {!quiz && !loading && (
          <button
            onClick={handleGenerate}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-3 text-sm font-medium transition-all hover:opacity-90"
            style={{ color: BRIGHT_GREEN }}
          >
            <Brain size={18} />
            Generate 10-Question Quiz
          </button>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 size={32} className="animate-spin" style={{ color: BRIGHT_GREEN }} />
            <p className="text-sm" style={{ color: BRIGHT_GREEN }}>Generating lesson guide + 10 quiz questions...</p>
            <p className="text-xs" style={{ color: BRIGHT_GREEN }}>This may take 10-30 seconds</p>
          </div>
        )}

        {/* Quiz Content */}
        {quiz && !quizCompleted && question && (
          <>
            {/* Progress */}
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between text-xs" style={{ color: BRIGHT_GREEN }}>
                <span>Question {currentQ + 1} of {quiz.questions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400"
                  initial={{ width: 0 }}
                  animate={{ width: progress + '%' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Difficulty Badge */}
            <div className="mb-3 flex items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: DIFFICULTY_COLORS[question.difficulty].bg,
                  color: DIFFICULTY_COLORS[question.difficulty].text,
                  border: '1px solid ' + DIFFICULTY_COLORS[question.difficulty].border,
                }}
              >
                {question.difficulty}
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: BRIGHT_GREEN }}>
                <Target size={12} />
                {question.conceptTested}
              </span>
            </div>

            {/* Question */}
            <h3 className="mb-4 text-base font-medium leading-relaxed" style={{ color: BRIGHT_GREEN }}>
              {question.question}
            </h3>

            {/* Options */}
            <div className="space-y-2">
              {question.options.map((option, i) => {
                const isSelected = selectedOption === i
                const isCorrect = i === question.correctIndex
                const showCorrect = answered && isCorrect
                const showWrong = answered && isSelected && !isCorrect

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={answered}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                      showCorrect
                        ? 'border-emerald-500/50 bg-emerald-500/20 text-[#00FF00]'
                        : showWrong
                        ? 'border-red-500/50 bg-red-500/20 text-[#00FF00]'
                        : isSelected
                        ? 'border-sky-500/50 bg-sky-500/20 text-[#00FF00]'
                        : 'border-white/10 bg-white/5 text-[#00FF00] hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      showCorrect ? 'bg-emerald-500 text-[#00FF00]' : showWrong ? 'bg-red-500 text-[#00FF00]' : 'bg-white/10 text-[#00FF00]'
                    }`}>
                      {showCorrect ? <CheckCircle size={14} /> : showWrong ? <XCircle size={14} /> : OPTION_LABELS[i]}
                    </span>
                    <span>{option}</span>
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {answered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-4">
                    <p className="mb-2 text-sm font-medium" style={{ color: BRIGHT_GREEN }}>Explanation</p>
                    <p className="text-sm" style={{ color: BRIGHT_GREEN }}>{question.explanation}</p>
                    {question.wrongAnswerExplanations && selectedOption !== null && selectedOption !== question.correctIndex && question.wrongAnswerExplanations[selectedOption] && (
                      <p className="mt-2 text-sm" style={{ color: BRIGHT_GREEN }}>
                        Why your answer was wrong: {question.wrongAnswerExplanations[selectedOption]}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleNext}
                    className="mt-3 w-full rounded-lg bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2.5 text-sm font-medium transition-all hover:opacity-90"
                    style={{ color: BRIGHT_GREEN }}
                  >
                    {currentQ < quiz.questions.length - 1 ? 'Next Question' : 'See Results'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Quiz Results */}
        {quizCompleted && quiz && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mb-6">
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-3xl font-bold" style={{ color: BRIGHT_GREEN }}>
                {score}/10
              </div>
              <p className="text-lg font-semibold" style={{ color: BRIGHT_GREEN }}>
                {score >= 8 ? 'Excellent!' : score >= 6 ? 'Good job!' : score >= 4 ? 'Keep studying!' : 'Review the lesson'}
              </p>
              <p className="text-sm" style={{ color: BRIGHT_GREEN }}>
                {score} correct out of {quiz.questions.length} questions ({Math.round((score / 10) * 100)}%)
              </p>
              {bestScore > 0 && (
                <p className="mt-1 text-xs" style={{ color: BRIGHT_GREEN }}>Best: {bestScore}/10</p>
              )}
            </div>

            {/* Question Review */}
            <div className="mb-4 space-y-2 text-left">
              {quiz.questions.map((q, i) => {
                const ans = answers.find((a) => a.questionId === q.id)
                const correct = ans?.correct ?? false
                return (
                  <div
                    key={q.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      correct ? 'border-emerald-500/30 bg-emerald-500/10 text-[#00FF00]' : 'border-red-500/30 bg-red-500/10 text-[#00FF00]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {correct ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      <span>Q{i + 1}: {q.conceptTested}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={handleRetake}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm transition-all hover:bg-white/10"
              style={{ color: BRIGHT_GREEN }}
            >
              <RotateCcw size={16} />
              Retake Quiz
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
