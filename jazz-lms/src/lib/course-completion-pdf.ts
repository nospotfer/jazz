import { jsPDF } from 'jspdf';

export interface CourseCompletionPdfContent {
  studentName: string;
  certificateTitle: string;
  certificateSubtitle: string;
  completionLabel: string;
  scoreLabel: string;
  medalLabel: string;
  gratitudeLines: string[];
  teacherName: string;
  signatureImage: Uint8Array;
  logoImage: Uint8Array;
}

export function createCourseCompletionPdf(content: CourseCompletionPdfContent) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
  pdf.setProperties({ title: content.certificateTitle, author: 'La Cultura del Jazz', subject: content.completionLabel });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const center = width / 2;
  const textWidth = width - 112;

  const writeText = (lines: string[], x: number, y: number, size: number, style: 'normal' | 'bold', align: 'left' | 'center', lineHeight: number) => {
    lines.forEach((line, index) => {
      const baseline = y + index * size * lineHeight;
      // Standard PDF fonts cover our Western copy. Preserve other student-name
      // scripts with the browser's native font fallback, without parsing CSS.
      const needsNativeGlyphs = /[^\u0000-\u00ff\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2013-\u201a\u201c-\u201e\u2020-\u2022\u2026\u2030\u2039\u203a\u20ac\u2122]/.test(line);
      if (!needsNativeGlyphs) {
        pdf.text(line, x, baseline, { align });
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(textWidth * 2);
      canvas.height = Math.ceil(size * 1.6 * 2);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Certificate text rendering unavailable');
      context.font = `${style === 'bold' ? 'bold ' : ''}${size * 2}px serif`;
      context.fillStyle = '#3f2f1c';
      context.textAlign = align;
      context.fillText(line, align === 'center' ? canvas.width / 2 : 0, size * 2 * 1.1, canvas.width);
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', align === 'center' ? x - textWidth / 2 : x,
        baseline - size * 1.1, textWidth, size * 1.6);
    });
  };

  pdf.setFillColor(247, 244, 237);
  pdf.rect(0, 0, width, height, 'F');
  pdf.setDrawColor(180, 154, 105);
  pdf.setLineWidth(1.5);
  pdf.rect(27, 27, width - 54, height - 54);
  pdf.setLineWidth(0.6);
  pdf.rect(36, 36, width - 72, height - 72);
  pdf.addImage(content.logoImage, 'PNG', center - 21, 54, 42, 42);

  const centeredText = (text: string, y: number, size: number, style: 'normal' | 'bold' = 'normal') => {
    pdf.setFont('times', style);
    pdf.setFontSize(size);
    while (pdf.getTextWidth(text) > textWidth && size > 9) {
      size -= 1;
      pdf.setFontSize(size);
    }
    const lines = pdf.splitTextToSize(text, textWidth) as string[];
    writeText(lines, center, y, size, style, 'center', 1.2);
    return lines.length * size * 1.2;
  };

  pdf.setTextColor(63, 47, 28);
  centeredText(content.certificateTitle, 128, 27, 'bold');
  centeredText(content.certificateSubtitle, 164, 13);
  const nameHeight = centeredText(content.studentName, 204, 25, 'bold');
  const paragraphY = Math.max(250, 214 + nameHeight);
  const paragraphHeight = 452 - paragraphY;
  let fontSize = 13;
  let paragraphs: string[][] = [];
  do {
    pdf.setFont('times', 'normal');
    pdf.setFontSize(fontSize);
    paragraphs = content.gratitudeLines.map((line) => pdf.splitTextToSize(line, textWidth) as string[]);
    const requiredHeight = paragraphs.reduce((sum, lines) => sum + lines.length * fontSize * 1.35 + 12, 0);
    if (requiredHeight <= paragraphHeight || fontSize <= 9) break;
    fontSize -= 0.5;
  } while (true);
  let textY = paragraphY;
  for (const lines of paragraphs) {
    writeText(lines, 56, textY, fontSize, 'normal', 'left', 1.35);
    textY += lines.length * fontSize * 1.35 + 12;
  }

  pdf.setFillColor(239, 228, 207);
  pdf.roundedRect(48, 475, width - 96, 44, 12, 12, 'F');
  centeredText(content.completionLabel, 500, 12, 'bold');
  centeredText(content.scoreLabel, 543, 12);

  pdf.setDrawColor(180, 154, 105);
  pdf.setFillColor(248, 241, 223);
  pdf.circle(center, 594, 23, 'FD');
  pdf.setFont('times', 'bold');
  pdf.setFontSize(23);
  pdf.text('J', center, 602, { align: 'center' });
  centeredText(content.medalLabel, 637, 12, 'bold');

  pdf.setLineWidth(0.7);
  pdf.line(130, 662, width - 130, 662);
  const image = pdf.getImageProperties(content.signatureImage);
  const signatureWidth = Math.min(190, 65 * image.width / image.height);
  const signatureHeight = signatureWidth * image.height / image.width;
  pdf.addImage(content.signatureImage, 'PNG', center - signatureWidth / 2, 673, signatureWidth, signatureHeight);
  centeredText(content.teacherName, 763, 15, 'bold');
  return pdf;
}
