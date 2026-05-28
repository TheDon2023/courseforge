import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Course } from '../types/course';
import type { ChannelSearchResult } from '../components/dashboard/api';
import { CourseStore } from '../lib/CourseStore';
import { testKimiConnection, testOpenRouterConnection, testYouTubeConnection } from '../lib/AiProvider';
import type { ConnectionTestResult } from '../lib/AiProvider';
import {
  generateCourseWithAI,
  fetchChannelVideos,
  fetchPlaylistVideos,
} from '../components/dashboard/api';
import type { YouTubeVideo } from '../components/dashboard/api';
import {
  checkTranscriptBackendHealth,
  extractTranscriptsWithPolling,
} from '../lib/transcriptApi';
import type { TranscriptJobResponse } from '../lib/transcriptApi';
import EmptyState from '../components/dashboard/EmptyState';
import CourseCard from '../components/dashboard/CourseCard';
import CreateCourseModal from '../components/dashboard/CreateCourseModal';
import GenerationLoader from '../components/dashboard/GenerationLoader';
import SettingsDrawer from '../components/dashboard/SettingsDrawer';

const easeOut = [0.4, 0, 0.2, 1] as [number, number, number, number];

/* ─── System Health Badge ─── */
function SystemHealthBar() {
  const [ytStatus, setYtStatus] = useState<ConnectionTestResult['status']>('no_key');
  const [orStatus, setOrStatus] = useState<ConnectionTestResult['status']>('no_key');
  const [kimiStatus, setKimiStatus] = useState<ConnectionTestResult['status']>('no_key');

  useEffect(() => {
    let mounted = true;
    async function check() {
      const [yt, or, km] = await Promise.all([
        testYouTubeConnection(),
        testOpenRouterConnection(),
        testKimiConnection(),
      ]);
      if (!mounted) return;
      setYtStatus(yt.status);
      setOrStatus(or.status);
      setKimiStatus(km.status);
    }
    check();
    return () => { mounted = false; };
  }, []);

  const hasOrKey = orStatus !== 'no_key';
  const hasKimiKey = kimiStatus !== 'no_key';
  const anyAiConnected = orStatus === 'connected' || kimiStatus === 'connected';

  // AI badge logic:
  // - GREEN: at least one provider is connected
  // - AMBER: key saved but ping failed (transient issue, can still try)
  // - RED: no key saved
  let aiStatus: ConnectionTestResult['status'] | 'degraded';
  if (anyAiConnected) {
    aiStatus = 'connected';
  } else if (!hasOrKey && !hasKimiKey) {
    aiStatus = 'no_key';
  } else {
    aiStatus = 'degraded';
  }

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <StatusDot label="YouTube" status={ytStatus} />
      <StatusDot label="AI" status={aiStatus} />
      <StatusDot label="Storage" status={'connected'} />
    </div>
  );
}

