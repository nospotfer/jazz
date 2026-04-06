import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { ensureMessagingTables } from '@/lib/messages-db';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const professorEmail = (
  process.env.PROFESSOR_EMAIL?.trim() ||
  'culturadeljazz@gmail.com'
).toLowerCase();

function isDatabaseUnavailableError(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientInitializationError
    || error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P1001', 'P1002', 'P1008', 'P1017'].includes(error.code);
  }

  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    message.includes('database')
    || message.includes('connection')
    || message.includes('connect')
    || message.includes('timeout')
    || message.includes('pool')
  );
}

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await ensureMessagingTables();

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
    if (isDatabaseUnavailableError(error)) {
      console.error('[messages:unread-count:db-unavailable]', error);
      return NextResponse.json({ count: 0 }, { status: 503 });
    }

    console.error('[messages:unread-count]', error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
