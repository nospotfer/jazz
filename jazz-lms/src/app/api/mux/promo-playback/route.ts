import { NextResponse } from 'next/server';
import { createMuxPlaybackTokens, PROMO_MUX_PLAYBACK_ID } from '@/lib/mux';

export async function GET() {
  const missingMuxConfig =
    !process.env.MUX_SIGNING_KEY_ID || !process.env.MUX_SIGNING_PRIVATE_KEY;

  if (missingMuxConfig) {
    return NextResponse.json(
      {
        playbackId: PROMO_MUX_PLAYBACK_ID,
        playbackToken: '',
        thumbnailToken: '',
        storyboardToken: '',
        tokenMode: 'none',
      },
      {
        headers: {
          'Cache-Control': 'no-store, private, max-age=0',
          Pragma: 'no-cache',
        },
      }
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
    // Keep the landing promo available even if Mux signing key rotation is temporarily inconsistent.
    return NextResponse.json(
      {
        playbackId: PROMO_MUX_PLAYBACK_ID,
        playbackToken: '',
        thumbnailToken: '',
        storyboardToken: '',
        tokenMode: 'none',
      },
      {
        headers: {
          'Cache-Control': 'no-store, private, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );
  }
}
