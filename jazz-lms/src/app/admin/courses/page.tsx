import { db } from '@/lib/db';
import Link from 'next/link';

export default async function AdminCoursesPage() {
  const courses = await db.course.findMany({
    include: {
      chapters: {
        include: {
          lessons: true,
        },
      },
      purchases: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Gerenciamento de Cursos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie todos os cursos da plataforma</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-6 rounded-lg transition"
        >
          ➕ Novo Curso
        </Link>
      </div>

      {/* Lista de Cursos */}
      <div className="grid gap-4">
        {courses.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhum curso criado ainda</p>
            <Link
              href="/admin/courses/new"
              className="inline-block mt-4 text-yellow-500 hover:text-yellow-400 transition"
            >
              Criar primeiro curso →
            </Link>
          </div>
        ) : (
          courses.map((course) => {
            const totalLessons = course.chapters.reduce(
              (acc, chapter) => acc + chapter.lessons.length,
              0
            );
            const totalPurchases = course.purchases.length;

            return (
              <div
                key={course.id}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:border-yellow-500/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{course.title}</h3>
                      {course.isPublished ? (
                        <span className="bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
                          Publicado
                        </span>
                      ) : (
                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold px-3 py-1 rounded-full">
                          Rascunho
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {course.description || 'Sem descrição'}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <span>📚 {course.chapters.length} capítulos</span>
                      <span>📝 {totalLessons} lições</span>
                      <span>👥 {totalPurchases} alunos</span>
                      <span className="text-yellow-500 font-semibold">
                        {course.price ? `R$ ${course.price.toFixed(2)}` : 'Grátis'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg transition text-sm font-medium"
                    >
                      ✏️ Editar
                    </Link>
                    <Link
                      href={`/courses/${course.id}`}
                      className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg transition text-sm font-medium"
                    >
                      👁️ Ver
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
