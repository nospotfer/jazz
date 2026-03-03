"use client";

import React, { useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function WhatYouLearn() {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <>
      <div className="min-h-screen w-full bg-gray-50 dark:bg-background flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[80vh]">
            {/* Left side - Text content */}
            <div className="flex flex-col justify-center">
              <h2 className="text-4xl lg:text-5xl font-bold mb-8 text-amber-600">
                Lo que aprenderás
              </h2>

              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Este curso está diseñado para que no solo escuches jazz,{' '}
                <span className="font-bold text-gray-900 dark:text-white">
                  sino que lo vivas y lo sientas
                </span>. Descubrirás su verdadera esencia, su historia y los elementos que lo hacen único y emocional.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-amber-600 mt-2.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-amber-600 mb-1">El jazz como cultura independiente</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      Comprende que el jazz es una cultura musical propia que ha influido profundamente en toda la música popular moderna.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-amber-600 mt-2.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-amber-600 mb-1">Improvisación como creación original</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      Aprende cómo la improvisación se convierte en la autoría del músico de jazz en cada interpretación.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-amber-600 mt-2.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-amber-600 mb-1">El &quot;sonido&quot; personal del músico</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      Descubre cómo identificar a un músico por su sonido único, timbre, color y personalidad artística.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-amber-600 mt-2.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-amber-600 mb-1">Libertad creativa y composición colaborativa</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      Entiende cómo el jazz integra sonoridades diversas y combina composición con improvisación.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/auth?tab=register')}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:shadow-lg w-fit"
              >
                Regístrate
              </button>
            </div>

            {/* Right side - Video */}
            <div
              className="relative w-full aspect-[16/10] lg:aspect-auto lg:h-[70vh] rounded-xl overflow-hidden shadow-2xl bg-black"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              >
                <source src="/images/videojazz.mp4" type="video/mp4" />
                Tu navegador no soporta la etiqueta de video.
              </video>

              <div className="absolute inset-0 bg-black/10 pointer-events-none" />

              <button
                onClick={toggleMute}
                className={`absolute bottom-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
                aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
