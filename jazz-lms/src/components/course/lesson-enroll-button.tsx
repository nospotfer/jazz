'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface LessonEnrollButtonProps {
  courseId: string;
  lessonId: string;
  price: number;
}

export function LessonEnrollButton({
  courseId,
  lessonId,
  price,
}: LessonEnrollButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/lesson-checkout', {
        courseId,
        lessonId,
      });

      window.location.assign(response.data.url);
    } catch {
      toast.error('Could not start lesson checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      variant="outline"
      className="h-8 text-xs"
      size="sm"
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <>
          <PlayCircle className="h-3.5 w-3.5 mr-1" />
          Buy video €{price.toFixed(2)}
        </>
      )}
    </Button>
  );
}
