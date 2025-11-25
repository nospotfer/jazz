'use client';
// Last updated: 2025-11-26 - Fixed null course handling
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import axios from 'axios';
import { Course } from '@prisma/client';

interface HeroProps {
  course: Course | null;
}

export const Hero = ({ course }: HeroProps) => {
  const handleCheckout = async () => {
    if (!course) return;

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // You might want to redirect to login or show a modal
        console.error('User not logged in');
        return;
      }

      const response = await axios.post('/api/checkout', {
        courseId: course.id,
      });

      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <div className="relative isolate pt-14">
      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="hidden sm:mb-8 sm:flex sm:justify-center">
          <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-border hover:ring-primary">
            A course by Enric Vazquez Ramonich.{' '}
            <a href="#" className="font-semibold text-primary">
              <span className="absolute inset-0" aria-hidden="true" />
              Read more <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl font-serif">
            {course?.title || 'Welcome to Jazz LMS'}
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {course?.description || 'Start your journey with our premium courses. Check back soon for new content!'}
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {course ? (
              <>
                <Button onClick={handleCheckout}>Inscríbete ahora</Button>
                <a
                  href="#"
                  className="text-sm font-semibold leading-6 text-foreground"
                >
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No courses available yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
