import { afterEach, describe, expect, test, vi } from 'vitest';

describe('GET /api/mux/promo-playback route', () => {
  const originalEnv = {
    keyId: process.env.MUX_SIGNING_KEY_ID,
    privateKey: process.env.MUX_SIGNING_PRIVATE_KEY,
  };

  afterEach(() => {
    process.env.MUX_SIGNING_KEY_ID = originalEnv.keyId;
    process.env.MUX_SIGNING_PRIVATE_KEY = originalEnv.privateKey;
    vi.resetModules();
    vi.clearAllMocks();
    vi.unmock('@/lib/mux');
  });

  test('returns unsigned fallback payload when mux env is missing', async () => {
    process.env.MUX_SIGNING_KEY_ID = '';
    process.env.MUX_SIGNING_PRIVATE_KEY = '';

    const { GET } = await import('@/app/api/mux/promo-playback/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tokenMode).toBe('none');
    expect(data.playbackToken).toBe('');
  });

  test('returns tokens when mux config exists', async () => {
    process.env.MUX_SIGNING_KEY_ID = 'key';
    process.env.MUX_SIGNING_PRIVATE_KEY = 'private';

    vi.doMock('@/lib/mux', () => ({
      PROMO_MUX_PLAYBACK_ID: 'promo1234567890abcdef',
      hasMuxSigningConfig: vi.fn(() => true),
      createMuxPlaybackTokens: vi.fn(() => ({
        playbackToken: 'playback-token',
        thumbnailToken: 'thumbnail-token',
        storyboardToken: 'storyboard-token',
      })),
    }));

    const { GET } = await import('@/app/api/mux/promo-playback/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.playbackId).toBe('promo1234567890abcdef');
    expect(data.playbackToken).toBe('playback-token');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  test('returns unsigned fallback payload when token generation throws', async () => {
    process.env.MUX_SIGNING_KEY_ID = 'key';
    process.env.MUX_SIGNING_PRIVATE_KEY = 'private';

    vi.doMock('@/lib/mux', () => ({
      PROMO_MUX_PLAYBACK_ID: 'promo1234567890abcdef',
      hasMuxSigningConfig: vi.fn(() => true),
      createMuxPlaybackTokens: vi.fn(() => {
        throw new Error('boom');
      }),
    }));

    const { GET } = await import('@/app/api/mux/promo-playback/route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tokenMode).toBe('none');
    expect(data.playbackToken).toBe('');
  });
});
