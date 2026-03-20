'use client';

interface SpotifyPlaylistFooterProps {
  className?: string;
}

const SPOTIFY_PLAYLIST_EMBED_URL =
  'https://open.spotify.com/embed/playlist/2SL42Fq3AgVvnJb7RixOvp?utm_source=generator&theme=0';

export function SpotifyPlaylistFooter({ className }: SpotifyPlaylistFooterProps) {
  return (
    <div
      className={`border-t border-primary/35 bg-background/95 px-2 pb-2 pt-1 backdrop-blur-sm sm:px-3 lg:px-4 ${
        className ?? ''
      }`.trim()}
    >
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
      />
    </div>
  );
}
