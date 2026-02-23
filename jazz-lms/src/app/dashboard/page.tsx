import { LobbyClient } from '@/components/dashboard/lobby-client';

export default function DashboardPage() {
  // Mock data for development (no Supabase/DB)
  const purchasedCourses = [
    {
      id: 'course-1',
      title: 'Jazz Fundamentals: History & Theory',
      description: 'An introduction to jazz music history, key figures, and foundational music theory.',
      imageUrl: null,
      progress: 45,
      totalLessons: 12,
      chaptersCount: 4,
      purchased: true,
    },
    {
      id: 'course-2',
      title: 'Improvisation Techniques',
      description: 'Learn the art of jazz improvisation with practical exercises and real-world examples.',
      imageUrl: null,
      progress: 10,
      totalLessons: 8,
      chaptersCount: 3,
      purchased: true,
    },
  ];

  const availableCourses = [
    {
      id: 'course-3',
      title: 'Advanced Harmony & Composition',
      description: 'Deep dive into advanced jazz harmony, chord voicings, and composition techniques.',
      imageUrl: null,
      price: 49.99,
      totalLessons: 16,
      chaptersCount: 5,
      purchased: false,
      progress: 0,
    },
    {
      id: 'course-4',
      title: 'Jazz Piano Masterclass',
      description: 'Master jazz piano from comping to solo performance with Enric Vazquez.',
      imageUrl: null,
      price: 79.99,
      totalLessons: 20,
      chaptersCount: 6,
      purchased: false,
      progress: 0,
    },
    {
      id: 'course-5',
      title: 'The Art of Jazz Listening',
      description: 'Train your ear and develop deep appreciation for jazz music across all eras.',
      imageUrl: null,
      price: 29.99,
      totalLessons: 10,
      chaptersCount: 3,
      purchased: false,
      progress: 0,
    },
  ];

  return (
    <LobbyClient
      userName="Jazz Student"
      purchasedCourses={purchasedCourses}
      availableCourses={availableCourses}
    />
  );
}
