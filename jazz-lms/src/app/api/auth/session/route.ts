import { resolveServerAppOrigin } from '@/lib/app-origin';
import { createClient } from '@/utils/supabase/server';
import { safeErrorDiagnostic } from '@/lib/error-diagnostics';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const expectedOrigin = resolveServerAppOrigin(
      new URL(req.url).origin,
      req.headers.get('host'),
    );
    if (req.headers.get('origin') !== expectedOrigin) {
      return new NextResponse('Origen no permitido', { status: 403 });
    }

    const mediaType = req.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
    if (mediaType !== 'application/json') {
      return new NextResponse('Tipo de contenido no permitido', { status: 415 });
    }

    const body = await req.json().catch(() => null);
    const accessToken =
      typeof body?.accessToken === 'string' ? body.accessToken.trim() : '';
    const refreshToken =
      typeof body?.refreshToken === 'string' ? body.refreshToken.trim() : '';

    if (!accessToken || !refreshToken) {
      return new NextResponse('Solicitud inválida', { status: 400 });
    }

    const supabase = createClient();
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[AUTH_SESSION_SYNC_ERROR]', safeErrorDiagnostic(error));
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}
