import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { ensureMessagingTables } from '@/lib/messages-db';

const professorEmail = (
  process.env.PROFESSOR_EMAIL?.trim() ||
  'enric.vazquez@upc.edu'
).toLowerCase();

export async function GET() {
  try {
    await ensureMessagingTables();

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const isProfessor = user.email.toLowerCase() === professorEmail;

    const rows = isProfessor
      ? await db.$queryRawUnsafe<Array<{ count: number }>>(`
          SELECT COUNT(*) as count
          FROM Message
          WHERE unreadByProfessor = 1
        `)
      : await db.$queryRawUnsafe<Array<{ count: number }>>(`
          SELECT COUNT(*) as count
          FROM Message m
          JOIN MessageThread t ON t.id = m.threadId
          WHERE (
              t.studentId = '${user.id.replace(/'/g, "''")}'
              OR LOWER(t.studentEmail) = LOWER('${user.email.replace(/'/g, "''")}')
            )
            AND m.unreadByStudent = 1
        `);

    return NextResponse.json({ count: Number(rows[0]?.count || 0) });
  } catch (error) {
    console.error('[messages:unread-count]', error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
