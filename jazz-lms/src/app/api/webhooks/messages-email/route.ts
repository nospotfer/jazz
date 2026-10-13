import { db } from "@/lib/db";
import { extractNormalizedEmail } from "@/lib/email-validation";
import { ensureMessagingTables } from "@/lib/messages-db";
import { checkRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";
import { randomUUID, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const professorEmail = (
  process.env.PROFESSOR_EMAIL?.trim() || "culturadeljazz@gmail.com"
).toLowerCase();

function normalizeEmail(raw: string) {
  return extractNormalizedEmail(raw);
}

function extractThreadId(input: string) {
  const tokenMatch = input.match(/\[Thread:([0-9a-fA-F-]{36})\]/);
  if (tokenMatch?.[1]) return tokenMatch[1];

  const compactTokenMatch = input.match(/Thread[:\s]*([0-9a-fA-F-]{36})/i);
  if (compactTokenMatch?.[1]) return compactTokenMatch[1];

  const lineMatch = input.match(/Thread\s*ID\s*:\s*([0-9a-fA-F-]{36})/i);
  if (lineMatch?.[1]) return lineMatch[1];

  return null;
}

async function notifyStudentByEmail(to: string, subject: string, body: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    console.warn(
      "[messages:email-webhook:notifyStudent] Missing RESEND_API_KEY or RESEND_FROM_EMAIL",
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject,
      text: body,
    });
  } catch (error) {
    console.error(
      "[messages:email-webhook:notifyStudent] Email delivery failed",
      error,
    );
  }
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hasMatchingSecret(expected: string | undefined, provided: string | null) {
  if (!expected || !provided) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided.trim());
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

// Messages are displayed as plain text. This extracts a readable fallback for
// HTML-only emails; it never renders incoming markup or fetches embedded URLs.
function htmlToText(html: string) {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?\s*>|<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .trim();
}

export async function POST(req: Request) {
  try {
    const signingSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
    const relaySecret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET?.trim();
    const hasSignatureHeaders = ["svix-id", "svix-timestamp", "svix-signature"]
      .some(header => req.headers.has(header));
    let subject: string;
    let textBody: string;
    let messageId: string;

    if (hasSignatureHeaders) {
      // A failed native signature must never fall back to the legacy relay.
      if (!signingSecret) return new NextResponse("Webhook not configured", { status: 503 });
      const id = req.headers.get("svix-id");
      const timestamp = req.headers.get("svix-timestamp");
      const signature = req.headers.get("svix-signature");
      if (!id || !timestamp || !signature) return new NextResponse("Unauthorized", { status: 401 });

      const rawPayload = await req.text();
      if (rawPayload.length > 100_000) return new NextResponse("Payload too large", { status: 413 });
      const resend = new Resend(process.env.RESEND_API_KEY || "re_verification_only");
      let event;
      try {
        event = resend.webhooks.verify({ payload: rawPayload, headers: { id, timestamp, signature }, webhookSecret: signingSecret });
      } catch {
        return new NextResponse("Unauthorized", { status: 401 });
      }

      if (!event || typeof event !== "object" || typeof event.type !== "string") {
        return new NextResponse("Invalid email event", { status: 400 });
      }
      if (event.type !== "email.received") return NextResponse.json({ ok: true, ignored: true });
      const emailId = event.data?.email_id;
      if (typeof emailId !== "string" || !uuidPattern.test(emailId)) {
        return new NextResponse("Invalid email event", { status: 400 });
      }
      if (normalizeEmail(String(event.data?.from || "")) !== professorEmail) {
        return new NextResponse("Ignored sender", { status: 202 });
      }
      if (!process.env.RESEND_API_KEY?.trim()) return new NextResponse("Receiving service unavailable", { status: 503 });

      // Native events contain metadata only. Content and sender authentication
      // come from the authenticated Receiving API, never arbitrary email headers.
      const { data: email, error: receivingError } = await resend.emails.receiving.get(emailId, { html_format: "cid" });
      if (receivingError || !email || email.id !== emailId) {
        return new NextResponse("Receiving service unavailable", { status: 503 });
      }
      const authentication = (email as typeof email & {
        authentication?: { dkim?: string; dmarc?: string };
      }).authentication;
      if (normalizeEmail(email.from) !== professorEmail ||
          authentication?.dkim !== "pass" || authentication?.dmarc !== "pass") {
        return new NextResponse("Ignored unauthenticated sender", { status: 202 });
      }
      subject = email.subject;
      textBody = email.text?.trim() || htmlToText(email.html || "");
      messageId = `resend-email:${emailId}`;
    } else {
      // Compatibility for an explicitly configured trusted relay. That relay
      // must authenticate the original professor before forwarding this body.
      if (!relaySecret) {
        return new NextResponse(signingSecret ? "Unauthorized" : "Webhook not configured", { status: signingSecret ? 401 : 503 });
      }
      if (!hasMatchingSecret(relaySecret, req.headers.get("x-inbox-secret"))) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      const payload = await req.json();
      if (normalizeEmail(String(payload?.from || payload?.sender || "")) !== professorEmail) {
        return new NextResponse("Ignored sender", { status: 202 });
      }
      subject = String(payload?.subject || "");
      textBody = String(payload?.text || payload?.body || payload?.strippedText || "").trim();
      messageId = randomUUID();
    }

    const webhookLimit = checkRateLimit(req, {
      bucket: "webhook-email",
      maxRequests: 30,
      windowMs: 60_000,
    });

    if (!webhookLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many webhook requests",
          retryAfterSeconds: webhookLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: createRateLimitHeaders(webhookLimit, 60_000),
        },
      );
    }

    if (!textBody) {
      return new NextResponse("Message body is required", { status: 400 });
    }
    if (textBody.length > 100_000) return new NextResponse("Message too large", { status: 413 });

    const threadId = extractThreadId(`${subject}\n${textBody}`);
    if (!threadId) {
      return new NextResponse("Thread ID not found in email content", {
        status: 400,
      });
    }

    await ensureMessagingTables();
    const threads = await db.$queryRawUnsafe<
      Array<{
        id: string;
        subject: string;
        studentId: string;
        studentEmail: string;
      }>
    >(`
      SELECT id, subject, studentId AS "studentId", studentEmail AS "studentEmail"
      FROM MessageThread
      WHERE id = $1
      LIMIT 1
    `, threadId);

    const thread = threads[0];
    if (!thread) {
      return new NextResponse("Thread not found", { status: 404 });
    }

    const now = new Date().toISOString();
    const inserted = await db.$transaction(async tx => {
      const count = await tx.$executeRawUnsafe(`
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
        $1,
        $2,
        'professor-email',
        $3,
        'Professor Enric Vázquez',
        'professor',
        $4,
        $5,
        1,
        0
      )
      ON CONFLICT (id) DO NOTHING
    `, messageId, threadId, professorEmail, textBody, now);

      if (count > 0) await tx.$executeRawUnsafe(`
      UPDATE MessageThread
      SET updatedAt = $1
      WHERE id = $2
    `, now, threadId);
      return count;
    });

    if (inserted === 0) return NextResponse.json({ ok: true, duplicateSkipped: true, threadId: thread.id });

    await notifyStudentByEmail(
      thread.studentEmail,
      `El profesor respondió: ${thread.subject}`,
      `El profesor Enric Vázquez respondió a tu mensaje en la bandeja:\n\n${textBody}\n\nAbre tu bandeja de estudiante para continuar la conversación.`,
    );

    return NextResponse.json({
      ok: true,
      threadId: thread.id,
      studentId: thread.studentId,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "MessagingSchemaUnavailableError") {
      return new NextResponse("Messaging temporarily unavailable", { status: 503 });
    }
    if (error instanceof SyntaxError) return new NextResponse("Invalid JSON", { status: 400 });
    console.error("[messages:email-webhook]", error instanceof Error ? error.name : "UnknownError");
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
