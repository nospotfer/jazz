// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  language: 'es',
  axiosGet: vi.fn(),
}));

vi.mock('axios', () => ({
  __esModule: true,
  default: {
    get: mocks.axiosGet,
    isAxiosError: (value: unknown) =>
      Boolean((value as { isAxiosError?: boolean })?.isAxiosError),
  },
}));

vi.mock('@/components/providers/language-provider', () => ({
  useLanguage: () => ({
    language: mocks.language,
    setLanguage: vi.fn(),
  }),
}));

vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: () =>
    function DynamicPdfViewerStub(props: { fileUrl: string }) {
      return <div data-testid="pdf-viewer" data-url={props.fileUrl} />;
    },
}));

import { PdfViewClient } from '@/components/dashboard/pdf-view-client';

const items = [
  {
    id: 'att-1',
    lessonId: 'lesson-1',
    title: 'Clase 1',
    classLabel: 'Clase 1',
    url: 'https://jazz-legacy-preview.vercel.app/dashboard/pdf-view',
    classNumber: 1,
    isAuxiliary: false,
  },
];

describe('PdfViewClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.language = 'es';
  });

  test('uses inline proxy URL from attachment endpoint for preview', async () => {
    mocks.axiosGet.mockResolvedValueOnce({
      data: {
        signedUrl: 'https://signed.example.com/clase-1.pdf',
      },
    });

    render(<PdfViewClient items={items} />);

    await waitFor(() => {
      expect(mocks.axiosGet).toHaveBeenCalledWith(
        '/api/lessons/lesson-1/attachments/att-1',
        {
          params: {
            download: 0,
            language: 'es',
          },
        }
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('pdf-viewer').getAttribute('data-url')).toBe(
        '/api/lessons/lesson-1/attachments/att-1?download=0&language=es&proxy=1'
      );
    });
  });

  test('falls back to inline proxy URL when endpoint has no signed URL', async () => {
    mocks.axiosGet.mockResolvedValueOnce({ data: {} });

    render(<PdfViewClient items={items} />);

    await waitFor(() => {
      expect(screen.getByTestId('pdf-viewer').getAttribute('data-url')).toBe(
        '/api/lessons/lesson-1/attachments/att-1?download=0&language=es&proxy=1'
      );
    });
  });

  test('shows API error when preview cannot be loaded', async () => {
    mocks.axiosGet.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          error: 'No se puede cargar este PDF ahora mismo.',
        },
      },
    });

    render(<PdfViewClient items={items} />);

    await waitFor(() => {
      expect(screen.getByText('No se puede cargar este PDF ahora mismo.')).toBeTruthy();
    });
  });
});
