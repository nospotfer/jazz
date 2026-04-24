'use client';

import { useState } from 'react';
import { Download, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

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
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      const jsPdfModule = await import('jspdf');
      const JsPdf = jsPdfModule.jsPDF ?? jsPdfModule.default;
      const pdf = new JsPdf({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const marginX = 40;
      const marginY = 48;
      const cardX = marginX;
      const cardY = marginY;
      const cardWidth = pageWidth - marginX * 2;
      const cardHeight = pageHeight - marginY * 2 - 46;
      const cardBottom = cardY + cardHeight;
      const centerX = pageWidth / 2;

      const drawCenteredText = (text: string, y: number, options?: { size?: number; color?: [number, number, number]; font?: 'helvetica' | 'times'; style?: 'normal' | 'bold' }) => {
        pdf.setFont(options?.font || 'times', options?.style || 'normal');
        pdf.setFontSize(options?.size || 12);
        const color = options?.color || [255, 255, 255];
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.text(text, centerX, y, { align: 'center' });
      };

      pdf.setFillColor(6, 10, 20);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      pdf.setFillColor(14, 23, 42);
      pdf.setDrawColor(184, 134, 11);
      pdf.setLineWidth(1.1);
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 26, 26, 'FD');

      pdf.setFillColor(22, 33, 62);
      pdf.circle(cardX + 80, cardY + 90, 46, 'F');
      pdf.setFillColor(15, 94, 156);
      pdf.circle(cardX + cardWidth - 70, cardBottom - 70, 72, 'F');
      pdf.setFillColor(20, 20, 28);
      pdf.roundedRect(cardX + 80, cardY + 250, cardWidth - 160, 260, 22, 22, 'F');

      pdf.setFillColor(115, 92, 20);
      pdf.setDrawColor(245, 214, 90);
      pdf.roundedRect(centerX - 68, cardY + 28, 136, 24, 12, 12, 'FD');
      drawCenteredText('JAZZ MASTERY', cardY + 44, { size: 10, color: [255, 244, 214], font: 'helvetica', style: 'bold' });

      pdf.setFillColor(245, 191, 36);
      pdf.setDrawColor(255, 227, 118);
      pdf.circle(centerX, cardY + 120, 34, 'FD');
      pdf.setFillColor(252, 211, 77);
      pdf.circle(centerX, cardY + 120, 24, 'F');
      pdf.setDrawColor(80, 58, 0);
      pdf.setLineWidth(2);
      pdf.circle(centerX, cardY + 120, 8, 'S');
      pdf.line(centerX, cardY + 128, centerX, cardY + 138);
      pdf.line(centerX - 6, cardY + 138, centerX + 6, cardY + 138);

      drawCenteredText(studentName, cardY + 190, { size: 26, color: [255, 255, 255], font: 'times', style: 'bold' });
      drawCenteredText('15 / 15 PLATINUM QUIZZES', cardY + 214, { size: 12, color: [186, 230, 253], font: 'helvetica', style: 'bold' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(13);
      pdf.setTextColor(228, 231, 235);
      let textY = cardY + 292;
      const textWidth = cardWidth - 216;

      for (const line of lines) {
        const wrapped = pdf.splitTextToSize(line, textWidth);
        pdf.text(wrapped, centerX, textY, { align: 'center', baseline: 'top' });
        textY += wrapped.length * 18 + 18;
      }

      if (language === 'pt') {
        drawCenteredText('Reconhecimento supremo em jazz', cardBottom - 28, { size: 10, color: [253, 224, 71], font: 'helvetica', style: 'bold' });
      } else if (language === 'es') {
        drawCenteredText('Reconocimiento supremo de jazz', cardBottom - 28, { size: 10, color: [253, 224, 71], font: 'helvetica', style: 'bold' });
      } else if (language === 'fr') {
        drawCenteredText('Reconnaissance supreme du jazz', cardBottom - 28, { size: 10, color: [253, 224, 71], font: 'helvetica', style: 'bold' });
      } else {
        drawCenteredText('Supreme jazz recognition', cardBottom - 28, { size: 10, color: [253, 224, 71], font: 'helvetica', style: 'bold' });
      }

      await pdf.save(`jazz-specialist-${sanitizeFileName(studentName || 'student')}.pdf`, { returnPromise: true });
    } catch {
      toast.error('No fue posible generar el PDF ahora.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
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