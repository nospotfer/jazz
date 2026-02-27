import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { ensureMessagingTables } from '@/lib/messages-db';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';

type ThreadRow = {
  id: string;
  studentId: string;
  studentEmail: string;
  studentName: string | null;
  subject: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

type ExistingThreadRow = {
  id: string;
  subject: string;
};

type LastMessageRow = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

const professorEmail = (
  process.env.PROFESSOR_EMAIL?.trim() ||
  'enric.vazquez@upc.edu'
).toLowerCase();

async function notifyProfessor(params: {
  subject: string;
  body: string;
  fromEmail: string;
  threadId: string;
  studentId: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: professorEmail,
      subject: `${params.subject} [Thread:${params.threadId}]`,
      text: `From: ${params.fromEmail}\nStudent ID: ${params.studentId}\nThread ID: ${params.threadId}\n\n${params.body}\n\nIMPORTANT: Keep [Thread:${params.threadId}] in the subject when replying so the message is attached to the correct conversation.`,
    });
  } catch {
    // Silent fail: in-app messaging keeps working
  }
}

function normalizeSubjectText(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function subjectSimilarityScore(a: string, b: string) {
  const aTokens = new Set(normalizeSubjectText(a).split(' ').filter((token) => token.length > 2));
  const bTokens = new Set(normalizeSubjectText(b).split(' ').filter((token) => token.length > 2));

  if (aTokens.size === 0 || bTokens.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1;
  }

  const union = aTokens.size + bTokens.size - intersection;
  return union > 0 ? intersection / union : 0;
}

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

    if (!isProfessor) {
      const safeUserId = user.id.replace(/'/g, "''");
      const safeUserEmail = user.email.replace(/'/g, "''");
      await db.$executeRawUnsafe(`
        UPDATE MessageThread
        SET studentId = '${safeUserId}'
        WHERE LOWER(studentEmail) = LOWER('${safeUserEmail}')
          AND studentId <> '${safeUserId}'
      `);
    }

    const rows = isProfessor
      ? await db.$queryRawUnsafe<ThreadRow[]>(`
          SELECT
            t.id,
            t.studentId,
            t.studentEmail,
            t.studentName,
            t.subject,
            t.createdAt,
            t.updatedAt,
            (
              SELECT m.body
              FROM Message m
              WHERE m.threadId = t.id
              ORDER BY m.createdAt DESC
              LIMIT 1
            ) AS lastMessage,
            (
              SELECT m.createdAt
              FROM Message m
              WHERE m.threadId = t.id
              ORDER BY m.createdAt DESC
              LIMIT 1
            ) AS lastMessageAt,
            (
              SELECT COUNT(*)
              FROM Message m
              WHERE m.threadId = t.id
                AND m.unreadByProfessor = 1
            ) AS unreadCount
          FROM MessageThread t
          ORDER BY t.updatedAt DESC
        `)
      : await db.$queryRawUnsafe<ThreadRow[]>(`
          SELECT
            t.id,
            t.studentId,
            t.studentEmail,
            t.studentName,
            t.subject,
            t.createdAt,
            t.updatedAt,
            (
              SELECT m.body
              FROM Message m
              WHERE m.threadId = t.id
              ORDER BY m.createdAt DESC
              LIMIT 1
            ) AS lastMessage,
            (
              SELECT m.createdAt
              FROM Message m
              WHERE m.threadId = t.id
              ORDER BY m.createdAt DESC
              LIMIT 1
            ) AS lastMessageAt,
            (
              SELECT COUNT(*)
              FROM Message m
              WHERE m.threadId = t.id
                AND m.unreadByStudent = 1
            ) AS unreadCount
          FROM MessageThread t
           WHERE t.studentId = '${user.id.replace(/'/g, "''")}'
             OR LOWER(t.studentEmail) = LOWER('${user.email.replace(/'/g, "''")}')
          ORDER BY t.updatedAt DESC
        `);

    return NextResponse.json({
      isProfessor,
      professorEmail,
      threads: rows,
    });
  } catch (error) {
    console.error('[messages:get]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureMessagingTables();

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (user.email.toLowerCase() === professorEmail) {
      return new NextResponse('Professor cannot create student thread from this endpoint', {
        status: 403,
      });
    }

    const body = await req.json();
    const subject = String(body?.subject || '').trim();
    const message = String(body?.message || '').trim();

    if (!message) {
      return new NextResponse('Message is required', { status: 400 });
    }

    const normalizedSubject = subject || 'General message';

    const now = new Date().toISOString();
    const messageId = randomUUID();
    const safeSubject = normalizedSubject.replace(/'/g, "''");
    const safeMessage = message.replace(/'/g, "''");
    const safeStudentEmail = user.email.replace(/'/g, "''");
    const safeStudentName = String(user.user_metadata?.full_name || '').replace(/'/g, "''");
    const safeStudentId = user.id.replace(/'/g, "''");

    await db.$executeRawUnsafe(`
      UPDATE MessageThread
      SET studentId = '${safeStudentId}'
      WHERE LOWER(studentEmail) = LOWER('${safeStudentEmail}')
        AND studentId <> '${safeStudentId}'
    `);

    const existingThreads = await db.$queryRawUnsafe<ExistingThreadRow[]>(`
      SELECT id, subject
      FROM MessageThread
      WHERE studentId = '${safeStudentId}'
         OR LOWER(studentEmail) = LOWER('${safeStudentEmail}')
      ORDER BY updatedAt DESC
    `);

    const normalizedTargetSubject = normalizeSubjectText(normalizedSubject);

    const matchedThread = existingThreads.find((thread) => {
      const normalizedExisting = normalizeSubjectText(thread.subject);
      if (normalizedExisting === normalizedTargetSubject) return true;
      return subjectSimilarityScore(normalizedExisting, normalizedTargetSubject) >= 0.75;
    });

    const threadId = matchedThread?.id || randomUUID();

    if (!matchedThread) {
      await db.$executeRawUnsafe(`
        INSERT INTO MessageThread (id, studentId, studentEmail, studentName, subject, createdAt, updatedAt)
        VALUES (
          '${threadId}',
          '${safeStudentId}',
          '${safeStudentEmail}',
          '${safeStudentName}',
          '${safeSubject}',
          '${now}',
          '${now}'
        )
      `);
    }

    await db.$executeRawUnsafe(`
      UPDATE MessageThread
      SET updatedAt = '${now}'
      WHERE id = '${threadId}'
    `);

    const recentMessages = await db.$queryRawUnsafe<LastMessageRow[]>(`
      SELECT id, senderId, body, createdAt
      FROM Message
      WHERE threadId = '${threadId}'
      ORDER BY createdAt DESC
      LIMIT 1
    `);

    const latest = recentMessages[0];
    if (latest) {
      const sameSender = latest.senderId === user.id;
      const sameBody = latest.body.trim() === message;
      const latestTimestamp = new Date(latest.createdAt).getTime();
      const nowTimestamp = new Date(now).getTime();
      const sentTooSoon = Number.isFinite(latestTimestamp) && nowTimestamp - latestTimestamp < 15000;

      if (sameSender && sameBody && sentTooSoon) {
        return NextResponse.json({
          id: threadId,
          createdAt: latest.createdAt,
          createdNewThread: !matchedThread,
          duplicateSkipped: true,
        });
      }
    }

    await db.$executeRawUnsafe(`
      INSERT INTO Message (
        id,
        threadId,
        senderId,
        senderEmail,
        senderName,
        senderRole,
        body,
        createdAt,
        unreadByStudent,
        unreadByProfessor
      )
      VALUES (
        '${messageId}',
        '${threadId}',
        '${safeStudentId}',
        '${safeStudentEmail}',
        '${safeStudentName}',
        'student',
        '${safeMessage}',
        '${now}',
        0,
        1
      )
    `);

    await notifyProfessor({
      subject: `New student message: ${normalizedSubject}`,
      body: message,
      fromEmail: user.email,
      threadId,
      studentId: safeStudentId,
    });

    return NextResponse.json({ id: threadId, createdAt: now, createdNewThread: !matchedThread });
  } catch (error) {
    console.error('[messages:create]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
