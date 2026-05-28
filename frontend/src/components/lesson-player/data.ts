/**
 * Thin wrapper around CourseStore for lesson-player components.
 * Kept for backward compatibility — all real work is in CourseStore.
 */

import { CourseStore } from '../../lib/CourseStore'
import type { Course, Lesson } from './types'

const SAMPLE_COURSE: Course = {
  id: 'demo-1',
  title: 'Introduction to Networking',
  description: 'SAMPLE: Learn networking fundamentals from The Network YouTube channel',
  channelName: 'The Network',
  channelUrl: 'https://youtube.com/@thenetwork411',
  thumbnail: 'https://img.youtube.com/vi/rfscVS0vtbw/maxresdefault.jpg',
  totalLessons: 8,
  completedLessons: 0,
  progress: 0,
  sample: true,
  modules: [
    {
      id: 'm1',
      title: 'Module 1: Networking Fundamentals',
      lessons: [
        { id: 'l1', title: 'What is a Network?', duration: '8:32', completed: false, videoId: 'DEMO', description: '' },
        { id: 'l2', title: 'Types of Networks', duration: '12:15', completed: false, videoId: 'DEMO', description: '' },
        { id: 'l3', title: 'Network Topologies', duration: '10:45', completed: false, videoId: 'DEMO', description: '' },
        { id: 'l4', title: 'The OSI Model Explained', duration: '15:20', completed: false, videoId: 'DEMO', description: '' },
      ]
    },
    {
      id: 'm2',
      title: 'Module 2: IP Addressing',
      lessons: [
        { id: 'l5', title: 'IP Addresses Overview', duration: '9:10', completed: false, videoId: 'DEMO', description: '' },
        { id: 'l6', title: 'Subnetting Basics', duration: '14:30', completed: false, videoId: 'DEMO', description: '' },
        { id: 'l7', title: 'Public vs Private IPs', duration: '7:45', completed: false, videoId: 'DEMO', description: '' },
        { id: 'l8', title: 'IPv6 Fundamentals', duration: '10:20', completed: false, videoId: 'DEMO', description: '' },
      ]
    }
  ],
  createdAt: new Date().toISOString(),
  demo: true,
}

export function loadOrCreateCourse(courseId: string): Course {
  const course = CourseStore.load(courseId)
  if (course) return course as unknown as Course
  return SAMPLE_COURSE
}

export function findLesson(course: Course, lessonId: string): { lesson: Lesson; moduleIndex: number; lessonIndex: number } | null {
  for (let mi = 0; mi < course.modules.length; mi++) {
    for (let li = 0; li < course.modules[mi].lessons.length; li++) {
      if (course.modules[mi].lessons[li].id === lessonId) {
        return { lesson: course.modules[mi].lessons[li], moduleIndex: mi, lessonIndex: li }
      }
    }
  }
  return null
}

export function findAdjacentLessons(course: Course, lessonId: string): { prev: Lesson | null; next: Lesson | null } {
  const allLessons: Lesson[] = []
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      allLessons.push(lesson)
    }
  }
  const idx = allLessons.findIndex((l) => l.id === lessonId)
  return {
    prev: idx > 0 ? allLessons[idx - 1] : null,
    next: idx < allLessons.length - 1 ? allLessons[idx + 1] : null,
  }
}

export function isLessonCompleted(courseId: string, lessonId: string): boolean {
  const course = CourseStore.load(courseId)
  if (!course) return false
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      if (lesson.id === lessonId) return !!lesson.completed
    }
  }
  return false
}

export function setLessonCompleted(courseId: string, lessonId: string, completed: boolean): void {
  CourseStore.markLesson(courseId, lessonId, completed)
}

export function getLessonDisplayNumber(course: Course, lessonId: string): number {
  let count = 0
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      count++
      if (lesson.id === lessonId) return count
    }
  }
  return 0
}

export function getCompletedLessonsCount(course: Course): number {
  let count = 0
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      if (lesson.completed) count++
    }
  }
  return count
}

export function getTotalLessonsCount(course: Course): number {
  let count = 0
  for (const mod of course.modules) {
    count += mod.lessons.length
  }
  return count
}
