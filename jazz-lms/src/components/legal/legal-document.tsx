'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/language';

export const LEGAL_CONTACT_EMAIL = 'info@neurofactory.net';
export const LEGAL_OWNER = 'Neurofactory (Gabriel Oliveira-Barra)';

// Rendered in order: lead paragraphs, list items, closing paragraphs.
export type LegalSection = { title: string; lead?: string[]; items?: string[]; paragraphs?: string[] };
export type LegalCopy = {
  back: string;
  title: string;
  updated: string;
  intro: string;
  languageLabel: string;
  sections: LegalSection[];
};

const LINKS: Array<{ text: string; href: string }> = [
  { text: LEGAL_CONTACT_EMAIL, href: `mailto:${LEGAL_CONTACT_EMAIL}` },
  { text: 'www.culturadeljazz.com/privacy', href: '/privacy' },
  { text: 'www.culturadeljazz.com/terms', href: '/terms' },
];
const LINK_PATTERN = new RegExp(`(${LINKS.map((link) => link.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`);

/** Turns the contact email and legal page addresses inside copy into links. */
function linkify(text: string) {
  return text.split(LINK_PATTERN).map((part, index) => {
    const link = LINKS.find((candidate) => candidate.text === part);
    return link ? (
      <a key={index} href={link.href} className="font-semibold underline underline-offset-2 title-accent">
        {part}
      </a>
    ) : (
      part
    );
  });
}

export function LegalDocument({ copyByLanguage }: { copyByLanguage: Record<SupportedLanguage, LegalCopy> }) {
  const { language, setLanguage } = useLanguage();
  const copy = copyByLanguage[language];

  return (
    <main lang={language} className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold title-accent hover:underline">
            ← {copy.back}
          </Link>
          <div role="group" aria-label={copy.languageLabel} className="flex gap-1">
            {SUPPORTED_LANGUAGES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                aria-pressed={code === language}
                title={LANGUAGE_LABELS[code]}
                className={`min-h-11 min-w-11 rounded-md border px-2 text-xs font-semibold uppercase transition-colors ${
                  code === language
                    ? 'border-[var(--color-jazz-title-accent)] text-foreground'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        <h1 className="mt-8 font-serif text-3xl font-bold sm:text-4xl">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{copy.updated}</p>
        <p className="mt-6 text-base leading-relaxed">{copy.intro}</p>

        {copy.sections.map((section) => (
          <section key={section.title} className="mt-8">
            <h2 className="font-serif text-xl font-semibold sm:text-2xl">{section.title}</h2>
            {section.lead?.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-foreground/90">{linkify(paragraph)}</p>
            ))}
            {section.items && (
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-foreground/90">
                {section.items.map((item) => <li key={item}>{linkify(item)}</li>)}
              </ul>
            )}
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-foreground/90">{linkify(paragraph)}</p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
