import { useState } from 'react';
import { Settings, Download, RotateCcw, Trash2 } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Course } from '@/types/course';
import { CourseStore } from '@/lib/CourseStore';

interface CourseSettingsDropdownProps {
  course: Course;
  onCourseUpdated: (course: Course) => void;
  onCourseDeleted: () => void;
}

export default function CourseSettingsDropdown({
  course,
  onCourseUpdated,
  onCourseDeleted,
}: CourseSettingsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleExportNotes = () => {
    const data = {
      courseId: course.id,
      courseTitle: course.title,
      exportDate: new Date().toISOString(),
      modules: course.modules.map((mod) => ({
        title: mod.title,
        lessons: mod.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          completed: lesson.completed,
        })),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.title.replace(/\s+/g, '_')}_notes.json`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const handleResetProgress = () => {
    CourseStore.resetProgress(course.id);
    // Reload from store to get the fresh state
    const updated = CourseStore.load(course.id);
    if (updated) {
      onCourseUpdated(updated);
    }
    setShowResetDialog(false);
    setOpen(false);
  };

  const handleDeleteCourse = () => {
    CourseStore.delete(course.id);
    onCourseDeleted();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="inline-flex items-center justify-center rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: 'var(--warm-sand)',
              border: '1px solid rgba(10, 46, 82, 0.1)',
              color: 'var(--deep-ink)',
              transitionDuration: '150ms',
            }}
            aria-label="Course settings"
          >
            <Settings size={16} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(10, 46, 82, 0.06)',
            boxShadow: '0 8px 32px rgba(10, 46, 82, 0.08)',
            borderRadius: '12px',
            padding: '8px',
          }}
          align="end"
          sideOffset={4}
        >
          <div className="flex flex-col">
            <button
              onClick={handleExportNotes}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 400,
                color: 'var(--deep-ink)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 119, 182, 0.04)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              <Download size={14} style={{ color: 'var(--stone)' }} />
              Export Notes
            </button>
            <button
              onClick={() => { setShowResetDialog(true); setOpen(false); }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 400,
                color: 'var(--deep-ink)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 119, 182, 0.04)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              <RotateCcw size={14} style={{ color: 'var(--stone)' }} />
              Reset Progress
            </button>
            <div style={{ height: '1px', backgroundColor: 'rgba(10, 46, 82, 0.06)', margin: '4px 0' }} />
            <button
              onClick={() => { setShowDeleteDialog(true); setOpen(false); }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 400,
                color: 'var(--accent-red)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(230, 57, 70, 0.06)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              <Trash2 size={14} />
              Delete Course
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Reset Progress Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent
          showCloseButton
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(10, 46, 82, 0.06)',
            borderRadius: '20px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.15)',
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="font-display"
              style={{ color: 'var(--deep-ink)', fontSize: 'clamp(1.25rem, 2vw, 1.75rem)' }}
            >
              Reset Progress
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--stone)', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>
              Are you sure you want to reset all lesson progress for this course? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              style={{ borderRadius: '12px' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetProgress}
              style={{
                backgroundColor: 'var(--accent-red)',
                color: '#FFFFFF',
                borderRadius: '12px',
              }}
            >
              Reset Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Course Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent
          showCloseButton
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(10, 46, 82, 0.06)',
            borderRadius: '20px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.15)',
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="font-display"
              style={{ color: 'var(--deep-ink)', fontSize: 'clamp(1.25rem, 2vw, 1.75rem)' }}
            >
              Delete Course
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--stone)', fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>
              Are you sure you want to delete "{course.title}"? This will permanently remove the course and all progress data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              style={{ borderRadius: '12px' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteCourse}
              style={{
                backgroundColor: 'var(--accent-red)',
                color: '#FFFFFF',
                borderRadius: '12px',
              }}
            >
              Delete Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
