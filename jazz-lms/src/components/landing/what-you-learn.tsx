"use client";

import React, { useState, useRef } from 'react';
import { SignupModal } from '@/components/ui/signup-modal';
import { Volume2, VolumeX } from 'lucide-react';

export function WhatYouLearn() {
  const [showSignupModal, setShowSignupModal] = useState(false);
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
                What You&apos;ll Learn
              </h2>

              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                This course is designed so that you not only listen to jazz,{' '}
                <span className="font-bold text-gray-900 dark:text-white">
                  but you live it and feel it
                </span>. You will discover its true essence, its history and the elements that make it unique and emotional.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-amber-600 mt-2.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-amber-600 mb-1">Jazz as independent culture</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      Understand that jazz is its own musical culture that has profoundly influenced all modern popular music.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-amber-600 mt-2.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-amber-600 mb-1">Improvisation as original creation</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      Learn how improvisation becomes the jazz musician&apos;s authorship in each performance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-amber-600 mt-2.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-amber-600 mb-1">The musician&apos;s personal &quot;Sound&quot;</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      Discover how to identify a musician by their unique sound, timbre, color and artistic personality.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-amber-600 mt-2.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-amber-600 mb-1">Creative freedom &amp; collaborative composition</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      Understand how jazz integrates diverse sonorities and combines composition with improvisation.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSignupModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:shadow-lg w-fit"
              >
                Start Now
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
                Your browser does not support the video tag.
              </video>

              <div className="absolute inset-0 bg-black/10 pointer-events-none" />

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

      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />
    </>
  );
}
