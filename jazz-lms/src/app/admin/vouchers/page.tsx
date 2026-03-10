import { requirePermission } from '@/lib/admin';
import { db } from '@/lib/db';
import { VouchersAdminClient } from '@/components/admin/vouchers-admin-client';

export default async function AdminVouchersPage() {
  await requirePermission('vouchers.read');

  const courses = await db.course.findMany({
    select: {
      id: true,
      title: true,
      isPublished: true,
    },
    orderBy: {
      title: 'asc',
    },
  });

  return <VouchersAdminClient courses={courses} />;
}
