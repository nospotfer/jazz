'use client';

const NAV_LINKS = [
  { label: 'Inicio', href: '#board-hero' },
  { label: 'Profesor', href: '#board-professor' },
  { label: 'Aprender', href: '#board-learn' },
  { label: 'Cursos', href: '#board-courses' },
  { label: 'Prensa', href: '#board-press' },
  { label: 'Jazz Cats', href: '#board-jazzcats' },
  { label: 'FAQ', href: '#board-faq' },
];

export function HeaderNav() {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
      {NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          onClick={(e) => scrollToSection(e, link.href)}
          className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-500 px-2 py-1 rounded transition-colors duration-200"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
