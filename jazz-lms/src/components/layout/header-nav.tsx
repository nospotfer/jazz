'use client';

import { useLanguage } from '@/components/providers/language-provider';
import { Menu } from 'lucide-react';
import { useRef } from 'react';

const NAV_LINKS = {
  es: [
    { label: 'Inicio', href: '#board-hero' },
    { label: 'Profesor', href: '#board-professor' },
    { label: 'Aprender', href: '#board-learn' },
    { label: 'Cursos', href: '#board-courses' },
    { label: 'Prensa', href: '#board-press' },
    { label: 'Jazz Cats', href: '#board-jazzcats' },
    { label: 'FAQ', href: '#board-faq' },
  ],
  en: [
    { label: 'Home', href: '#board-hero' },
    { label: 'Professor', href: '#board-professor' },
    { label: 'Learn', href: '#board-learn' },
    { label: 'Courses', href: '#board-courses' },
    { label: 'Press', href: '#board-press' },
    { label: 'Jazz Cats', href: '#board-jazzcats' },
    { label: 'FAQ', href: '#board-faq' },
  ],
  fr: [
    { label: 'Accueil', href: '#board-hero' },
    { label: 'Professeur', href: '#board-professor' },
    { label: 'Apprendre', href: '#board-learn' },
    { label: 'Cours', href: '#board-courses' },
    { label: 'Presse', href: '#board-press' },
    { label: 'Jazz Cats', href: '#board-jazzcats' },
    { label: 'FAQ', href: '#board-faq' },
  ],
  pt: [
    { label: 'Início', href: '#board-hero' },
    { label: 'Professor', href: '#board-professor' },
    { label: 'Aprender', href: '#board-learn' },
    { label: 'Cursos', href: '#board-courses' },
    { label: 'Imprensa', href: '#board-press' },
    { label: 'Jazz Cats', href: '#board-jazzcats' },
    { label: 'FAQ', href: '#board-faq' },
  ],
};

export function HeaderNav() {
  const { language } = useLanguage();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const menuLabel = { es: 'Abrir navegación', en: 'Open navigation', fr: 'Ouvrir la navigation', pt: 'Abrir navegação' }[language];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      const headerHeight = document.querySelector('header')?.getBoundingClientRect().height || 0;
      window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - headerHeight - 16, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
    if (menuRef.current) menuRef.current.open = false;
  };

  return (
    <>
    <nav aria-label={menuLabel} className="order-2 hidden flex-1 items-center justify-center gap-1 xl:flex">
      {NAV_LINKS[language].map((link) => (
        <a
          key={link.href}
          href={link.href}
          onClick={(e) => scrollToSection(e, link.href)}
          className="inline-flex min-h-11 items-center rounded px-2 text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-[var(--color-jazz-title-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-gray-300"
        >
          {link.label}
        </a>
      ))}
    </nav>
    <details ref={menuRef} className="relative order-4 xl:hidden">
      <summary aria-label={menuLabel} className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-border bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
        <Menu className="h-5 w-5" aria-hidden="true" />
      </summary>
      <nav aria-label={menuLabel} className="absolute left-0 top-full z-50 mt-2 w-52 rounded-xl border border-border bg-card p-2 shadow-xl">
        {NAV_LINKS[language].map(link => (
          <a key={link.href} href={link.href} onClick={event => scrollToSection(event, link.href)} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            {link.label}
          </a>
        ))}
      </nav>
    </details>
    </>
  );
}
