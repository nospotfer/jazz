import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, test } from 'vitest';

type Header = {
  key: string;
  value: string;
};

type HeaderRule = {
  source: string;
  headers: Header[];
};

type NextConfigWithHeaders = {
  headers: () => Promise<HeaderRule[]>;
};

async function loadHeaderRules() {
  const configUrl = pathToFileURL(
    path.resolve(process.cwd(), 'next.config.mjs'),
  ).href;
  const mod = (await import(configUrl)) as { default: NextConfigWithHeaders };
  return mod.default.headers();
}

function getHeader(rule: HeaderRule, key: string) {
  return rule.headers.find(
    (header) => header.key.toLowerCase() === key.toLowerCase(),
  )?.value;
}

describe('Next security headers', () => {
  test('keeps pages protected from external framing', async () => {
    const rules = await loadHeaderRules();
    const globalRule = rules.find((rule) => rule.source === '/(.*)');

    expect(globalRule).toBeDefined();
    expect(getHeader(globalRule!, 'Content-Security-Policy')).toContain(
      "frame-ancestors 'none'",
    );
  });

  test('allows lesson attachment PDFs to render inside the official site iframe', async () => {
    const rules = await loadHeaderRules();
    const attachmentRule = rules.find(
      (rule) => rule.source === '/api/lessons/:lessonId/attachments/:attachmentId',
    );

    expect(attachmentRule).toBeDefined();
    const csp = getHeader(attachmentRule!, 'Content-Security-Policy');

    expect(csp).toContain(
      "frame-ancestors 'self' https://culturadeljazz.com https://www.culturadeljazz.com",
    );
    expect(csp).not.toContain("frame-ancestors 'none'");
    expect(getHeader(attachmentRule!, 'X-Frame-Options')).toBe('SAMEORIGIN');
  });
});
