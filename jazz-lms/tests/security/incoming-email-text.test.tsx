// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { incomingEmailHtmlToText, IncomingEmailConversionLimitError, MAX_INCOMING_EMAIL_BODY_LENGTH } from '@/lib/incoming-email-text';
import { MessagesClient } from '@/components/dashboard/messages-client';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('axios', () => ({ default: { get: mocks.get, post: vi.fn() } }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: 'es' }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('parser-based incoming HTML conversion', () => {
  test.each([
    ['nested scripts', '<script><script>window.injected=1</script></script><p>Visible reply</p>', 'Visible reply'],
    ['nested styles', '<style><style>body{background:url(https://invalid.test)}</style></style><p>Visible reply</p>', 'Visible reply'],
    ['unclosed script raw text', '<script>window.injected=1<p>Hidden reply', ''],
    ['unclosed style raw text', '<style>body{color:red}<p>Hidden reply', ''],
    ['numeric and named entities', '<p>&#x1F3B7; &eacute; &quot;Jazz&quot;</p>', '🎷 é "Jazz"'],
    ['one decoding pass', '<p>&amp;lt;script&amp;gt;literal&amp;lt;/script&amp;gt;</p>', '&lt;script&gt;literal&lt;/script&gt;'],
    ['paragraphs and inline markup', '<p>Hello <strong>jazz</strong></p><p>Second<br>line</p>', 'Hello jazz\nSecond\nline'],
    ['metadata and hidden content', '<title>Metadata</title><template>Hidden</template><div hidden>Hidden</div><p>Answer</p>', 'Answer'],
  ])('handles %s without regex tag rewriting', (_label, html, expected) => {
    expect(incomingEmailHtmlToText(html)).toBe(expected);
  });

  test('keeps malformed reconstructed-tag content as plain text', () => {
    const text = incomingEmailHtmlToText('<scr<script>ipt>alert(1)</scr</script>ipt><p>Visible</p>');
    expect(text).toBe('ipt>alert(1)ipt>\nVisible');
    const { container } = render(<p>{text}</p>);
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toBe(text);
  });

  test('omits embedded resource URLs and never performs a fetch', () => {
    const fetch = vi.fn(() => { throw new Error('Embedded resource request is forbidden'); });
    vi.stubGlobal('fetch', fetch);
    expect(incomingEmailHtmlToText('<a href="https://invalid.test/private?token=fixture">Listen</a><img src="https://invalid.test/tracker" alt="Tracker"><iframe src="https://invalid.test">Frame</iframe>'))
      .toBe('Listen');
    expect(fetch).not.toHaveBeenCalled();
  });

  test.each([
    'x'.repeat(MAX_INCOMING_EMAIL_BODY_LENGTH + 1),
    `${'<div>'.repeat(300)}Deep reply${'</div>'.repeat(300)}`,
    '<br>'.repeat(25_000),
  ])('rejects input/structure limits without storing silently truncated text', html => {
    expect(() => incomingEmailHtmlToText(html)).toThrow(IncomingEmailConversionLimitError);
  });

  test('the actual inbox encodes entity-decoded markup as text instead of DOM nodes', async () => {
    const body = incomingEmailHtmlToText('<p>&lt;img src=x onerror=alert(1)&gt; &lt;script&gt;alert(1)&lt;/script&gt;</p>');
    const timestamp = '2026-10-13T00:00:00Z';
    mocks.get.mockImplementation(async (url: string) => ({ data: url === '/api/messages'
      ? { isProfessor: false, professorEmail: 'professor@example.invalid', threads: [{
          id: 'fixture-thread', studentId: 'fixture-student', studentEmail: 'student@example.invalid',
          studentName: 'Fixture', subject: 'Fixture question', createdAt: timestamp, updatedAt: timestamp,
          lastMessage: 'Professor answer', lastMessageAt: timestamp, unreadCount: 0,
        }] }
      : { professorEmail: 'professor@example.invalid', messages: [{
          id: 'fixture-message', threadId: 'fixture-thread', senderId: 'fixture-professor',
          senderEmail: 'professor@example.invalid', senderName: 'Professor', senderRole: 'professor',
          body, createdAt: timestamp,
        }] },
    }));
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { container } = render(<MessagesClient />);
    fireEvent.click(await screen.findByRole('button', { name: /Fixture question/ }));
    await waitFor(() => expect(container.querySelector('p.whitespace-pre-wrap')?.textContent).toBe(body));
    const message = container.querySelector('p.whitespace-pre-wrap')!;
    expect(message.querySelector('img,script,iframe,object')).toBeNull();
    expect(message.innerHTML).toContain('&lt;img');
    expect(message.innerHTML).toContain('&lt;script&gt;');
    expect(alert).not.toHaveBeenCalled();
  });
});
