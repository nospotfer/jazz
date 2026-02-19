import { db } from '@/lib/db';
import Link from 'next/link';
import { requirePermission } from '@/lib/admin';

export default async function AdminCoursesPage() {
  await requirePermission('courses.read');

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
          <h1 className="text-3xl font-bold text-jazz-dark dark:text-white">Gerenciamento de Cursos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie cursos, capítulos e lições</p>
        </div>
        <Link href="/admin/courses/new" className="btn-primary">
          ➕ Novo Curso
        </Link>
      </div>

      <div className="card">
        {courses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-lg">Nenhum curso criado ainda</p>
            <Link href="/admin/courses/new" className="inline-block mt-4 text-jazz-accent hover:opacity-90 transition">
              Criar primeiro curso →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Estrutura</th>
                  <th className="px-4 py-3">Alunos</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const totalLessons = course.chapters.reduce((acc, chapter) => acc + chapter.lessons.length, 0);
                  const totalPurchases = course.purchases.length;

                  return (
                    <tr key={course.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-jazz-dark dark:text-white">{course.title}</div>
                        <div className="text-xs text-muted-foreground">{course.description || 'Sem descrição'}</div>
                      </td>
                      <td className="px-4 py-3">
                        {course.isPublished ? (
                          <span className="badge-success">Publicado</span>
                        ) : (
                          <span className="badge-warning">Rascunho</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {course.chapters.length} capítulos / {totalLessons} lições
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{totalPurchases}</td>
                      <td className="px-4 py-3 text-sm font-medium text-jazz-dark dark:text-white">
                        {course.price ? `R$ ${course.price.toFixed(2)}` : 'Grátis'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/courses/${course.id}`} className="btn-secondary text-sm px-3 py-1.5">
                            👁️
                          </Link>
                          <Link href={`/admin/courses/${course.id}`} className="btn-secondary text-sm px-3 py-1.5">
                            ✏️
                          </Link>
                          <button type="button" className="btn-danger text-sm px-3 py-1.5">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
