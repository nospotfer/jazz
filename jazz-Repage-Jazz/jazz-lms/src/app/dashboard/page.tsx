import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getProgress } from '@/actions/get-progress';

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth');
  }

  const purchases = await db.purchase.findMany({
    where: {
      userId: user.id,
    },
    include: {
      course: true,
    },
  });

  const courses = await Promise.all(
    purchases.map(async (purchase) => {
      const progress = await getProgress(user.id, purchase.courseId);
      return {
        ...purchase,
        progress,
      };
    })
  );

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold font-serif mb-8">My Learning</h1>
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">You haven't enrolled in any courses yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Browse our catalog to get started!</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-card p-6 rounded-lg shadow-lg"
            >
              <h2 className="text-2xl font-semibold mb-4">
                {course?.course?.title || 'Untitled Course'}
              </h2>
              <div className="w-full bg-muted rounded-full h-4">
                <div
                  className="bg-primary h-4 rounded-full"
                  style={{ width: `${course.progress || 0}%` }}
                ></div>
              </div>
              <p className="text-muted-foreground mt-2">{course.progress || 0}% complete</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
