'use client';

import { useRef, useState } from 'react';
import { Download, Loader2, ScrollText } from 'lucide-react';
import { toast } from 'sonner';

import { JazzMedalIcon } from '@/components/course/lesson-quiz-medal';
import { Button } from '@/components/ui/button';
import type { QuizMedalTierValue } from '@/lib/lesson-quiz';
import type { SupportedLanguage } from '@/lib/language';

interface CourseCompletionCertificateProps {
  language: SupportedLanguage;
  studentName: string;
  certificateTitle: string;
  completionLabel: string;
  scoreLabel: string;
  medalLabel: string;
  gratitudeLines: string[];
  signatureLabel: string;
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
  completionLabel,
  scoreLabel,
  medalLabel,
  gratitudeLines,
  signatureLabel,
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
        scale: 2,
        backgroundColor: '#efeff1',
        useCORS: true,
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
      await pdf.save(`course-recognition-${sanitizeFileName(studentName || 'student')}.pdf`, { returnPromise: true });
    } catch {
      const errorMessage = language === 'en'
        ? 'Unable to generate the PDF right now.'
        : language === 'fr'
          ? 'Impossible de generer le PDF pour le moment.'
          : language === 'pt'
            ? 'Nao foi possivel gerar o PDF agora.'
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
        className="mx-auto w-full max-w-[760px] border border-black/40 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.78),_rgba(233,233,236,0.92)_40%,_rgba(216,216,220,0.96)_100%)] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.2)] sm:p-10"
      >
        <div className="rounded-sm border border-black/20 bg-white/10 px-6 py-8 sm:px-10 sm:py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/25 bg-black/5 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-black/75">
              <ScrollText className="h-3.5 w-3.5" />
              Jazz LMS
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-[0.08em] text-black/85 sm:text-4xl">
              {certificateTitle}
            </h1>
            <p className="mt-3 text-base font-medium uppercase tracking-[0.12em] text-black/70">
              {studentName}
            </p>
          </div>

          <div className="mt-7 space-y-2 text-left text-base leading-7 text-black/80">
            {gratitudeLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-2 text-center">
            <p className="rounded-full border border-black/25 bg-black/5 px-4 py-1 text-sm font-semibold uppercase tracking-[0.1em] text-black/80">
              {completionLabel}
            </p>
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-black/70">
              {scoreLabel}
            </p>
            <div className="mt-2 inline-flex items-center gap-3">
              <JazzMedalIcon medal={medal} size="lg" />
              <p className={`text-lg font-semibold uppercase tracking-[0.11em] ${medalToneByTier[medal]}`}>
                {medalLabel}
              </p>
            </div>
          </div>

          <div className="mx-auto mt-14 w-full max-w-[400px] text-center">
            <div className="h-px w-full bg-black/70" />
            <p className="pt-2 text-sm uppercase tracking-[0.1em] text-black/75">{signatureLabel}</p>
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
