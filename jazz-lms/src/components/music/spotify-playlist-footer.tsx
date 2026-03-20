'use client';

import { useState } from 'react';

interface SpotifyPlaylistFooterProps {
  className?: string;
}

const SPOTIFY_PLAYLIST_EMBED_URL =
  'https://open.spotify.com/embed/playlist/2SL42Fq3AgVvnJb7RixOvp?utm_source=generator&theme=0';
const SPOTIFY_PLAYLIST_WEB_URL = 'https://open.spotify.com/playlist/2SL42Fq3AgVvnJb7RixOvp';

export function SpotifyPlaylistFooter({ className }: SpotifyPlaylistFooterProps) {
  const [embedFailed, setEmbedFailed] = useState(false);

  return (
    <div
      className={`border-t border-primary/35 bg-background/95 px-2 pb-2 pt-1 backdrop-blur-sm sm:px-3 lg:px-4 ${
        className ?? ''
      }`.trim()}
    >
      {embedFailed ? (
        <div className="flex h-[152px] items-center justify-center rounded-[12px] border border-primary/30 bg-card/70 px-4 text-center">
          <a
            href={SPOTIFY_PLAYLIST_WEB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-background/95 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Open in Spotify
          </a>
        </div>
      ) : (
        <iframe
          data-testid="lesson-spotify-footer"
          title="Course Spotify playlist"
          src={SPOTIFY_PLAYLIST_EMBED_URL}
          width="100%"
          height="152"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="block w-full rounded-[12px]"
          onError={() => setEmbedFailed(true)}
        />
      )}
    </div>
  );
}
