import type { Course } from '@/types/course';

const STORAGE_KEY = 'courseforge_courses';

export const SAMPLE_COURSE: Course = {
  id: 'demo-1',
  title: '[SAMPLE] Introduction to Networking',
  channelName: 'The Network',
  channelUrl: 'https://youtube.com/@thenetwork411',
  thumbnail: 'https://img.youtube.com/vi/qiQR5rTSshw/maxresdefault.jpg',
  totalLessons: 12,
  completedLessons: 3,
  progress: 25,
  modules: [
    {
      title: 'Module 1: Networking Fundamentals',
      lessons: [
        { id: 'l1', title: 'What is a Network?', duration: '8:32', completed: true, videoId: 'qiQR5rTSshw' },
        { id: 'l2', title: 'Types of Networks', duration: '12:15', completed: true, videoId: 'abc123' },
        { id: 'l3', title: 'Network Topologies', duration: '10:45', completed: true, videoId: 'def456' },
        { id: 'l4', title: 'The OSI Model Explained', duration: '15:20', completed: false, videoId: 'ghi789' },
      ],
    },
    {
      title: 'Module 2: IP Addressing',
      lessons: [
        { id: 'l5', title: 'IP Addresses Overview', duration: '9:10', completed: false, videoId: 'jkl012' },
        { id: 'l6', title: 'Subnetting Basics', duration: '14:30', completed: false, videoId: 'mno345' },
        { id: 'l7', title: 'Public vs Private IPs', duration: '7:45', completed: false, videoId: 'pqr678' },
      ],
    },
    {
      title: 'Module 3: Routing & Switching',
      lessons: [
        { id: 'l8', title: 'How Routers Work', duration: '11:20', completed: false, videoId: 'stu901' },
        { id: 'l9', title: 'Switching Fundamentals', duration: '13:15', completed: false, videoId: 'vwx234' },
        { id: 'l10', title: 'VLANs Explained', duration: '16:40', completed: false, videoId: 'yzab56' },
      ],
    },
    {
      title: 'Module 4: Network Security',
      lessons: [
        { id: 'l11', title: 'Firewalls and ACLs', duration: '14:50', completed: false, videoId: 'cdef78' },
        { id: 'l12', title: 'VPN Technologies', duration: '18:25', completed: false, videoId: 'ghij90' },
      ],
    },
  ],
};

export function getCourses(): Course[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Course[];
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

export function getCourseById(id: string): Course | null {
  const courses = getCourses();
  let course = courses.find((c) => c.id === id);

  if (!course) {
    if (id === 'demo-1') return SAMPLE_COURSE;
    if (courses.length === 0) return SAMPLE_COURSE;
    return null;
  }

  // ALWAYS sync individual completion keys into the course object
  // so every page shows the latest progress
  return recalculateProgress(course);
}

export function saveCourse(course: Course): void {
  const courses = getCourses();
  const idx = courses.findIndex((c) => c.id === course.id);
  if (idx >= 0) {
    courses[idx] = course;
  } else {
    courses.push(course);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

export function deleteCourse(courseId: string): void {
  const courses = getCourses().filter((c) => c.id !== courseId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

/** Check if a lesson is completed via individual localStorage key */
function isLessonCompleteFromStorage(courseId: string, lessonId: string): boolean {
  try {
    return localStorage.getItem(`courseforge_complete_${courseId}_${lessonId}`) === 'true';
  } catch {
    return false;
  }
}

export function recalculateProgress(course: Course): Course {
  let totalLessons = 0;
  let completedLessons = 0;
  for (const mod of course.modules) {
    totalLessons += mod.lessons.length;
    for (const lesson of mod.lessons) {
      // Check both the course JSON flag AND the individual localStorage key
      const isComplete = lesson.completed || isLessonCompleteFromStorage(course.id, lesson.id);
      lesson.completed = isComplete;
      if (isComplete) completedLessons++;
    }
  }
  course.totalLessons = totalLessons;
  course.completedLessons = completedLessons;
  course.progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  return course;
}

export function findFirstIncompleteLesson(course: Course): { moduleIndex: number; lessonIndex: number; lessonId: string } | null {
  for (let mi = 0; mi < course.modules.length; mi++) {
    for (let li = 0; li < course.modules[mi].lessons.length; li++) {
      if (!course.modules[mi].lessons[li].completed) {
        return { moduleIndex: mi, lessonIndex: li, lessonId: course.modules[mi].lessons[li].id };
      }
    }
  }
  return null;
}
