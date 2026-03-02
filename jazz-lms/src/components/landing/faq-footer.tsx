'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ContactModal } from '@/components/ui/contact-modal';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface FAQItem {
  pregunta: string;
  respuesta: string;
}

const faqs: FAQItem[] = [
  {
    pregunta: '¿Cuánto cuesta el curso?',
    respuesta:
      'El precio depende de las ofertas activas en Udemy, que lanza promociones frecuentes. A menudo puedes encontrarlo con descuento respecto al precio regular. Lo mejor es revisar la página del curso para ver el precio actual.',
  },
  {
    pregunta: '¿Qué pasa si me doy cuenta de que el curso no es para mí?',
    respuesta:
      'No hay problema. Queremos que disfrutes aprendiendo y tengas una experiencia positiva. Si no es lo que esperabas, Udemy ofrece una garantía de devolución de 30 días, sin riesgo y sin preguntas incómodas.',
  },
  {
    pregunta: '¿Qué aprenderé en este curso?',
    respuesta:
      'Comenzaremos desde lo esencial para entender qué es el jazz, su historia y su cultura. Aprenderás la importancia de la improvisación, a reconocer estilos y músicos por su sonido, y a disfrutar mucho más de los grandes clásicos y de cualquier concierto en vivo.',
  },
];

const NAV_LINKS = [
  { label: 'Inicio', href: '#board-hero' },
  { label: 'Profesor', href: '#board-professor' },
  { label: 'Aprender', href: '#board-learn' },
  { label: 'Cursos', href: '#board-courses' },
  { label: 'Prensa', href: '#board-press' },
  { label: 'Jazz Cats', href: '#board-jazzcats' },
  { label: 'FAQ', href: '#board-faq' },
];

export function FAQFooter() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const isExpanded = (index: number) => activeIndex === index || hoveredIndex === index;

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    const el = document.getElementById('board-hero');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="min-h-screen w-full bg-white dark:bg-black flex flex-col">
        {/* Main content area */}
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Left side - FAQ + What you'll be able to do */}
              <div className="flex flex-col justify-center">
                {/* FAQ Section */}
                <h2 className="text-yellow-500 text-3xl lg:text-4xl font-bold mb-6">
                  Preguntas frecuentes
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                  Si no encuentras la respuesta que buscas, contáctanos aquí abajo.
                </p>

                <div className="space-y-3 mb-10">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <button
                        onClick={() =>
                          setActiveIndex(activeIndex === index ? null : index)
                        }
                        className="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
                      >
                        <span className="text-gray-900 dark:text-white font-semibold text-left text-sm">
                          {faq.pregunta}
                        </span>
                        <ChevronDown
                          className={`text-yellow-500 transition-transform duration-300 flex-shrink-0 ml-2 ${
                            isExpanded(index) ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isExpanded(index) && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600">
                          <p className="text-gray-600 dark:text-gray-300 text-sm">{faq.respuesta}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowContactModal(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors duration-300 w-fit mb-10"
                >
                  Contáctanos
                </button>

                {/* What will I be able to do section */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 lg:p-8">
                  <h3 className="text-gray-900 dark:text-white text-xl lg:text-2xl font-bold mb-5">
                    ¿Qué podré hacer después de completarlo?
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-3 font-bold text-lg">&#10003;</span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Ir a un club de jazz y disfrutar la experiencia con una nueva perspectiva.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-3 font-bold text-lg">&#10003;</span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Escuchar los grandes clásicos y entender por qué son fundamentales.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-3 font-bold text-lg">&#10003;</span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Reconocer estilos, épocas y músicos por su &quot;sonido&quot;.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-3 font-bold text-lg">&#10003;</span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Sentirte parte de la cultura del jazz, comprendiendo su lenguaje y libertad creativa.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Lado derecho - CTA de registro */}
              <div className="flex flex-col justify-center items-center text-center lg:pl-8">
                <h2 className="text-gray-900 dark:text-white text-4xl sm:text-5xl font-bold mb-4">
                  ¡No esperes más!
                </h2>
                <p className="text-yellow-600 text-xl mb-8">
                  Empieza hoy tu viaje por el jazz.
                </p>

                <button
                  onClick={() => router.push('/auth?tab=register')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 px-12 rounded-lg transition-all duration-300 hover:shadow-xl text-lg mb-6"
                >
                  Regístrate
                </button>

                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">
                  Únete a miles de amantes del jazz que ya forman parte de esta experiencia única.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full bg-gray-900 dark:bg-black border-t border-gray-700 py-8">
          <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Logo + Contact */}
              <div className="flex items-center gap-4">
                <div className="relative w-10 h-10">
                  <Image
                    src="/images/Logo.jpeg"
                    alt="La Cultura del Jazz"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-gray-100 dark:text-white text-sm font-semibold">
                  La Cultura del Jazz
                </span>
              </div>

              {/* Quick navigation links */}
              <nav className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => scrollToSection(e, link.href)}
                    className="text-gray-400 hover:text-yellow-500 text-xs sm:text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              {/* Back to top */}
              <button
                onClick={scrollToTop}
                className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors group"
                aria-label="Volver arriba"
              >
                <span className="text-xs uppercase tracking-widest">Top</span>
                <ChevronUp className="h-5 w-5 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700 text-center">
              <p className="text-gray-400 text-xs">
                Copyright 2025 @CulturadelJazz
              </p>
            </div>
          </div>
        </footer>
      </div>
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </>
  );
}
