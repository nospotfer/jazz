// @vitest-environment jsdom
import React from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, test } from 'vitest';
import { LanguageProvider } from '@/components/providers/language-provider';
import { LEGAL_CONTACT_EMAIL } from '@/components/legal/legal-document';
import { REFUND_GUARANTEE_DAYS, TERMS_OF_SALE_COPY, TermsOfSale } from '@/components/legal/terms-of-sale';
import { SUPPORTED_LANGUAGES } from '@/lib/language';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.cookie = 'jazz_lang=; max-age=0; path=/';
});

describe('terms of sale page', () => {
  test('every language has the same sections, the seller, the contact and the refund window', () => {
    const sectionCount = TERMS_OF_SALE_COPY.es.sections.length;
    for (const language of SUPPORTED_LANGUAGES) {
      const copy = TERMS_OF_SALE_COPY[language];
      expect(copy.sections).toHaveLength(sectionCount);
      const text = JSON.stringify(copy);
      expect(text).toContain('Neurofactory');
      expect(text).toContain(LEGAL_CONTACT_EMAIL);
      expect(text).toContain('Dodo Payments');
      expect(text).toContain(`${REFUND_GUARANTEE_DAYS}`);
      expect(text).toContain('www.culturadeljazz.com/privacy');
    }
  });

  test('the refund window matches the guarantee promised in the homepage FAQ in all languages', () => {
    const faq = readFileSync(path.join(__dirname, '../../src/components/landing/faq-footer.tsx'), 'utf8');
    for (const phrase of ['garantía de devolución de 30 días', '30-day refund guarantee', 'remboursement de 30 jours', 'reembolso de 30 dias']) {
      expect(faq).toContain(phrase);
    }
    expect(REFUND_GUARANTEE_DAYS).toBe(30);
  });

  test('server HTML contains the Spanish terms with working email and privacy links', () => {
    const html = renderToString(<LanguageProvider><TermsOfSale /></LanguageProvider>);
    expect(html).toContain('Condiciones de venta y uso');
    expect(html).toContain(`href="mailto:${LEGAL_CONTACT_EMAIL}"`);
    expect(html).toContain('href="/privacy"');
    for (const section of TERMS_OF_SALE_COPY.es.sections) expect(html).toContain(section.title);
  });

  test('the language buttons switch the terms text', () => {
    render(<LanguageProvider><TermsOfSale /></LanguageProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'fr' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Conditions de vente et d’utilisation' })).toBeTruthy();
  });
});
