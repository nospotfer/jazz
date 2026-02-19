'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

const BOARD_IDS = [
  'board-hero',
  'board-professor',
  'board-learn',
  'board-courses',
  'board-press',
  'board-jazzcats',
  'board-faq',
];

export function BoardNavigation() {
  const [currentBoard, setCurrentBoard] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight / 2;
      for (let i = BOARD_IDS.length - 1; i >= 0; i--) {
        const el = document.getElementById(BOARD_IDS[i]);
        if (el && el.offsetTop <= scrollY) {
          setCurrentBoard(i);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLastBoard = currentBoard >= BOARD_IDS.length - 1;
  const isFirstBoard = currentBoard <= 0;

  const scrollToBoard = (direction: 'next' | 'prev') => {
    const targetIndex = direction === 'next'
      ? Math.min(currentBoard + 1, BOARD_IDS.length - 1)
      : Math.max(currentBoard - 1, 0);
    const el = document.getElementById(BOARD_IDS[targetIndex]);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2">
      {!isFirstBoard && (
        <button
          onClick={() => scrollToBoard('prev')}
          className="group bg-yellow-600/90 hover:bg-yellow-500 text-black p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110"
          aria-label="Previous board"
        >
          <ChevronUp className="h-6 w-6 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}
      {!isLastBoard && (
        <button
          onClick={() => scrollToBoard('next')}
          className="group bg-yellow-600/90 hover:bg-yellow-500 text-black p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 animate-bounce"
          aria-label="Next board"
        >
          <ChevronDown className="h-6 w-6 group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}
