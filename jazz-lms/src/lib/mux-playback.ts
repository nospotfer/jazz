const MUX_PLAYBACK_ID_REGEX = /^[a-zA-Z0-9]{20,80}$/;

export function isValidMuxPlaybackId(value: string) {
  return MUX_PLAYBACK_ID_REGEX.test(value.trim());
}

export function extractMuxPlaybackId(value?: string | null) {
  const raw = (value ?? '').trim();
  if (!raw) return '';

  if (isValidMuxPlaybackId(raw)) {
    return raw;
  }

  try {
    const url = new URL(raw);
    const muxHost = /(^|\.)mux\.com$/i.test(url.hostname);

    if (muxHost) {
      const firstSegment = url.pathname.split('/').filter(Boolean).at(0) ?? '';
      const withoutExtension = firstSegment.replace(/\.[a-z0-9]+$/i, '');
      if (isValidMuxPlaybackId(withoutExtension)) {
        return withoutExtension;
      }
    }

    const queryCandidate = url.searchParams.get('playbackId')?.trim() ?? '';
    if (isValidMuxPlaybackId(queryCandidate)) {
      return queryCandidate;
    }
  } catch {
    // Non-URL values are handled below.
  }

  const embedded = raw.match(/[a-zA-Z0-9]{20,80}/)?.[0] ?? '';
  return isValidMuxPlaybackId(embedded) ? embedded : '';
}
