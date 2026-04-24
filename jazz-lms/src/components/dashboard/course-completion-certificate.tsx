'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Download, Loader2, ScrollText } from 'lucide-react';
import { toast } from 'sonner';

import { JazzMedalIcon, JazzSupremeMedal } from '@/components/course/lesson-quiz-medal';
import { Button } from '@/components/ui/button';
import type { QuizMedalTierValue } from '@/lib/lesson-quiz';
import type { SupportedLanguage } from '@/lib/language';

interface CourseCompletionCertificateProps {
  language: SupportedLanguage;
  studentName: string;
  certificateTitle: string;
  certificateSubtitle: string;
  completionLabel: string;
  scoreLabel: string;
  gratitudeLines: string[];
  teacherName: string;
  signatureSrc: string;
  buttonLabel: string;
  medal: QuizMedalTierValue;
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

const medalToneByTier: Record<QuizMedalTierValue, string> = {
  NONE: 'text-slate-600',
  BRONZE: 'text-amber-700',
  SILVER: 'text-slate-700',
  GOLD: 'text-yellow-700',
  PLATINUM: 'text-cyan-800',
};

export function CourseCompletionCertificate({
  language,
  studentName,
  certificateTitle,
  certificateSubtitle,
  completionLabel,
  scoreLabel,
  gratitudeLines,
  teacherName,
  signatureSrc,
  buttonLabel,
  medal,
}: CourseCompletionCertificateProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement | null>(null);

  const handleDownload = async () => {
    if (isDownloading || !certificateRef.current) {
      return;
    }

    setIsDownloading(true);

    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      const jsPdfModule = await import('jspdf');
      const JsPdf = jsPdfModule.jsPDF ?? jsPdfModule.default;

      const canvas = await html2canvas(certificateRef.current, {
        scale: Math.max(2, window.devicePixelRatio || 2),
        backgroundColor: '#f7f4ed',
        useCORS: true,
        allowTaint: false,
      });

      const pdf = new JsPdf({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 18;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      const renderWidth = canvas.width * ratio;
      const renderHeight = canvas.height * ratio;
      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, renderWidth, renderHeight, undefined, 'FAST');
      pdf.save(`course-recognition-${sanitizeFileName(studentName || 'student')}.pdf`);
    } catch {
      const errorMessage = language === 'en'
        ? 'Unable to generate the PDF right now.'
        : language === 'fr'
          ? 'Impossible de generer le PDF pour le moment.'
          : language === 'pt'
            ? 'No fue posible generar el PDF ahora.'
            : 'No fue posible generar el PDF ahora.';
      toast.error(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        ref={certificateRef}
        className="mx-auto aspect-[210/297] w-full max-w-[794px] border border-[#b49a69] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),rgba(246,240,226,0.96)_44%,rgba(236,224,197,0.95)_100%)] p-4 shadow-[0_24px_70px_rgba(30,41,59,0.24)] sm:p-6"
      >
        <div className="flex h-full flex-col rounded-[2px] border-2 border-[#b49a69] bg-[linear-gradient(180deg,rgba(255,255,255,0.7),rgba(250,245,235,0.7))] px-5 py-6 sm:px-10 sm:py-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#7a633a]/40 bg-[#f8f1df] px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6f5630]">
              <ScrollText className="h-3.5 w-3.5" />
              Jazz LMS
            </div>
            <h1 className="mt-6 text-2xl font-semibold uppercase tracking-[0.14em] text-[#3f2f1c] sm:text-4xl">
              {certificateTitle}
            </h1>
            <p className="mt-3 text-sm font-medium tracking-[0.08em] text-[#5e4a2f] sm:text-base">
              {certificateSubtitle}
            </p>
            <p className="mt-6 text-[24px] font-semibold tracking-[0.1em] text-[#2f2416] sm:text-[34px]">
              {studentName}
            </p>
          </div>

          <div className="mt-8 space-y-2 text-left text-[14px] leading-7 text-[#3d3328] sm:text-[16px]">
            {gratitudeLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <p className="rounded-full border border-[#7a633a]/35 bg-[#efe4cf] px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#5f4a2b] sm:text-sm">
              {completionLabel}
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#6f5732] sm:text-sm">
              {scoreLabel}
            </p>
            <div className="mt-2 inline-flex items-center justify-center">
              {medal === 'PLATINUM' ? (
                <div className="relative">
                  <div className="absolute inset-0 scale-125 rounded-full bg-yellow-300/35 blur-xl" />
                  <div className="relative rounded-full border border-yellow-300/55 bg-gradient-to-br from-amber-100 to-yellow-300/70 px-4 py-3 shadow-[0_0_34px_rgba(250,204,21,0.45)]">
                    <JazzSupremeMedal language={language} size="sm" />
                  </div>
                </div>
              ) : (
                <JazzMedalIcon medal={medal} size="lg" className={medalToneByTier[medal]} />
              )}
            </div>
          </div>

          <div className="mx-auto mt-auto w-full max-w-[480px] pt-8 text-center">
            <div className="h-px w-full bg-[#5f4b2f]/80" />
            <div className="flex justify-center pt-4">
              <Image
                src={signatureSrc}
                alt={teacherName}
                className="h-20 w-auto object-contain sm:h-24"
                width={192}
                height={96}
                loading="eager"
              />
            </div>
            <p className="pt-2 text-base font-semibold tracking-[0.06em] text-[#46341f] sm:text-lg">{teacherName}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="min-w-[248px] rounded-md bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-slate-100 hover:from-slate-700 hover:via-slate-600 hover:to-slate-800"
        >
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isDownloading ? 'PDF...' : buttonLabel}
        </Button>
      </div>
    </div>
  );
}
