'use client';

import { useRef, useState } from 'react';
import { Download, Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { JazzSupremeMedal } from '@/components/course/lesson-quiz-medal';
import type { SupportedLanguage } from '@/lib/language';

interface JazzSpecialistCertificateProps {
  language: SupportedLanguage;
  studentName: string;
  lines: string[];
  buttonLabel: string;
}

function sanitizeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function JazzSpecialistCertificate({
  language,
  studentName,
  lines,
  buttonLabel,
}: JazzSpecialistCertificateProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
      });

      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imageData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`jazz-specialist-${sanitizeFileName(studentName || 'student')}.pdf`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-[32px] border border-primary/20 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.2),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.18),_transparent_24%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(24,24,27,0.96),rgba(30,41,59,0.98))] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.35)] sm:p-8 lg:p-10"
      >
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="absolute -left-8 top-12 h-28 w-28 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="absolute -right-10 bottom-10 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-yellow-100">
              <Sparkles className="h-3.5 w-3.5" />
              Jazz Mastery
            </div>

            <JazzSupremeMedal language={language} className="mt-6" />

            <h1 className="mt-6 text-3xl font-serif font-bold text-white sm:text-4xl">
              {studentName}
            </h1>
            <p className="mt-2 text-sm uppercase tracking-[0.34em] text-cyan-100/80">
              15/15 Platinum Quizzes
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-3xl rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur-sm sm:p-6">
            <div className="space-y-3 text-pretty text-center text-sm leading-7 text-white/82 sm:text-[15px]">
              {lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="rounded-xl bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-black hover:from-yellow-300 hover:to-amber-300"
        >
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isDownloading ? 'PDF...' : buttonLabel}
        </Button>
      </div>
    </div>
  );
}