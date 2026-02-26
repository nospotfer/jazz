'use client';

import { useEffect, useState, useCallback } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  drift: number;
}

interface UnlockAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

const CONFETTI_COLORS = [
  '#d4af37', // Gold
  '#f0c040', // Bright gold
  '#e8d48b', // Light gold
  '#c9a930', // Dark gold
  '#fff7cc', // Cream gold
  '#b8860b', // Dark goldenrod
  '#ffd700', // Pure gold
  '#daa520', // Goldenrod
];

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 10,
    delay: Math.random() * 0.8,
    duration: 2 + Math.random() * 2,
    drift: -50 + Math.random() * 100,
  }));
}

export function UnlockAnimation({ isVisible, onComplete }: UnlockAnimationProps) {
  const [phase, setPhase] = useState<'key-insert' | 'turning' | 'opening' | 'confetti' | 'done'>('key-insert');
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  const startAnimation = useCallback(() => {
    setPhase('key-insert');
    
    // Phase 1: Key approaches and inserts (0-800ms)
    setTimeout(() => setPhase('turning'), 800);
    
    // Phase 2: Key turns (800-1600ms)
    setTimeout(() => setPhase('opening'), 1600);
    
    // Phase 3: Padlock opens + confetti burst (1600-2400ms)
    setTimeout(() => {
      setPhase('confetti');
      setConfetti(generateConfetti(80));
    }, 2400);
    
    // Phase 4: Animation complete (4500ms)
    setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 5000);
  }, [onComplete]);

  useEffect(() => {
    if (isVisible) {
      startAnimation();
    }
  }, [isVisible, startAnimation]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      {/* Confetti layer */}
      {phase === 'confetti' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confetti.map((piece) => (
            <div
              key={piece.id}
              className="absolute animate-confetti-fall"
              style={{
                left: `${piece.x}%`,
                top: `${piece.y}%`,
                width: `${piece.size}px`,
                height: `${piece.size * 0.6}px`,
                backgroundColor: piece.color,
                borderRadius: '2px',
                transform: `rotate(${piece.rotation}deg)`,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                '--drift': `${piece.drift}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Padlock + Key Animation */}
      <div className="relative flex flex-col items-center">
        {/* Glow effect behind padlock */}
        <div
          className={`absolute w-48 h-48 rounded-full transition-all duration-1000 ${
            phase === 'confetti' || phase === 'done'
              ? 'bg-yellow-400/30 scale-150 blur-3xl'
              : 'bg-yellow-400/10 scale-100 blur-2xl'
          }`}
        />

        {/* Padlock SVG */}
        <div className="relative z-10">
          <svg
            viewBox="0 0 120 150"
            className="w-32 h-40 sm:w-40 sm:h-48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Padlock shackle (U-shape) */}
            <path
              d={
                phase === 'opening' || phase === 'confetti' || phase === 'done'
                  ? 'M35 60 L35 30 Q35 10 60 10 Q85 10 85 30 L85 35'  // Open position - right side drops
                  : 'M35 60 L35 30 Q35 10 60 10 Q85 10 85 30 L85 60'  // Closed position
              }
              stroke="#d4af37"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-700"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.5))',
                transformOrigin: '35px 60px',
                transform: phase === 'opening' || phase === 'confetti' || phase === 'done'
                  ? 'rotate(-15deg)'
                  : 'rotate(0deg)',
              }}
            />
            
            {/* Padlock body */}
            <rect
              x="20"
              y="55"
              width="80"
              height="65"
              rx="10"
              fill="#d4af37"
              className={`transition-all duration-500 ${
                phase === 'confetti' || phase === 'done'
                  ? 'opacity-90'
                  : 'opacity-100'
              }`}
              style={{
                filter: 'drop-shadow(0 4px 12px rgba(212, 175, 55, 0.4))',
              }}
            />
            
            {/* Keyhole */}
            <circle
              cx="60"
              cy="82"
              r="8"
              fill="#1a1a1a"
              className={`transition-opacity duration-300 ${
                phase === 'key-insert' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <rect
              x="57"
              y="85"
              width="6"
              height="12"
              rx="2"
              fill="#1a1a1a"
              className={`transition-opacity duration-300 ${
                phase === 'key-insert' ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Checkmark (appears when open) */}
            {(phase === 'confetti' || phase === 'done') && (
              <path
                d="M42 87 L55 100 L78 75"
                stroke="#1a1a1a"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                className="animate-draw-check"
              />
            )}
          </svg>

          {/* Key */}
          <div
            className={`absolute transition-all ease-out ${
              phase === 'key-insert'
                ? 'bottom-[35%] right-[-60px] rotate-0 opacity-100 duration-700'
                : phase === 'turning'
                ? 'bottom-[35%] right-[-15px] rotate-0 opacity-100 duration-500'
                : phase === 'opening'
                ? 'bottom-[35%] right-[-15px] rotate-90 opacity-100 duration-500'
                : 'bottom-[35%] right-[-15px] rotate-90 opacity-0 duration-300'
            }`}
          >
            <svg
              viewBox="0 0 80 30"
              className="w-16 h-8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Key shaft */}
              <rect x="0" y="12" width="50" height="6" rx="3" fill="#f0c040" />
              {/* Key teeth */}
              <rect x="5" y="18" width="4" height="8" rx="1" fill="#f0c040" />
              <rect x="14" y="18" width="4" height="6" rx="1" fill="#f0c040" />
              <rect x="23" y="18" width="4" height="10" rx="1" fill="#f0c040" />
              {/* Key head (ring) */}
              <circle cx="65" cy="15" r="13" stroke="#f0c040" strokeWidth="4" fill="none" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <p
          className={`mt-8 text-xl sm:text-2xl font-serif font-bold text-yellow-400 transition-all duration-700 ${
            phase === 'confetti' || phase === 'done'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          Unlocked!
        </p>
      </div>
    </div>
  );
}
