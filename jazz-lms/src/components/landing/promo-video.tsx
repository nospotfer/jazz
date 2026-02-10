'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import React from 'react';

export function PromoVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="relative w-full h-96 bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        poster="/images/Logo.jpeg"
        onEnded={() => setIsPlaying(false)}
      >
        <source src="/images/VIDEO_PROMOCIONAL_V1.mp4" type="video/mp4" />
        Tu navegador no soporta el tag de video.
      </video>

      <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-start px-8 sm:px-16 lg:px-32">
        <h1 className="text-white text-5xl sm:text-6xl font-bold mb-4">
          La Cultura del Jazz
        </h1>
        <h2 className="text-yellow-500 text-3xl sm:text-4xl font-semibold mb-6">
          Curso Online
        </h2>
        <p className="text-white text-lg sm:text-xl mb-8">
          Disfruta del jazz entendiendo su lenguaje, su esencia y su cultura.
        </p>
        <button
          onClick={togglePlay}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors text-lg"
        >
          {isPlaying ? 'Pausar Video' : 'Reproducir Video'}
        </button>
      </div>
    </section>
  );
}
