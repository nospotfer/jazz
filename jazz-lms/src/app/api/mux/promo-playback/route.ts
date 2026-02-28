import { NextResponse } from 'next/server';
import { createMuxPlaybackTokens, PROMO_MUX_PLAYBACK_ID } from '@/lib/mux';

export async function GET() {
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
