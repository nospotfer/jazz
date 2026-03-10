import { describe, expect, test } from 'vitest';
import { extractMuxPlaybackId, isValidMuxPlaybackId } from '@/lib/mux-playback';

describe('mux-playback helpers', () => {
  const validId = '1234567890abcdefghij';

  test('validates playback id format', () => {
    expect(isValidMuxPlaybackId(validId)).toBe(true);
    expect(isValidMuxPlaybackId('short')).toBe(false);
  });

  test('extracts id from raw id and mux urls', () => {
    expect(extractMuxPlaybackId(validId)).toBe(validId);
    expect(extractMuxPlaybackId(`https://stream.mux.com/${validId}.m3u8`)).toBe(validId);
    expect(extractMuxPlaybackId(`https://image.mux.com/${validId}/thumbnail.jpg`)).toBe(validId);
  });

  test('extracts id from query string and embedded string', () => {
    expect(extractMuxPlaybackId(`https://example.com/watch?playbackId=${validId}`)).toBe(validId);
    expect(extractMuxPlaybackId(`https://stream.mux.com/invalid.m3u8?playbackId=${validId}`)).toBe(validId);
    expect(extractMuxPlaybackId(`https://stream.mux.com/?playbackId=${validId}`)).toBe(validId);
    expect(extractMuxPlaybackId(`prefix-${validId}-suffix`)).toBe(validId);
  });

  test('returns empty for invalid/empty values', () => {
    expect(extractMuxPlaybackId('')).toBe('');
    expect(extractMuxPlaybackId(undefined)).toBe('');
    expect(extractMuxPlaybackId('https://example.com/video/no-valid-id')).toBe('');
  });
});
