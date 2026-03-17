import { NextResponse } from 'next/server';
import { createMuxPlaybackTokens, PROMO_MUX_PLAYBACK_ID } from '@/lib/mux';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';

export async function GET(request: Request) {
  const limit = checkRateLimit(request, {
    bucket: 'mux-promo-playback',
    maxRequests: 60,
    windowMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfterSeconds: limit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: createRateLimitHeaders(limit, 60_000),
      }
    );
  }

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
