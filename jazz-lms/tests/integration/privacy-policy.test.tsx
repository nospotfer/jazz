// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, test } from 'vitest';
import { LanguageProvider } from '@/components/providers/language-provider';
import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_POLICY_COPY,
  PrivacyPolicy,
} from '@/components/legal/privacy-policy';
import { SUPPORTED_LANGUAGES } from '@/lib/language';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.cookie = 'jazz_lang=; max-age=0; path=/';
});

describe('privacy policy page', () => {
  test('every language has the same sections, names the controller and gives the contact email', () => {
    const sectionCount = PRIVACY_POLICY_COPY.es.sections.length;
    for (const language of SUPPORTED_LANGUAGES) {
      const copy = PRIVACY_POLICY_COPY[language];
      expect(copy.sections).toHaveLength(sectionCount);
      const text = JSON.stringify(copy);
      expect(text).toContain('Neurofactory');
      expect(text).toContain('Gabriel Oliveira-Barra');
      expect(text).toContain(PRIVACY_CONTACT_EMAIL);
      // Google's user-data policy requires disclosing what Google sign-in shares.
      expect(text).toContain('Google');
      expect(text).toContain('Dodo Payments');
    }
  });

  test('server HTML contains the full Spanish policy for crawlers and reviewers', () => {
    const html = renderToString(<LanguageProvider><PrivacyPolicy /></LanguageProvider>);
    expect(html).toContain('Política de privacidad');
    expect(html).toContain(`mailto:${PRIVACY_CONTACT_EMAIL}`);
    for (const section of PRIVACY_POLICY_COPY.es.sections) {
      expect(html).toContain(section.title);
    }
  });

  test('the language buttons switch the policy text', () => {
    render(<LanguageProvider><PrivacyPolicy /></LanguageProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'en' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'en' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'pt' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Política de privacidade' })).toBeTruthy();
  });
});
