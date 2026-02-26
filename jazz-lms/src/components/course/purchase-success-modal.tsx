'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface PurchaseSuccessModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function PurchaseSuccessModal({ isVisible, onClose }: PurchaseSuccessModalProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Slight delay for entrance animation
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-500 ${
          showContent
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 p-2 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Gold accent top bar */}
        <div className="h-1.5 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500" />

        <div className="p-8 sm:p-10 text-center">
          {/* Animated checkmark */}
          <div className="mx-auto w-20 h-20 mb-6 relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse-slow" />
            <div className="absolute inset-2 bg-green-500/10 rounded-full" />
            <svg
              viewBox="0 0 80 80"
              className="w-20 h-20 relative z-10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Circle */}
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="#22c55e"
                strokeWidth="4"
                fill="#22c55e"
                className={`transition-all duration-700 ${
                  showContent ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {/* Checkmark */}
              <path
                d="M24 40 L35 52 L56 28"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                className={`${showContent ? 'animate-draw-check' : ''}`}
                style={{
                  strokeDasharray: 60,
                  strokeDashoffset: showContent ? 0 : 60,
                }}
              />
            </svg>
          </div>

          {/* Message */}
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white mb-3">
            Thank you for being part of this musical
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            Now you have access to all the site&apos;s content
          </p>

          {/* Divider with music note */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-yellow-400/40" />
            <span className="text-2xl">🎵</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-yellow-400/40" />
          </div>

          {/* CTA Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40"
          >
            Start Learning
          </button>
        </div>
      </div>
    </div>
  );
}
