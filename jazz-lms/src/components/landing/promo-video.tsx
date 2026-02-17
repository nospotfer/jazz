'use client';

import { useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { SignupModal } from '@/components/ui/signup-modal';

export function PromoVideo() {
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="w-full bg-gray-100 dark:bg-black py-8 px-6 sm:px-12 lg:px-24">
      <div
        className="relative w-full max-w-6xl mx-auto h-[70vh] rounded-lg overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Video */}
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

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Logo top-left */}
      <div className="absolute top-6 left-6 z-10">
        <Image
          src="/images/Logo.jpeg"
          alt="Cultura del Jazz"
          width={80}
          height={80}
          className="rounded"
        />
      </div>

      {/* Content box - right side */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-3/5 lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 bg-black/30">
        <p className="text-gray-200 text-sm sm:text-base uppercase tracking-widest mb-8">
          Enjoy jazz by understanding its language, its essence and its culture.
        </p>

        <h1 className="text-white text-5xl sm:text-6xl lg:text-7xl font-bold mb-2 leading-tight">
          La Cultura
        </h1>
        <h1 className="text-white text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
          del <em>Jazz</em>
        </h1>

        <h2 className="text-yellow-600 text-3xl sm:text-4xl lg:text-5xl font-light italic mb-12">
          Curso Online
        </h2>

        <div className="flex items-center justify-between">
          <p className="text-white text-sm sm:text-base uppercase tracking-[0.3em]">
            Con Enric Vazquez Ramonich
          </p>
          <div className="text-yellow-500 text-3xl animate-bounce">
            ↓
          </div>
        </div>
      </div>

      {/* Mute/Unmute button - bottom right, visible on hover */}
      <button
        onClick={toggleMute}
        className={`absolute bottom-6 right-6 z-20 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
      </div>

      {/* CTA section below video */}
      <div className="max-w-6xl mx-auto text-center py-16 sm:py-24 px-6">
        <h2 className="text-yellow-600 text-4xl sm:text-5xl lg:text-6xl font-bold italic mb-6">
          Enter the World of Jazz
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg mb-4">
          Live an experience that will forever change the way you feel music.
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-10 max-w-2xl mx-auto">
          You don&apos;t need to be a musician or an expert to enjoy jazz. With this course you&apos;ll learn to
          understand its language, recognize its styles and live it with more intensity in every listen.
        </p>
        <button
          onClick={() => setShowSignupModal(true)}
          className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-4 px-16 text-lg transition-colors"
        >
          Sign Up Now
        </button>
      </div>

      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />
    </section>
  );
}
