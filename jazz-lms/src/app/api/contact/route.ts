import { NextResponse } from 'next/server';
import { Resend } from 'resend';

type MessageType = 'question' | 'doubt' | 'inquiry' | 'help-request';

interface ContactFormData {
  messageType: MessageType;
  message: string;
  email: string;
}

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'admin@neurofactory.net';

export async function POST(request: Request) {
  try {
    const body: ContactFormData = await request.json();

    // Validate input
    if (!body.messageType || !body.message || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate message length
    if (body.message.length > 1000) {
      return NextResponse.json(
        { error: 'Message exceeds maximum length of 1000 characters' },
        { status: 400 }
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
    const messageTypeLabel = {
      question: 'Pregunta',
      doubt: 'Duda',
      inquiry: 'Consulta',
      'help-request': 'Solicitud de ayuda',
    }[body.messageType] || body.messageType;

    const subject = `[${messageTypeLabel}] Nuevo mensaje de contacto de ${body.email}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Nuevo mensaje de contacto</h2>
        
        <p><strong>Tipo de mensaje:</strong> ${messageTypeLabel}</p>
        <p><strong>Email remitente:</strong> ${body.email}</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <h3>Mensaje:</h3>
        <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">
          ${body.message}
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
      replyTo: body.email,
    });

    if (response.error) {
      console.error('[contact] Email send error:', response.error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    console.info('[contact] Message sent successfully', {
      messageId: response.data?.id,
      from: body.email,
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
    console.error('[contact] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
