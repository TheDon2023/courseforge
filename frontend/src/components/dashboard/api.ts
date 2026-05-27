import type { Course, Module, Lesson } from '../../types/course';
import type { YouTubeChannelInfo, GenerationStep } from './types';
import { callOpenRouterWithFallback } from '../../lib/AiProvider';

const STORAGE_KEYS = {
  courses: 'courseforge_courses',
  youtubeKey: 'courseforge_youtube_api_key',
  openrouterKey: 'courseforge_openrouter_api_key',
  preferredModel: 'courseforge_preferred_model',
} as const;

/** Check if a lesson is completed via the individual localStorage key */
function isLessonCompleteFromStorage(courseId: string, lessonId: string): boolean {
  try {
    return localStorage.getItem(`courseforge_complete_${courseId}_${lessonId}`) === 'true';
  } catch (err) {
    console.warn('[api] isLessonComplete failed:', err);
    return false;
  }
}

/** Sync individual completion keys into a course object */
function syncCourseCompletion(course: Course): Course {
  let totalLessons = 0;
  let completedLessons = 0;
  const syncedModules = course.modules.map((mod) => {
    const syncedLessons = mod.lessons.map((lesson) => {
      totalLessons++;
      const fromStorage = isLessonCompleteFromStorage(course.id, lesson.id);
      const isComplete = lesson.completed || fromStorage;
      if (isComplete) completedLessons++;
      return { ...lesson, completed: isComplete };
    });
    return { ...mod, lessons: syncedLessons };
  });
  return {
    ...course,
    modules: syncedModules,
    totalLessons,
    completedLessons,
    progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
  };
}

export const getStoredCourses = (): Course[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.courses);
    if (!data) return [];
    const courses: Course[] = JSON.parse(data);
    // Sync individual completion keys into every course
    return courses.map((c) => syncCourseCompletion(c));
  } catch {
    return [];
  }
};

export const saveCourses = (courses: Course[]): void => {
  localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(courses));
};

export const getApiKeys = () => {
  const youtubeKey = localStorage.getItem(STORAGE_KEYS.youtubeKey) || '';
  const openrouterKey = localStorage.getItem(STORAGE_KEYS.openrouterKey) || '';
  console.log('[CourseForge] getApiKeys() read from localStorage:', {
    storageKey: STORAGE_KEYS.youtubeKey,
    youtubeKeyPresent: !!youtubeKey,
    youtubeKeyLength: youtubeKey.length,
    youtubeKeyPrefix: youtubeKey ? youtubeKey.substring(0, 10) + '...' : 'EMPTY',
    openrouterKeyPresent: !!openrouterKey,
  });
  return { youtubeKey, openrouterKey };
};

export const getPreferredModel = (): string => {
  return localStorage.getItem(STORAGE_KEYS.preferredModel) || 'google/gemma-2-9b-it:free';
};

export const savePreferredModel = (model: string): void => {
  localStorage.setItem(STORAGE_KEYS.preferredModel, model);
};

