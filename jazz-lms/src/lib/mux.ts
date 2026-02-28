import { createSign } from 'crypto';
import { extractMuxPlaybackId, isValidMuxPlaybackId } from '@/lib/mux-playback';

const DEFAULT_TOKEN_TTL_SECONDS = 180;

function toBase64Url(input: string) {
  return Buffer.from(input).toString('base64url');
}

function getMuxPrivateKey() {
  const raw = process.env.MUX_SIGNING_PRIVATE_KEY?.trim();

  if (!raw) {
    throw new Error('MUX_SIGNING_PRIVATE_KEY is missing.');
  }

  if (raw.includes('BEGIN PRIVATE KEY') || raw.includes('BEGIN RSA PRIVATE KEY')) {
    return raw;
  }

  const decoded = Buffer.from(raw, 'base64').toString('utf8');
  if (decoded.includes('BEGIN PRIVATE KEY') || decoded.includes('BEGIN RSA PRIVATE KEY')) {
    return decoded;
  }

  throw new Error('MUX_SIGNING_PRIVATE_KEY is invalid. Use PEM or base64-encoded PEM.');
}

function signMuxJwt(payload: Record<string, unknown>) {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  if (!keyId) {
    throw new Error('MUX_SIGNING_KEY_ID is missing.');
  }

  const privateKey = getMuxPrivateKey();

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: keyId,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();

  const signature = signer.sign(privateKey, 'base64url');
  return `${signingInput}.${signature}`;
}

export function createMuxPlaybackTokens(playbackId: string, ttlSeconds = DEFAULT_TOKEN_TTL_SECONDS) {
  const normalizedPlaybackId = extractMuxPlaybackId(playbackId);
  if (!isValidMuxPlaybackId(normalizedPlaybackId)) {
    throw new Error('Invalid Mux playback ID.');
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const exp = nowInSeconds + ttlSeconds;

  return {
    playbackToken: signMuxJwt({
      aud: 'v',
      sub: normalizedPlaybackId,
      exp,
    }),
    thumbnailToken: signMuxJwt({
      aud: 't',
      sub: normalizedPlaybackId,
      exp,
    }),
    storyboardToken: signMuxJwt({
      aud: 's',
      sub: normalizedPlaybackId,
      exp,
    }),
    expiresAt: exp,
  };
}

export const PROMO_MUX_PLAYBACK_ID = 'TSZoZs4qPde01uwmlonYHcd6rMdpxQLZ3z1UQt7Mmaxg';
