import { MyCoursesClient } from '@/components/dashboard/my-courses-client';

export default function MyCoursesPage() {
  // Mock data for development (no Supabase/DB)
  const courses = [
    {
      id: 'course-1',
      title: 'Jazz Fundamentals: History & Theory',
      description: 'An introduction to jazz music history, key figures, and foundational music theory.',
      imageUrl: null,
      progress: 45,
      totalLessons: 12,
      chaptersCount: 4,
    },
    {
      id: 'course-2',
      title: 'Improvisation Techniques',
      description: 'Learn the art of jazz improvisation with practical exercises and real-world examples.',
      imageUrl: null,
      progress: 10,
      totalLessons: 8,
      chaptersCount: 3,
    },
  ];

  return <MyCoursesClient courses={courses} />;
}
