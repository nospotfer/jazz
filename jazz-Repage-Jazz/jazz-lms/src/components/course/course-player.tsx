'use client';
import MuxPlayer from '@mux/mux-player-react';
import { Button } from '../ui/button';
import { CheckCircle, Download } from 'lucide-react';
import { CourseSidebar } from './course-sidebar';
import { Chapter, Course, Lesson, Attachment } from '@prisma/client';
import { useState } from 'react';
import { useConfettiStore } from '@/hooks/use-confetti-store';
import { toast } from 'sonner';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface CoursePlayerProps {
  course: Course & {
    chapters: (Chapter & {
      lessons: (Lesson & {
        attachments: Attachment[];
      })[];
    })[];
  };
  lesson: Lesson & {
    attachments: Attachment[];
  };
  lessonId: string;
}

export const CoursePlayer = ({
  course,
  lesson,
  lessonId,
}: CoursePlayerProps) => {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const confetti = useConfettiStore();

  const onEnded = async () => {
    try {
      await axios.put(
        `/api/courses/${course.id}/lessons/${lesson.id}/progress`,
        {
          isCompleted: true,
        }
      );

      confetti.onOpen();
      toast.success('Lesson completed!');
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    }
  };

  const onMarkAsComplete = async () => {
    try {
      await axios.put(
        `/api/courses/${course.id}/lessons/${lesson.id}/progress`,
        {
          isCompleted: true,
        }
      );

      confetti.onOpen();
      toast.success('Lesson completed!');
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      <CourseSidebar course={course} lessonId={lessonId} />
      <div className="flex-1 flex flex-col">
        <div className="relative aspect-video">
          <MuxPlayer
            playbackId={lesson.videoUrl || ''}
            accentColor="#d4af37"
            onCanPlay={() => setIsReady(true)}
            onEnded={onEnded}
            autoPlay
          />
        </div>
        <div className="p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-serif">{lesson.title}</h2>
            <div className="flex items-center gap-x-4">
              {lesson.attachments.length > 0 && (
                <a
                  href={lesson.attachments[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </a>
              )}
              <Button onClick={onMarkAsComplete}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Complete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