function StatusDot({ label, status }: { label: string; status: ConnectionTestResult['status'] | 'degraded' }) {
  const color = status === 'connected' ? '#38A169' : status === 'no_key' ? 'var(--stone)' : status === 'degraded' ? '#D69E2E' : '#E53E3E';
  const glow = status === 'connected' ? '0 0 4px #38A169' : status === 'degraded' ? '0 0 4px #D69E2E' : 'none';
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="rounded-full"
        style={{
          width: '6px',
          height: '6px',
          backgroundColor: color,
          boxShadow: glow,
        }}
      />
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.6875rem',
          fontWeight: 300,
          color: status === 'connected' ? 'var(--ice)' : status === 'degraded' ? '#D69E2E' : 'var(--stone)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load courses from CourseStore (unified source of truth)
  const refreshCourses = useCallback(() => {
    const stored = CourseStore.loadAll();
    setCourses(stored);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refreshCourses();
  }, [refreshCourses]);

  // Refresh when returning from other pages
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshCourses();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refreshCourses]);

  // Handle create course from modal (supports both channels and playlists)
  const handleCreateCourse = useCallback(async (result: ChannelSearchResult) => {
    setCreateModalOpen(false);
    setGenerating(true);

    const { info: channelInfo, playlistId, isPlaylist } = result;
    if (!channelInfo) { setGenerating(false); return; }

    let videoData: YouTubeVideo[] = [];

    try {
      if (isPlaylist && playlistId) {
        console.log('[Dashboard] Fetching playlist videos:', playlistId);
        const videos = await fetchPlaylistVideos(playlistId);
        videoData = videos.slice(0, 10);
      } else {
        const videos = await fetchChannelVideos(channelInfo.id);
        videoData = videos.slice(0, 10);
      }
    } catch (err) {
      console.warn('[Dashboard] Video fetch failed:', err);
      videoData = [];
    }

    // Generate course with AI
    const newCourse = await generateCourseWithAI(
      channelInfo,
      videoData,
      () => { /* steps are handled inside the loader component */ }
    );

    // Save and redirect
    CourseStore.save(newCourse);
    setCourses((prev) => [...prev, newCourse]);
    setGenerating(false);

    // Start transcript extraction in the background (if backend available)
    try {
      const backendUp = await checkTranscriptBackendHealth()
      if (backendUp) {
        const transcriptVideos = newCourse.modules.flatMap((mod) =>
          mod.lessons
            .filter((l) => l.videoId)
            .map((l) => ({
              lessonId: l.id,
              videoId: l.videoId!,
              title: l.title,
              sourceUrl: l.sourceUrl || `https://youtube.com/watch?v=${l.videoId}`,
            }))
        )

        if (transcriptVideos.length > 0) {
          console.log('[Dashboard] Starting transcript extraction for', transcriptVideos.length, 'videos')

          // Run in background — don't block navigation
          extractTranscriptsWithPolling(
            newCourse.id,
            transcriptVideos,
            (status: TranscriptJobResponse) => {
              console.group('[CourseForge] Transcript polling')
              console.log('jobId:', status.jobId)
              console.log('status:', status.status)
              console.log('progress:', status.progress)
              console.log('stage:', status.stage)
              console.log('completed:', status.completed, 'of', status.total)
              console.groupEnd()

              if (status.status === 'complete' && status.result) {
                const successful = status.result.filter((r) => r.transcriptStatus === 'available')
                console.log(`[Transcript] Complete: ${successful.length}/${status.result.length} transcripts available`)
                CourseStore.saveTranscripts(
                  newCourse.id,
                  status.result.map((r) => ({
                    lessonId: r.lessonId,
                    transcript: r.transcript,
                    transcriptStatus: r.transcriptStatus as 'available' | 'missing' | 'failed',
                    language: r.language || undefined,
                    source: r.source,
                  }))
                )
              }
            }
          ).catch((err) => {
            console.error('[Transcript] Extraction failed:', err)
          })
        }
      }
    } catch {
      // Backend not available — transcripts will use description fallback
      console.log('[Dashboard] Transcript backend unavailable — using description fallback')
    }

    navigate(`/app/course/${newCourse.id}`);
  }, [navigate]);

  const handleDeleteAll = useCallback(() => {
    CourseStore.deleteAll();
    setCourses([]);
  }, []);

  const handleResetProgress = useCallback(() => {
    for (const c of courses) {
      CourseStore.resetProgress(c.id);
    }
    setCourses(CourseStore.loadAll());
  }, [courses]);

  // Settings button is rendered inline in populated state

  if (!loaded) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          backgroundColor: 'var(--abyss)',
          paddingTop: '64px',
        }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--abyss)',
        paddingTop: '64px',
      }}
    >
      {/* Empty State */}
      <AnimatePresence mode="wait">
        {courses.length === 0 && (
          <EmptyState onCreateCourse={() => setCreateModalOpen(true)} />
        )}
      </AnimatePresence>

      {/* Populated State */}
      <AnimatePresence>
        {courses.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="mx-auto px-6 py-12"
            style={{ maxWidth: 'var(--max-width-lg)' }}
          >
            {/* System Health Bar */}
            <div className="mb-6">
              <SystemHealthBar />
            </div>

            {/* Section Header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2
                  className="font-display"
                  style={{
                    fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                    color: 'var(--ice)',
                    fontWeight: 400,
                  }}
                >
                  Active Courses
                </h2>
                <span
                  style={{
                    color: 'var(--cyan)',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    fontSize: '1rem',
                  }}
                >
                  ({courses.length})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-normal transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--ice)',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <Plus size={16} />
                  New Course
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSettingsOpen(true)}
                  className="rounded-xl p-2.5 transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--cyan)',
                  }}
                  aria-label="Settings"
                >
                  <Settings size={18} />
                </motion.button>
              </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateCourse}
      />

      {/* Generation Loader */}
      <GenerationLoader
        isOpen={generating}
        onCancel={() => setGenerating(false)}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={() => navigate('/app')}
        onDeleteAll={handleDeleteAll}
        onResetProgress={handleResetProgress}
      />
    </div>
  );
}
