// Last updated: 2025-11-26 - Fixed null course handling
import { Benefits } from '@/components/landing/benefits';
import { Hero } from '@/components/landing/hero';
import { Press } from '@/components/landing/press';
import { db } from '@/lib/db';

export default async function Home() {
  const course = await db.course.findFirst({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <main>
      <Hero course={course} />
      <Press />
      <Benefits />
    </main>
  );
}
