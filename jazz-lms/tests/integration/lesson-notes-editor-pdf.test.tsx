// @vitest-environment jsdom

import { LessonNotesEditor } from '@/components/dashboard/lesson-notes-editor';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  language: 'pt',
  axiosGet: vi.fn(),
}));

vi.mock('axios', () => ({
  __esModule: true,
  default: {
    get: mocks.axiosGet,
  },
}));

vi.mock('@/components/providers/language-provider', () => ({
  useLanguage: () => ({
    language: mocks.language,
    setLanguage: vi.fn(),
  }),
}));

vi.mock('@/components/course/pdf-workspace-viewer', () => ({
  PdfWorkspaceViewer: ({ fileUrl }: { fileUrl: string }) => (
    <div data-testid="pdf-viewer" data-url={fileUrl}>
      {fileUrl}
    </div>
  ),
}));

const baseProps = {
  courseId: 'course-1',
  lessonId: 'lesson-1',
  classLabel: 'Clase 1',
  lessonTitle: 'Introducao',
  pdfAttachments: [
    {
      id: 'att-1',
      lessonId: 'lesson-1',
      name: 'Apunte 1.pdf',
      url: 'https://legacy.example.com/apunte-1.pdf',
    },
  ],
};

describe('LessonNotesEditor PDF preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.language = 'pt';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ note: null }),
      }),
    );
  });

  test('uses inline proxy URL when attachment endpoint succeeds', async () => {
    mocks.axiosGet.mockResolvedValue({
      data: {
        signedUrl: 'https://signed.example.com/apunte-1.pdf',
      },
    });

    render(<LessonNotesEditor {...baseProps} />);

    await waitFor(() => {
      expect(mocks.axiosGet).toHaveBeenCalledWith(
        '/api/lessons/lesson-1/attachments/att-1',
        {
          params: {
            download: 0,
            language: 'pt',
          },
        },
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('pdf-viewer').getAttribute('data-url')).toBe(
        '/api/lessons/lesson-1/attachments/att-1?download=0&language=pt&proxy=1',
      );
    });
  });

  test('falls back to inline proxy URL when signed URL request fails', async () => {
    mocks.axiosGet.mockRejectedValueOnce({
      response: { data: { error: 'storage unavailable' } },
    });

    render(<LessonNotesEditor {...baseProps} />);

    await waitFor(() => {
      expect(mocks.axiosGet).toHaveBeenCalledWith(
        '/api/lessons/lesson-1/attachments/att-1',
        {
          params: {
            download: 0,
            language: 'pt',
          },
        },
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('pdf-viewer').getAttribute('data-url')).toBe(
        '/api/lessons/lesson-1/attachments/att-1?download=0&language=pt&proxy=1',
      );
    });
  });
});
