import { createMuxPlaybackTokens } from '@/lib/mux';

const LESSON_PLAYBACK_IDS = [
  'rZItzE4EBu4mLxAcVsNrTuH00kg4pFcpgrYYY7SkgVVM',
  'R5uBKi01LJHvyG02S8VcrgrTj7D65hPj00vWuonU602WIPM',
  'Xv01wg01NiO7XJ01mNcNOUigP2bbzKg9yPMfioUb01yh501g',
  'n5d01VwkLk1SFrpg5hIX75KuLy4a01huEdb4jxsRMbmOc',
  'jTqTQEHQYVur1n9yV8Qi7umKQQAwQSwZsEFjqO01bwcs',
  'wv8E5ZCIoskvQRecgAmbsNa1bdlC028esSMWBLaLDOIc',
  'hUPj7UP002FEkInqV7KZymac3Xtw7jgOgEas02Hqf802qo',
  'XoExWX224E956vkoYT4aUzas02Nh5LwDN2Vb9RvZk9oo',
  'VzmZBF4beO00XBk8kCKNOMycDKa7qCACyAkrvSlmAZZU',
  '6CZ00siRmC6CS5XCKKb1456WsAgb79r1FM8vq582jt8Q',
  'W3TU7l6QKpVH8669z4dC2Ra01RXdrcpQZo9KvjhFnWTg',
  'zq5RceaZeZwfAEOzV99P0200ZauD73mZVbJClXXCosVS00',
  'zdh5Ck5ECKeEcEXHYMd5O9aewYpYfxu01s3902FmYG02Ko',
  'CfwA3JmMRlPRSJ6KhKRC8F4dk3RudX8ygJCwf5R4Idc',
  'fQNep01k00VSgz01Blo24d7EBm8jB8YpwUa43HiYNxkOXk',
];

async function checkPlaybackId(playbackId: string) {
  const tokens = createMuxPlaybackTokens(playbackId, 300);
  const url = `https://stream.mux.com/${playbackId}.m3u8?token=${tokens.playbackToken}`;

  const response = await fetch(url);
  if (!response.ok) {
    return {
      playbackId,
      status: response.status,
      hasVideoVariant: false,
      details: `HTTP ${response.status}`,
    };
  }

  const content = await response.text();
  const lines = content.split('\n').map((line) => line.trim());
  const streamInfLines = lines.filter((line) => line.startsWith('#EXT-X-STREAM-INF'));
  const hasResolution = streamInfLines.some((line) => /RESOLUTION=\d+x\d+/i.test(line));
  const hasVideoCodec = streamInfLines.some((line) => /CODECS="[^"]*(avc1|hvc1|hev1|vp09|av01)/i.test(line));

  return {
    playbackId,
    status: response.status,
    hasVideoVariant: hasResolution || hasVideoCodec,
    details: streamInfLines.slice(0, 3).join(' | ') || 'No #EXT-X-STREAM-INF found',
  };
}

async function main() {
  for (const playbackId of LESSON_PLAYBACK_IDS) {
    try {
      const result = await checkPlaybackId(playbackId);
      const marker = result.hasVideoVariant ? 'VIDEO_OK' : 'NO_VIDEO_TRACK';
      console.log(`${marker} | ${result.playbackId} | ${result.details}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`ERROR | ${playbackId} | ${message}`);
    }
  }
}

void main();
