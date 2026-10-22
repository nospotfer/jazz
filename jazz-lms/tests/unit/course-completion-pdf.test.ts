import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { createCourseCompletionPdf } from '@/lib/course-completion-pdf';

describe('course certificate export', () => {
  test.each([
    { title: 'Certificado de Finalización', name: 'María José' },
    { title: 'Certificate of Completion', name: 'Ella Fitzgerald' },
    { title: 'Certificat de Réussite', name: 'Élodie François' },
    { title: 'Certificado de Conclusão', name: 'João Gonçalves' },
  ])('produces a one-page A4 PDF for $title with real public branding assets', ({ title, name }) => {
    const pdf = createCourseCompletionPdf({
      studentName: name, certificateTitle: title, certificateSubtitle: 'La Cultura del Jazz',
      completionLabel: 'Programa completo: 15 de 15 clases', scoreLabel: '100%',
      medalLabel: 'Platino',
      gratitudeLines: ['El estudiante completó las clases y evaluaciones.', 'Reconocimiento de su aprendizaje y dedicación.'],
      teacherName: 'Enric Vázquez Ramonich',
      signatureImage: new Uint8Array(readFileSync('public/images/enric_signature.png')),
      logoImage: new Uint8Array(readFileSync('public/images/logo-mark.png')),
    });
    const output = Buffer.from(pdf.output('arraybuffer'));
    expect(output.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.getNumberOfPages()).toBe(1);
    expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(595.28, 1);
    expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(841.89, 1);
    expect(output.length).toBeGreaterThan(4000);
    expect(pdf.getTextWidth(name)).toBeGreaterThan(0);
  }, 15_000); // Real PNG decoding/compression can exceed 5s on a busy CI worker.
});
