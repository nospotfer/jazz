'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useLanguage } from '@/components/providers/language-provider';

interface CourseEnrollButtonProps {
  courseId: string;
  price: number;
}

export function CourseEnrollButton({ courseId, price }: CourseEnrollButtonProps) {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const copy = {
    es: {
      somethingWrong: 'Algo salió mal. Inténtalo de nuevo.',
      enrollFree: 'Inscribirse gratis',
      buyCourse: 'Comprar curso',
    },
    en: {
      somethingWrong: 'Something went wrong. Please try again.',
      enrollFree: 'Enroll for free',
      buyCourse: 'Buy course',
    },
    fr: {
      somethingWrong: 'Une erreur est survenue. Réessayez.',
      enrollFree: 'S’inscrire gratuitement',
      buyCourse: 'Acheter le cours',
    },
    pt: {
      somethingWrong: 'Algo deu errado. Tente novamente.',
      enrollFree: 'Inscrever-se grátis',
      buyCourse: 'Comprar curso',
    },
  }[language];

  const onClick = async () => {
    try {
      setIsLoading(true);

      if (price === 0) {
        // For free courses, could directly enroll
        // For now redirect to checkout still
      }

      const response = await axios.post('/api/checkout', { courseId, language });

      // Redirect to Stripe Checkout
      window.location.assign(response.data.url);
    } catch {
      toast.error(copy.somethingWrong);
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
          {price === 0 ? copy.enrollFree : copy.buyCourse}
        </>
      )}
    </Button>
  );
}