const SAMPLE_COURSE: Course = {
  id: 'demo-1',
  title: '[SAMPLE] Introduction to Networking',
  channelName: 'The Network',
  channelUrl: 'https://youtube.com/@thenetwork411',
  thumbnail: 'https://img.youtube.com/vi/rfscVS0vtbw/maxresdefault.jpg',
  totalLessons: 12,
  completedLessons: 0,
  progress: 0,
  sample: true,
  modules: [
    {
      title: 'Module 1: Networking Fundamentals',
      lessons: [
        { id: 'l1', title: 'What is a Network?', duration: '8:32', completed: false, videoId: 'DEMO' },
        { id: 'l2', title: 'Types of Networks', duration: '12:15', completed: false, videoId: 'DEMO' },
        { id: 'l3', title: 'Network Topologies', duration: '10:45', completed: false, videoId: 'DEMO' },
        { id: 'l4', title: 'The OSI Model Explained', duration: '15:20', completed: false, videoId: 'DEMO' },
        { id: 'l5', title: 'TCP/IP Protocol Suite', duration: '14:10', completed: false, videoId: 'DEMO' },
        { id: 'l6', title: 'Network Devices Overview', duration: '11:25', completed: false, videoId: 'DEMO' },
        { id: 'l7', title: 'Network Security Basics', duration: '13:50', completed: false, videoId: 'DEMO' },
      ]
    },
    {
      title: 'Module 2: IP Addressing',
      lessons: [

        { id: 'l8', title: 'IP Addresses Overview', duration: '9:10', completed: false, videoId: 'DEMO' },
        { id: 'l9', title: 'Subnetting Basics', duration: '14:30', completed: false, videoId: 'DEMO' },
        { id: 'l10', title: 'Public vs Private IPs', duration: '7:45', completed: false, videoId: 'DEMO' },
        { id: 'l11', title: 'IPv6 Fundamentals', duration: '10:20', completed: false, videoId: 'DEMO' },
        { id: 'l12', title: 'Network Troubleshooting', duration: '16:05', completed: false, videoId: 'DEMO' },
      ]
    }
  ]
};

export const getDemoCourses = (): Course[] => [SAMPLE_COURSE];

export function extractChannelId(url: string): string | null {
  // Handle @handle format
  const handleMatch = url.match(/@([a-zA-Z0-9_-]+)/);
  if (handleMatch) return handleMatch[1];

  // Handle channel ID format
  const channelIdMatch = url.match(/channel\/([a-zA-Z0-9_-]+)/);
  if (channelIdMatch) return channelIdMatch[1];

  // Handle c/ format
  const cMatch = url.match(/c\/([a-zA-Z0-9_-]+)/);
  if (cMatch) return cMatch[1];

  return null;
}

/** Extract playlist ID from various YouTube playlist URL formats */
export function extractPlaylistId(url: string): string | null {
  // Standard playlist URL: ?list=PL...
  const listMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) return listMatch[1];

  // YouTube Music / shortened playlist URLs
  const shortMatch = url.match(/playlist\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];

  return null;
}

export interface ChannelSearchResult {
  info: YouTubeChannelInfo | null;
  error?: string;
  /** If the input was a playlist, this contains the playlist ID */
  playlistId?: string;
  /** If true, this is a playlist-based course, not a channel-based course */
  isPlaylist?: boolean;
}

