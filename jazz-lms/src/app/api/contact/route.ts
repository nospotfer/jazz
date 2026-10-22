import { safeErrorDiagnostic } from '@/lib/error-diagnostics';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const MESSAGE_LABELS = {
  question: 'Pregunta',
  doubt: 'Duda',
  inquiry: 'Consulta',
  'help-request': 'Solicitud de ayuda',
} as const;

// Bound raw input before JSON parsing, including bodies sent without Content-Length.
async function readContactBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError('Missing body');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 8192) {
        await reader.cancel().catch(() => undefined);
        throw new RangeError('Body too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function validContactEmail(email: string): boolean {
  // Validate bounded components separately: no ambiguous repeated regex groups.
  if (email.length > 254 || /[\s<>"']/u.test(email)) return false;
  const at = email.indexOf('@');
  if (at < 1 || at > 64 || at !== email.lastIndexOf('@')) return false;
  const labels = email.slice(at + 1).split('.');
  return labels.length > 1 && labels.every((label) =>
    label.length > 0 && label.length <= 63 &&
    /^[a-zA-Z0-9-]+$/.test(label) && !label.startsWith('-') && !label.endsWith('-')
  );
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'admin@neurofactory.net';

export async function POST(request: Request) {
  try {
    let input: unknown;
    try {
      input = await readContactBody(request);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof RangeError ? 'Request body too large' : 'Invalid JSON' },
        { status: error instanceof RangeError ? 413 : 400 },
      );
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return NextResponse.json({ error: 'Invalid contact form' }, { status: 400 });
    }
    const body = input as Record<string, unknown>;
    if (typeof body.messageType !== 'string' || !Object.hasOwn(MESSAGE_LABELS, body.messageType) ||
        typeof body.message !== 'string' || !body.message.trim() ||
        typeof body.email !== 'string' || !body.email.trim()) {
      return NextResponse.json({ error: 'Invalid contact form' }, { status: 400 });
    }
    const email = body.email.trim();
    if (!validContactEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    if (body.message.length > 1000) {
      return NextResponse.json(
        { error: 'Message exceeds maximum length of 1000 characters' },
        { status: 400 },
      );
    }

    // Get Resend API key
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('[contact] RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Get sender email
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!fromEmail) {
      console.error('[contact] RESEND_FROM_EMAIL not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    // Create email content
    const messageTypeLabel = MESSAGE_LABELS[body.messageType as keyof typeof MESSAGE_LABELS];
    const subject = `[${messageTypeLabel}] Nuevo mensaje de contacto de ${email}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Nuevo mensaje de contacto</h2>
        
        <p><strong>Tipo de mensaje:</strong> ${messageTypeLabel}</p>
        <p><strong>Email remitente:</strong> ${escapeHtml(email)}</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <h3>Mensaje:</h3>
        <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">
          ${escapeHtml(body.message)}
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #666;">
          <em>Este email fue enviado desde el formulario de contacto de La Cultura del Jazz</em>
        </p>
      </div>
    `;

    // Send email to support
    const response = await resend.emails.send({
      from: fromEmail,
      to: SUPPORT_EMAIL,
      subject,
      html: htmlContent,
      replyTo: email,
    });

    if (response.error) {
      console.error('[contact] Email delivery failed');
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    console.info('[contact] Message sent successfully', {
      messageId: response.data?.id,
      type: body.messageType,
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email enviado exitosamente',
        messageId: response.data?.id 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[contact] Unexpected delivery failure', safeErrorDiagnostic(error));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
