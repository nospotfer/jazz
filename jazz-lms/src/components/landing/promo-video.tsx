'use client';

import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MuxPlayer from '@mux/mux-player-react';
import axios from 'axios';

export function PromoVideo() {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const playerRef = useRef<any>(null);
  const [playbackId, setPlaybackId] = useState('');
  const [playbackToken, setPlaybackToken] = useState('');
  const [thumbnailToken, setThumbnailToken] = useState('');
  const [storyboardToken, setStoryboardToken] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterUrl = playbackId
    ? `https://image.mux.com/${playbackId}/thumbnail.webp?time=1${thumbnailToken ? `&token=${encodeURIComponent(thumbnailToken)}` : ''}`
    : '';

  useEffect(() => {
    let cancelled = false;

    const loadPromoPlayback = async () => {
      try {
        const response = await axios.get('/api/mux/promo-playback');
        if (cancelled) return;

        setPlaybackId(response.data.playbackId || '');
        setPlaybackToken(response.data.playbackToken || '');
        setThumbnailToken(response.data.thumbnailToken || '');
        setStoryboardToken(response.data.storyboardToken || '');
      } catch {
        if (cancelled) return;
      }
    };

    loadPromoPlayback();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleMute = () => {
    if (playerRef.current) {
      playerRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      return;
    }

    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-black flex items-center">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[80vh]">
          {/* Left side - Text & CTA */}
          <div className="flex flex-col justify-center space-y-8">
            <div>
              <p className="text-yellow-600 text-sm sm:text-base uppercase tracking-widest mb-4 font-medium">
                Curso Online · Con Enric Vazquez Ramonich
              </p>
              <h1 className="text-gray-900 dark:text-white text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-2">
                La Cultura
              </h1>
              <h1 className="text-gray-900 dark:text-white text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-4">
                del <em className="text-yellow-600">Jazz</em>
              </h1>
            </div>

            <div className="border-l-4 border-yellow-600 pl-6">
              <h2 className="text-yellow-600 text-3xl sm:text-4xl font-bold italic mb-4">
                Enter the World of Jazz
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                Live an experience that will forever change the way you feel music.
                You don&apos;t need to be a musician or an expert to enjoy jazz.
              </p>
            </div>

            <button
              onClick={() => router.push('/auth?tab=register')}
              className="flex items-center gap-3 bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-4 px-10 rounded-lg transition-all duration-300 hover:shadow-xl hover:scale-105 w-fit text-lg"
            >
              <LogIn className="h-5 w-5" />
              Sign Up
            </button>
          </div>

          {/* Right side - Promo Video */}
          <div
            className="relative w-full aspect-[16/10] lg:aspect-auto lg:h-[70vh] rounded-xl overflow-hidden shadow-2xl"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {playbackId && playbackToken ? (
              <MuxPlayer
                ref={playerRef}
                className="absolute inset-0 w-full h-full"
                playbackId={playbackId}
                tokens={{
                  playback: playbackToken || undefined,
                  thumbnail: thumbnailToken || undefined,
                  storyboard: storyboardToken || undefined,
                }}
                poster={posterUrl || undefined}
                autoPlay
                muted
                loop
                playsInline
                accentColor="#d4af37"
              />
            ) : (
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              >
                <source src="/images/videojazz.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />

            {/* Mute/Unmute button */}
            <button
              onClick={toggleMute}
              className={`absolute bottom-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