export async function fetchYouTubeChannelInfo(query: string): Promise<ChannelSearchResult> {
  const { youtubeKey } = getApiKeys();

  // Check if input is a playlist URL
  const playlistId = extractPlaylistId(query);
  if (playlistId) {
    if (!youtubeKey) {
      return {
        info: { id: `pl-${playlistId}`, name: 'Playlist Course', handle: `@playlist`, thumbnail: '', subscriberCount: '—', videoCount: '—', demo: true },
        playlistId, isPlaylist: true,
      };
    }
    try {
      const trimmedKey = youtubeKey.trim();
      const res = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${trimmedKey}`);
      const data = await res.json();
      if (data.error) return { info: null, error: `Playlist API error: ${data.error.message}` };
      if (!data.items?.length) return { info: null, error: 'Playlist not found. Check the URL and try again.' };
      const pl = data.items[0];
      return {
        info: { id: `pl-${playlistId}`, name: pl.snippet.title || 'Untitled Playlist', handle: `@playlist`, thumbnail: pl.snippet.thumbnails?.high?.url || pl.snippet.thumbnails?.default?.url || '', subscriberCount: '—', videoCount: '—' },
        playlistId, isPlaylist: true,
      };
    } catch (err) {
      console.error('Error fetching playlist:', err);
      return { info: null, error: 'Network error fetching playlist.' };
    }
  }

  if (!youtubeKey) {
    // Demo mode: extract handle from user input for realistic preview
    const handle = extractChannelId(query) || query.replace(/^.*\//, '').replace(/^@/, '') || 'demo-channel';
    const displayHandle = handle.startsWith('@') ? handle : `@${handle}`;
    const name = handle.replace(/^@/, '').replace(/([A-Z])/g, ' $1').replace(/^\w/, (c) => c.toUpperCase());
    // Generate initials avatar from channel name
    const initials = name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
    const bgColor = stringToColor(handle);
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=fff&size=128&font-size=0.5&bold=true`;
    return {
      info: {
        id: 'mock-channel',
        name,
        handle: displayHandle,
        thumbnail: avatarUrl,
        subscriberCount: '—',
        videoCount: '—',
        demo: true,
      }
    };
  }

  try {
    // Extract handle or identifier from the query
    const handle = extractChannelId(query);
    let apiUrl: string;

    // Validate key looks like a real YouTube API key (39 chars, starts with AIza)
    const trimmedKey = youtubeKey.trim();
    if (!trimmedKey.startsWith('AIza') || trimmedKey.length < 20) {
      return { info: null, error: 'Your YouTube API key looks invalid (should start with "AIza" and be ~39 characters). Please re-copy it from Google Cloud Console.' };
    }

    if (handle) {
      // Use forHandle parameter for @username lookups — more accurate and cheaper (1 quota unit)
      // Pass handle WITHOUT @ prefix — YouTube accepts either, plain is simpler
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(handle)}&key=${trimmedKey}`;
    } else {
      // Fallback: use search endpoint for generic name queries
      apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=1&key=${trimmedKey}`;
    }

    console.log('[CourseForge] YouTube API URL:', apiUrl.replace(youtubeKey, '***KEY_HIDDEN***'));
    
    const res = await fetch(apiUrl);
    const data = await res.json();

    console.log('[CourseForge] YouTube API response:', data);

    // Check for API errors
    if (data.error) {
      const err = data.error;
      if (err.code === 400) {
        const reason = err.errors?.[0]?.reason;
        if (reason === 'keyInvalid') {
          return { info: null, error: 'Invalid YouTube API key. Please check your key in Settings.' };
        }
      }
      if (err.code === 403) {
        const reason = err.errors?.[0]?.reason;
        if (reason === 'accessNotConfigured') {
          return { info: null, error: 'YouTube Data API v3 is not enabled. Go to Google Cloud Console → APIs & Services → Library → Enable "YouTube Data API v3".' };
        }
        if (reason === 'quotaExceeded') {
          return { info: null, error: 'YouTube API quota exceeded. Try again tomorrow or use a different key.' };
        }
        if (reason === 'refererNotAllowed') {
          return { info: null, error: 'API key referrer restriction blocked this request. In Google Cloud Console, add https://hwlcohpwurya2.kimi.page/* to allowed referrers (or remove referrer restriction for testing).' };
        }
        return { info: null, error: `YouTube API error: ${err.message}` };
      }
      return { info: null, error: `YouTube API error (${err.code}): ${err.message}` };
    }

    if (!data.items?.length) {
      return { info: null, error: 'No channel found for that URL. Try a different channel name or URL.' };
    }

    // When using forHandle (channels.list), data.items[0] is the channel directly
    // When using search, data.items[0] is a search result, need to get channelId
    let channel;
    if (handle) {
      // Direct channels.list response
      channel = data.items[0];
      const subs = Number(channel.statistics?.subscriberCount || 0);
      const videos = Number(channel.statistics?.videoCount || 0);
      return {
        info: {
          id: channel.id,
          name: channel.snippet.title,
          handle: channel.snippet.customUrl || `@${channel.snippet.title.toLowerCase().replace(/\s+/g, '')}`,
          thumbnail: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
          subscriberCount: subs >= 1_000_000 ? `${(subs / 1_000_000).toFixed(1)}M` : subs >= 1_000 ? `${(subs / 1_000).toFixed(1)}K` : `${subs}`,
          videoCount: `${videos}`,
        }
      };
    } else {
      // Search response — need second call for statistics
      const searchResult = data.items[0];
      const cid = searchResult.id.channelId;

      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${cid}&key=${youtubeKey}`
      );
      const statsData = await statsRes.json();

      if (statsData.error || !statsData.items?.length) {
        return { info: null, error: 'Channel found but could not load full details.' };
      }

      const info = statsData.items[0];
      const subs = Number(info.statistics.subscriberCount);
      const videos = Number(info.statistics.videoCount);

      return {
        info: {
          id: cid,
          name: info.snippet.title,
          handle: info.snippet.customUrl || `@${info.snippet.title.toLowerCase().replace(/\s+/g, '')}`,
          thumbnail: info.snippet.thumbnails?.high?.url || info.snippet.thumbnails?.default?.url,
          subscriberCount: subs >= 1_000_000 ? `${(subs / 1_000_000).toFixed(1)}M` : subs >= 1_000 ? `${(subs / 1_000).toFixed(1)}K` : `${subs}`,
          videoCount: `${videos}`,
        }
      };
    }
  } catch (error) {
    console.error('Error fetching channel:', error);
    return { info: null, error: 'Network error. Check your internet connection and try again.' };
  }
}

export interface YouTubeVideo {
  id: string;
  videoId: string;
  title: string;
  description: string;
  duration: string;
  thumbnailUrl: string;
  sourceUrl: string;
  publishedAt?: string;
}

export async function fetchChannelVideos(channelId: string): Promise<YouTubeVideo[]> {
  const { youtubeKey } = getApiKeys();

  if (!youtubeKey) {
    // Return mock video data with real YouTube IDs
    const mockIds = ['dQw4w9WgXcQ', 'rfscVS0vtbw', '9bZkp7q19f0', 'M7lc1UVf-VE', 'jNQXAC9IVRw', 'LXb3EKWsInQ', 'dQw4w9WgXcQ', 'rfscVS0vtbw'];
    return Array.from({ length: 8 }, (_, i) => ({
      id: mockIds[i],
      videoId: mockIds[i],
      title: `Video ${i + 1}: Introduction to Topic ${i + 1}`,
      description: '',
      duration: `${Math.floor(Math.random() * 15 + 5)}:${Math.floor(Math.random() * 50 + 10).toString().padStart(2, '0')}`,
      thumbnailUrl: `https://img.youtube.com/vi/${mockIds[i]}/maxresdefault.jpg`,
      sourceUrl: `https://youtube.com/watch?v=${mockIds[i]}`,
    }));
  }

  try {
    // Step 1: Get video list from search
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&maxResults=50&order=date&key=${youtubeKey}`
    );
    const searchData = await searchRes.json();

    if (!searchData.items?.length) return [];

    const items = (searchData.items || []).map((item: Record<string, unknown>) => {
      const vidId = (item.id as Record<string, string>)?.videoId || '';
      const snippet = (item.snippet as Record<string, unknown>) || {};
      return {
        id: vidId,
        videoId: vidId,
        title: (snippet.title as string) || '',
        description: (snippet.description as string) || '',
        thumbnailUrl: ((snippet.thumbnails as Record<string, { url: string }>)?.high?.url || (snippet.thumbnails as Record<string, { url: string }>)?.default?.url || ''),
        sourceUrl: `https://youtube.com/watch?v=${vidId}`,
        publishedAt: (snippet.publishedAt as string) || undefined,
        duration: '', // Will be filled by videos.list call
      };
    });

    // Step 2: Get durations via videos.list API
    const videoIds = items.map((v: YouTubeVideo) => v.videoId).filter(Boolean).join(',');
    if (videoIds) {
      const videosRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${youtubeKey}`
      );
      const videosData = await videosRes.json();

      const durationMap: Record<string, string> = {};
      (videosData.items || []).forEach((v: Record<string, unknown>) => {
        const vidId = v.id as string;
        const duration = (v.contentDetails as Record<string, string>)?.duration || '';
        // Convert ISO 8601 duration to readable format (e.g., PT8M32S -> 8:32)
        durationMap[vidId] = formatISODuration(duration);
      });

      items.forEach((v: YouTubeVideo) => {
        v.duration = durationMap[v.videoId] || '10:00';
      });
    }

    return items;
  } catch (err) {
    console.error('[fetchChannelVideos] Error:', err);
    return [];
  }
}

/** Fetch videos from a YouTube playlist */
export async function fetchPlaylistVideos(playlistId: string): Promise<YouTubeVideo[]> {
  const { youtubeKey } = getApiKeys();

  if (!youtubeKey) {
    // Return mock data
    const mockIds = ['dQw4w9WgXcQ', 'rfscVS0vtbw', '9bZkp7q19f0', 'M7lc1UVf-VE', 'jNQXAC9IVRw'];
    return Array.from({ length: 5 }, (_, i) => ({
      id: mockIds[i] || `mock${i}`,
      videoId: mockIds[i] || `mock${i}`,
      title: `Playlist Video ${i + 1}`,
      description: '',
      duration: `${Math.floor(Math.random() * 15 + 5)}:${Math.floor(Math.random() * 50 + 10).toString().padStart(2, '0')}`,
      thumbnailUrl: `https://img.youtube.com/vi/${mockIds[i] || 'rfscVS0vtbw'}/maxresdefault.jpg`,
      sourceUrl: `https://youtube.com/watch?v=${mockIds[i] || 'rfscVS0vtbw'}`,
    }));
  }

  try {
    const trimmedKey = youtubeKey.trim();
    // Step 1: Get playlist items
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${trimmedKey}`
    );
    const playlistData = await playlistRes.json();

    if (!playlistData.items?.length) return [];

    const items = (playlistData.items || []).map((item: Record<string, unknown>) => {
      const snippet = (item.snippet as Record<string, unknown>) || {};
      const vidId = (snippet.resourceId as Record<string, string>)?.videoId || '';
      return {
        id: vidId,
        videoId: vidId,
        title: (snippet.title as string) || '',
        description: (snippet.description as string) || '',
        thumbnailUrl: ((snippet.thumbnails as Record<string, { url: string }>)?.high?.url || (snippet.thumbnails as Record<string, { url: string }>)?.default?.url || ''),
        sourceUrl: `https://youtube.com/watch?v=${vidId}`,
        publishedAt: (snippet.publishedAt as string) || undefined,
        duration: '',
      };
    }).filter((v: YouTubeVideo) => v.videoId); // Filter out private/deleted videos

    // Step 2: Get durations
    const videoIds = items.map((v: YouTubeVideo) => v.videoId).filter(Boolean).join(',');
    if (videoIds) {
      const videosRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${trimmedKey}`
      );
      const videosData = await videosRes.json();

      const durationMap: Record<string, string> = {};
      (videosData.items || []).forEach((v: Record<string, unknown>) => {
        const vidId = v.id as string;
        const duration = (v.contentDetails as Record<string, string>)?.duration || '';
        durationMap[vidId] = formatISODuration(duration);
      });

      items.forEach((v: YouTubeVideo) => {
        v.duration = durationMap[v.videoId] || '10:00';
      });
    }

    return items;
  } catch (err) {
    console.error('[fetchPlaylistVideos] Error:', err);
    return [];
  }
}

/** Convert ISO 8601 duration (PT8M32S) to readable format (8:32) */
function formatISODuration(iso: string): string {
  if (!iso) return '10:00';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '10:00';
  const hours = parseInt(match[1] || '0', 10);
  const mins = parseInt(match[2] || '0', 10);
  const secs = parseInt(match[3] || '0', 10);
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Find the best matching video from videoData for a given lesson title.
 *  Uses simple word overlap scoring to match AI-generated lesson titles
 *  back to original video titles. Prevents wrong videoId assignment. */
function findBestVideoMatch(lessonTitle: string, videoData: YouTubeVideo[], used: Set<number>): { video: YouTubeVideo | null; idx: number } {
  if (!videoData.length) return { video: null, idx: -1 }

  const lessonWords = lessonTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 2)

  let bestIdx = -1
  let bestScore = -1

  for (let i = 0; i < videoData.length; i++) {
    if (used.has(i)) continue

    const videoWords = videoData[i].title.toLowerCase().split(/\s+/).filter((w) => w.length > 2)

    // Count overlapping words
    const overlap = lessonWords.filter((lw) => videoWords.includes(lw)).length
    const score = overlap

    if (score > bestScore) {
      bestScore = score
      bestIdx = i
    }
  }

  // If no word overlap at all, pick the first unused video as fallback
  if (bestScore === 0) {
    for (let i = 0; i < videoData.length; i++) {
      if (!used.has(i)) {
        bestIdx = i
        break
      }
    }
  }

  if (bestIdx >= 0) {
    used.add(bestIdx)
    return { video: videoData[bestIdx], idx: bestIdx }
  }

  return { video: null, idx: -1 }
}

export async function extractTranscript(videoId: string): Promise<string> {
  try {
    // Try to fetch transcript via CORS proxy
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`
    )}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  }
}

