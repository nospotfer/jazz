'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface CourseEnrollButtonProps {
  courseId: string;
  price: number;
}

export function CourseEnrollButton({ courseId, price }: CourseEnrollButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);

      if (price === 0) {
        // For free courses, could directly enroll
        // For now redirect to checkout still
      }

      const response = await axios.post('/api/checkout', { courseId });

      // Redirect to Stripe Checkout
      window.location.assign(response.data.url);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
      size="lg"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <ShoppingCart className="h-5 w-5 mr-2" />
          {price === 0 ? 'Enroll for Free' : 'Purchase Course'}
        </>
      )}
    </Button>
  );
}
