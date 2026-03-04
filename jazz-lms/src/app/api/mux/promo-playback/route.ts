import { NextResponse } from 'next/server';
import { createMuxPlaybackTokens, PROMO_MUX_PLAYBACK_ID } from '@/lib/mux';

export async function GET() {
  const missingMuxConfig =
    !process.env.MUX_SIGNING_KEY_ID || !process.env.MUX_SIGNING_PRIVATE_KEY;

  if (missingMuxConfig) {
    return NextResponse.json(
      { error: 'Mux signing is not configured.' },
      { status: 503 }
    );
  }

  try {
    const tokens = createMuxPlaybackTokens(PROMO_MUX_PLAYBACK_ID, 300);

    return NextResponse.json({
      playbackId: PROMO_MUX_PLAYBACK_ID,
      ...tokens,
    }, {
      headers: {
        'Cache-Control': 'no-store, private, max-age=0',
        Pragma: 'no-cache',
      },
    });
  } catch (error) {
    console.error('[MUX_PROMO_PLAYBACK_ROUTE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to load promo playback' }, { status: 500 });
  }
}