export async function generateCourseWithAI(
  channelInfo: YouTubeChannelInfo,
  videoData: YouTubeVideo[],
  onStep: (step: GenerationStep) => void,
): Promise<Course> {
  const { openrouterKey } = getApiKeys();

  onStep('Fetching channel videos...');
  await delay(1200);

  onStep('Extracting transcripts...');
  await delay(1500);

  onStep('Analyzing content with AI...');
  await delay(1800);

  onStep('Building course structure...');
  await delay(1500);

  onStep('Course ready!');
  await delay(500);

  if (!openrouterKey) {
    // Return demo course with updated info
    const course = {
      ...SAMPLE_COURSE,
      id: `course-${Date.now()}`,
      title: `[SAMPLE] Introduction to ${channelInfo.name}`,
      channelName: channelInfo.name,
      channelUrl: `https://youtube.com/${channelInfo.handle}`,
      thumbnail: channelInfo.thumbnail,
      sample: true,
    };
    // Mark all lessons with videoId: 'DEMO' so the player shows a placeholder
    course.modules = course.modules.map((mod) => ({
      ...mod,
      lessons: mod.lessons.map((lesson) => ({
        ...lesson,
        videoId: 'DEMO',
      })),
    }));
    return course;
  }

  // Real OpenRouter API call with model fallback
  try {
    // Build a list of video titles to give the AI context about the channel's content
    const videoList = videoData.map((v, i) => `${i + 1}. "${v.title}"`).join('\n');
    
    console.log('[CourseForge] Calling OpenRouter with fallback, key length:', openrouterKey.length);
    
    const prompt = `You are an expert course designer. Create a structured learning course based on the YouTube channel "${channelInfo.name}".

Here are the actual video titles from this channel. Use them as the source material to design the course:
${videoList || '(No video data available)'}

Instructions:
- Create course modules and lessons that reflect the ACTUAL topics and themes from the video titles above.
- The course title should capture what this channel teaches.
- Each module should group related videos/topics together.
- Return ONLY a JSON object with this exact structure:
{ "title": string, "modules": [{ "title": string, "lessons": [{ "title": string, "duration": string }] }] }
- Create 2-4 modules with 3-8 lessons each.
- Make lesson titles educational and descriptive based on the video content.
- Use realistic video durations like "8:32" or "15:20".`;

    const content = await callOpenRouterWithFallback(
      openrouterKey,
      [{ role: 'user', content: prompt }],
    );
    
    console.log('[CourseForge] OpenRouter fallback SUCCESS');

    // Try to parse JSON from the response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    if (parsed && parsed.modules) {
      const usedVideos = new Set<number>();
      let lessonCounter = 0;
      const modules: Module[] = parsed.modules.map((m: { title: string; lessons: Array<{ title: string; duration?: string }> }) => ({
        title: m.title,
        lessons: m.lessons.map((l) => {
          lessonCounter++;
          // Match lesson title to original video by title similarity
          // This prevents wrong videoId assignment when AI renames/reorders lessons
          const match = findBestVideoMatch(l.title, videoData, usedVideos);
          const video = match.video;
          return {
            id: `l${lessonCounter}`,
            title: l.title,
            description: video?.description || '',
            duration: video?.duration || l.duration || '10:00',
            videoId: video?.videoId || '',
            thumbnailUrl: video?.thumbnailUrl || '',
            sourceUrl: video?.sourceUrl || '',
            transcriptStatus: 'not_requested' as const,
            completed: false,
          };
        }),
      }));

      const totalLessons = modules.reduce((acc: number, m: { lessons: unknown[] }) => acc + m.lessons.length, 0);

      return {
        id: `course-${Date.now()}`,
        title: parsed.title || `Introduction to ${channelInfo.name}`,
        channelName: channelInfo.name,
        channelUrl: `https://youtube.com/${channelInfo.handle}`,
        thumbnail: channelInfo.thumbnail,
        totalLessons,
        completedLessons: 0,
        progress: 0,
        modules,
      };
    }

    // AI response couldn't be parsed — generate from videos directly
    console.log('[CourseForge] AI response unparseable, using video-based generation');
    return generateCourseFromVideos(channelInfo, videoData);
  } catch (error) {
    console.error('[CourseForge] AI generation error:', error);
    return generateCourseFromVideos(channelInfo, videoData);
  }
}

