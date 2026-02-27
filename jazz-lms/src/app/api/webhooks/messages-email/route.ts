import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureMessagingTables } from '@/lib/messages-db';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';

const professorEmail = (
  process.env.PROFESSOR_EMAIL?.trim() ||
  'enric.vazquez@upc.edu'
).toLowerCase();

function normalizeEmail(raw: string) {
  const match = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return (match?.[0] || raw).trim().toLowerCase();
}

function extractThreadId(input: string) {
  const tokenMatch = input.match(/\[Thread:([0-9a-fA-F-]{36})\]/);
  if (tokenMatch?.[1]) return tokenMatch[1];

  const lineMatch = input.match(/Thread\s*ID\s*:\s*([0-9a-fA-F-]{36})/i);
  if (lineMatch?.[1]) return lineMatch[1];

  return null;
}

async function notifyStudentByEmail(to: string, subject: string, body: string) {
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

export async function POST(req: Request) {
  try {
    await ensureMessagingTables();

    const configuredSecret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET?.trim();
    if (configuredSecret) {
      const providedSecret = req.headers.get('x-inbox-secret')?.trim();
      if (!providedSecret || providedSecret !== configuredSecret) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const payload = await req.json();
    const fromRaw = String(payload?.from || payload?.sender || '');
    const fromEmail = normalizeEmail(fromRaw);
    if (fromEmail !== professorEmail) {
      return new NextResponse('Ignored sender', { status: 202 });
    }

    const subject = String(payload?.subject || '');
    const textBody = String(payload?.text || payload?.body || payload?.strippedText || '').trim();
    if (!textBody) {
      return new NextResponse('Message body is required', { status: 400 });
    }

    const threadId = extractThreadId(`${subject}\n${textBody}`);
    if (!threadId) {
      return new NextResponse('Thread ID not found in email content', { status: 400 });
    }

    const safeThreadId = threadId.replace(/'/g, "''");
    const threads = await db.$queryRawUnsafe<Array<{
      id: string;
      subject: string;
      studentId: string;
      studentEmail: string;
    }>>(`
      SELECT id, subject, studentId, studentEmail
      FROM MessageThread
      WHERE id = '${safeThreadId}'
      LIMIT 1
    `);

    const thread = threads[0];
    if (!thread) {
      return new NextResponse('Thread not found', { status: 404 });
    }

    const now = new Date().toISOString();
    const messageId = randomUUID();

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
        '${safeThreadId}',
        'professor-email',
        '${professorEmail.replace(/'/g, "''")}',
        'Professor Enric Vázquez',
        'professor',
        '${textBody.replace(/'/g, "''")}',
        '${now}',
        1,
        0
      )
    `);

    await db.$executeRawUnsafe(`
      UPDATE MessageThread
      SET updatedAt = '${now}'
      WHERE id = '${safeThreadId}'
    `);

    await notifyStudentByEmail(
      thread.studentEmail,
      `Professor replied: ${thread.subject}`,
      `Professor Enric Vázquez replied to your inbox message:\n\n${textBody}\n\nOpen your student inbox to continue the conversation.`
    );

    return NextResponse.json({ ok: true, threadId: thread.id, studentId: thread.studentId });
  } catch (error) {
    console.error('[messages:email-webhook]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
