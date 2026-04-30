'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, PlayCircle, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';

interface CourseCard {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  progress: number;
  totalLessons: number;
  chaptersCount: number;
  purchased: boolean;
  price?: number | null;
}

interface LobbyClientProps {
  userName: string;
  purchasedCourses: CourseCard[];
  availableCourses: CourseCard[];
}

export function LobbyClient({
  userName,
  purchasedCourses,
  availableCourses,
}: LobbyClientProps) {
  const { language } = useLanguage();
  const copy = {
    es: {
      welcome: '¡Bienvenido de nuevo,',
      subtitle: 'Continúa donde lo dejaste o explora nuevos cursos para ampliar tu conocimiento del jazz.',
      enrolled: 'Inscritos',
      inProgress: 'En progreso',
      completed: 'Completados',
      continueLearning: 'Continuar aprendiendo',
      seeAll: 'Ver todo',
      exploreCourses: 'Explorar cursos',
      noCoursesTitle: 'Aún no hay cursos disponibles',
      noCoursesDesc: 'Próximamente habrá nuevos cursos. ¡Estate atento!',
      enrolledBadge: 'Inscrito',
      chapters: 'capítulos',
      lessons: 'lecciones',
      progress: 'Progreso',
    },
    en: {
      welcome: 'Welcome back,',
      subtitle: 'Continue where you left off or explore new courses to expand your jazz knowledge.',
      enrolled: 'Enrolled',
      inProgress: 'In progress',
      completed: 'Completed',
      continueLearning: 'Continue learning',
      seeAll: 'See all',
      exploreCourses: 'Explore courses',
      noCoursesTitle: 'No courses available yet',
      noCoursesDesc: 'New courses will be available soon. Stay tuned!',
      enrolledBadge: 'Enrolled',
      chapters: 'chapters',
      lessons: 'lessons',
      progress: 'Progress',
    },
    fr: {
      welcome: 'Bon retour,',
      subtitle: 'Reprenez où vous vous êtes arrêté ou explorez de nouveaux cours pour approfondir vos connaissances du jazz.',
      enrolled: 'Inscrit',
      inProgress: 'En cours',
      completed: 'Terminés',
      continueLearning: 'Continuer à apprendre',
      seeAll: 'Voir tout',
      exploreCourses: 'Explorer les cours',
      noCoursesTitle: 'Aucun cours disponible pour le moment',
      noCoursesDesc: 'De nouveaux cours seront bientôt disponibles. Restez à l’écoute !',
      enrolledBadge: 'Inscrit',
      chapters: 'chapitres',
      lessons: 'leçons',
      progress: 'Progression',
    },
    pt: {
      welcome: 'Bem-vindo de volta,',
      subtitle: 'Continue de onde parou ou explore novos cursos para ampliar seu conhecimento em jazz.',
      enrolled: 'Inscritos',
      inProgress: 'Em progresso',
      completed: 'Concluídos',
      continueLearning: 'Continuar aprendendo',
      seeAll: 'Ver tudo',
      exploreCourses: 'Explorar cursos',
      noCoursesTitle: 'Aún no hay cursos disponibles',
      noCoursesDesc: 'Novos cursos estarão disponíveis em breve. Fique atento!',
      enrolledBadge: 'Inscrito',
      chapters: 'capítulos',
      lessons: 'aulas',
      progress: 'Progresso',
    },
  }[language];

  const firstName = userName.split(' ')[0];
  const totalInProgress = purchasedCourses.filter(
    (c) => c.progress > 0 && c.progress < 100
  ).length;
  const totalCompleted = purchasedCourses.filter(
    (c) => c.progress === 100
  ).length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-6 sm:p-8">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            {copy.welcome} {firstName}!
          </h1>
          <p className="text-muted-foreground mt-2 max-w-lg">
            {copy.subtitle}
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 sm:gap-6 mt-6">
          <StatCard
            icon={<BookOpen className="h-5 w-5" />}
            label={copy.enrolled}
            value={purchasedCourses.length}
          />
          <StatCard
            icon={<PlayCircle className="h-5 w-5" />}
            label={copy.inProgress}
            value={totalInProgress}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label={copy.completed}
            value={totalCompleted}
          />
        </div>

        {/* Decorative element */}
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
      </div>

      {/* Continue Learning */}
      {purchasedCourses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-semibold text-foreground">
              {copy.continueLearning}
            </h2>
            <Link
              href="/dashboard/courses"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {copy.seeAll} →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {purchasedCourses.map((course) => (
              <CourseCardComponent key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Browse Courses */}
      {availableCourses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-semibold text-foreground">
              {copy.exploreCourses}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {availableCourses.map((course) => (
              <CourseCardComponent key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {purchasedCourses.length === 0 && availableCourses.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground">
            {copy.noCoursesTitle}
          </h2>
          <p className="text-muted-foreground mt-2">
            {copy.noCoursesDesc}
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm border border-border rounded-xl px-4 py-3">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function CourseCardComponent({ course }: { course: CourseCard }) {
  const { language } = useLanguage();
  const copy = {
    es: { enrolledBadge: 'Inscrito', chapters: 'capítulos', lessons: 'lecciones', progress: 'Progreso' },
    en: { enrolledBadge: 'Enrolled', chapters: 'chapters', lessons: 'lessons', progress: 'Progress' },
    fr: { enrolledBadge: 'Inscrit', chapters: 'chapitres', lessons: 'leçons', progress: 'Progression' },
    pt: { enrolledBadge: 'Inscrito', chapters: 'capítulos', lessons: 'aulas', progress: 'Progresso' },
  }[language];

  const href = course.purchased
    ? `/courses/${course.id}/lessons/${course.id}`
    : `/courses/${course.id}`;

  return (
    <Link href={href} className="group block">
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        {/* Image placeholder */}
        <div className="relative h-40 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
          {course.imageUrl ? (
            <Image
              src={course.imageUrl}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          {course.purchased && (
            <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs font-bold px-2 py-1 rounded-md">
              {copy.enrolledBadge}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {course.title}
          </h3>
          {course.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {course.description}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {course.chaptersCount} {copy.chapters}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {course.totalLessons} {copy.lessons}
            </span>
          </div>

          {/* Progress bar for purchased courses */}
          {course.purchased && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{copy.progress}</span>
                <span className="font-medium text-primary">
                  {course.progress}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Price for unpurchased courses */}
          {!course.purchased && course.price && (
            <div className="mt-3">
              <span className="text-lg font-bold text-primary">
                €{course.price.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
