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
};

type MessageRow = {
  id: string;
  threadId: string;
  senderId: string;
  senderEmail: string;
  senderName: string | null;
  senderRole: string;
  body: string;
  createdAt: string;
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

async function notifyByEmail(to: string, subject: string, body: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject,
      text: body,
    });
  } catch {
    // Silent fail
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { threadId: string } }
) {
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
    const threadId = params.threadId.replace(/'/g, "''");

    const threads = await db.$queryRawUnsafe<ThreadRow[]>(`
      SELECT *
      FROM MessageThread
      WHERE id = '${threadId}'
      LIMIT 1
    `);

    const thread = threads[0];
    if (!thread) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const ownsThread =
      thread.studentId === user.id ||
      thread.studentEmail.toLowerCase() === user.email.toLowerCase();

    if (!isProfessor && !ownsThread) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const messages = await db.$queryRawUnsafe<MessageRow[]>(`
      SELECT *
      FROM Message
      WHERE threadId = '${threadId}'
      ORDER BY createdAt ASC
    `);

    await db.$executeRawUnsafe(`
      UPDATE Message
      SET ${isProfessor ? 'unreadByProfessor = 0' : 'unreadByStudent = 0'}
      WHERE threadId = '${threadId}'
    `);

    return NextResponse.json({
      isProfessor,
      thread,
      messages,
      professorEmail,
    });
  } catch (error) {
    console.error('[messages:thread:get]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { threadId: string } }
) {
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
    const threadId = params.threadId.replace(/'/g, "''");

    const threads = await db.$queryRawUnsafe<ThreadRow[]>(`
      SELECT *
      FROM MessageThread
      WHERE id = '${threadId}'
      LIMIT 1
    `);

    const thread = threads[0];
    if (!thread) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const ownsThread =
      thread.studentId === user.id ||
      thread.studentEmail.toLowerCase() === user.email.toLowerCase();

    if (!isProfessor && !ownsThread) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const message = String(body?.message || '').trim();

    if (!message) {
      return new NextResponse('Message is required', { status: 400 });
    }

    const now = new Date().toISOString();
    const messageId = randomUUID();

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
        return NextResponse.json({ ok: true, createdAt: latest.createdAt, duplicateSkipped: true });
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
        '${user.id.replace(/'/g, "''")}',
        '${user.email.replace(/'/g, "''")}',
        '${String(user.user_metadata?.full_name || '').replace(/'/g, "''")}',
        '${isProfessor ? 'professor' : 'student'}',
        '${message.replace(/'/g, "''")}',
        '${now}',
        ${isProfessor ? 1 : 0},
        ${isProfessor ? 0 : 1}
      )
    `);

    await db.$executeRawUnsafe(`
      UPDATE MessageThread
      SET updatedAt = '${now}'
      WHERE id = '${threadId}'
    `);

    const recipient = isProfessor ? thread.studentEmail : professorEmail;
    const senderLabel = isProfessor ? 'Professor Enric Vázquez' : user.email;

    await notifyByEmail(
      recipient,
      `New reply: ${thread.subject}`,
      `From: ${senderLabel}\n\n${message}`
    );

    return NextResponse.json({ ok: true, createdAt: now });
  } catch (error) {
    console.error('[messages:thread:post]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