/**
 * Generate a course directly from video titles — NO AI needed.
 * Groups videos into modules, uses REAL video IDs.
 * Only falls back to SAMPLE_COURSE if there are zero videos.
 */
function generateCourseFromVideos(
  channelInfo: YouTubeChannelInfo,
  videoData: YouTubeVideo[],
): Course {
  console.log('[CourseForge] Building course from', videoData.length, 'videos');

  if (videoData.length === 0) {
    return {
      ...SAMPLE_COURSE,
      id: `course-${Date.now()}`,
      title: `[SAMPLE] Introduction to ${channelInfo.name}`,
      channelName: channelInfo.name,
      channelUrl: `https://youtube.com/${channelInfo.handle}`,
      thumbnail: channelInfo.thumbnail,
      sample: true,
    };
  }

  // Chunk videos into modules of ~8 lessons each
  const MODULE_SIZE = 8;
  const modules: Module[] = [];
  for (let i = 0; i < videoData.length; i += MODULE_SIZE) {
    const chunk = videoData.slice(i, i + MODULE_SIZE);
    modules.push({
      title: `Module ${Math.floor(i / MODULE_SIZE) + 1}: ${channelInfo.name} Content`,
      lessons: chunk.map((v, idx): Lesson => ({
        id: `l${i + idx + 1}`,
        title: v.title,
        description: v.description || '',
        duration: v.duration || `${Math.floor(Math.random() * 15 + 5)}:${Math.floor(Math.random() * 50 + 10).toString().padStart(2, '0')}`,
        videoId: v.videoId || v.id,
        thumbnailUrl: v.thumbnailUrl,
        sourceUrl: v.sourceUrl,
        transcriptStatus: 'not_requested',
        completed: false,
      })),
    });
  }

  return {
    id: `course-${Date.now()}`,
    title: `Introduction to ${channelInfo.name}`,
    channelName: channelInfo.name,
    channelUrl: `https://youtube.com/${channelInfo.handle}`,
    thumbnail: channelInfo.thumbnail,
    totalLessons: videoData.length,
    completedLessons: 0,
    progress: 0,
    modules,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Convert a string to a consistent hex color (for demo avatars)
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase().padStart(6, '0');
  return c;
}
