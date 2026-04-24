"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { ContactModal } from "@/components/ui/contact-modal";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FAQItem {
  pregunta: string;
  respuesta: string;
}

const faqs: FAQItem[] = [
  {
    pregunta: "¿Cuánto cuesta el curso?",
    respuesta:
      "El precio depende de las ofertas activas que lanzamos frecuentemente. A menudo encontrarás promociones especiales. Lo mejor es revisar la página del curso para ver el precio actual.",
  },
  {
    pregunta: "¿Qué pasa si me doy cuenta de que el curso no es para mí?",
    respuesta:
      "No hay problema. Queremos que disfrutes aprendiendo y tengas una experiencia positiva. Si cambias de opinión, ofrecemos una garantía de devolución de 30 días, sin riesgo y sin preguntas incómodas.",
  },
  {
    pregunta: "¿Qué aprenderé en este curso?",
    respuesta:
      "Comenzaremos desde lo esencial para entender qué es el jazz, su historia y su cultura. Aprenderás la importancia de la improvisación, a reconocer estilos y músicos por su sonido, y a disfrutar mucho más de los grandes clásicos y de cualquier concierto en vivo.",
  },
];

const NAV_LINKS = [
  { label: "Inicio", href: "#board-hero" },
  { label: "Profesor", href: "#board-professor" },
  { label: "Aprender", href: "#board-learn" },
  { label: "Cursos", href: "#board-courses" },
  { label: "Prensa", href: "#board-press" },
  { label: "Jazz Cats", href: "#board-jazzcats" },
  { label: "FAQ", href: "#board-faq" },
];

export function FAQFooter() {
  const router = useRouter();
  const { language } = useLanguage();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const copy = {
    es: {
      faqTitle: "Preguntas frecuentes",
      faqSubtitle:
        "Si no encuentras la respuesta que buscas, contáctanos aquí abajo.",
      contact: "Contáctanos",
      afterTitle: "¿Qué podré hacer después de completarlo?",
      afterItems: [
        "Ir a un club de jazz y disfrutar la experiencia con una nueva perspectiva.",
        "Escuchar los grandes clásicos y entender por qué son fundamentales.",
        'Reconocer estilos, épocas y músicos por su "sonido".',
        "Sentirte parte de la cultura del jazz, comprendiendo su lenguaje y libertad creativa.",
      ],
      ctaTitle: "¡No esperes más!",
      ctaSubtitle: "Empieza hoy tu viaje por el jazz.",
      cta: "Regístrate",
      ctaFoot:
        "Únete a miles de amantes del jazz que ya forman parte de esta experiencia única.",
      nav: [
        "Inicio",
        "Profesor",
        "Aprender",
        "Cursos",
        "Prensa",
        "Jazz Cats",
        "FAQ",
      ],
      topLabel: "Top",
      topAria: "Volver arriba",
    },
    en: {
      faqTitle: "Frequently asked questions",
      faqSubtitle: "If you cannot find the answer you need, contact us below.",
      contact: "Contact us",
      afterTitle: "What will I be able to do after completing it?",
      afterItems: [
        "Go to a jazz club and enjoy the experience from a new perspective.",
        "Listen to great classics and understand why they are essential.",
        'Recognize styles, eras, and musicians by their "sound".',
        "Feel part of jazz culture by understanding its language and creative freedom.",
      ],
      ctaTitle: "Do not wait any longer!",
      ctaSubtitle: "Start your jazz journey today.",
      cta: "Sign up",
      ctaFoot:
        "Join thousands of jazz lovers already part of this unique experience.",
      nav: [
        "Home",
        "Professor",
        "Learn",
        "Courses",
        "Press",
        "Jazz Cats",
        "FAQ",
      ],
      topLabel: "Top",
      topAria: "Back to top",
    },
    fr: {
      faqTitle: "Questions fréquentes",
      faqSubtitle:
        "Si vous ne trouvez pas la réponse, contactez-nous ci-dessous.",
      contact: "Nous contacter",
      afterTitle: "Que pourrai-je faire après l’avoir terminé ?",
      afterItems: [
        "Aller dans un club de jazz et vivre l’expérience avec un nouveau regard.",
        "Écouter les grands classiques et comprendre pourquoi ils sont fondamentaux.",
        'Reconnaître les styles, les époques et les musiciens par leur "son".',
        "Vous sentir partie prenante de la culture jazz en comprenant son langage et sa liberté créative.",
      ],
      ctaTitle: "N’attendez plus !",
      ctaSubtitle: "Commencez votre voyage jazz dès aujourd’hui.",
      cta: "S’inscrire",
      ctaFoot:
        "Rejoignez des milliers de passionnés de jazz déjà dans cette expérience unique.",
      nav: [
        "Accueil",
        "Professeur",
        "Apprendre",
        "Cours",
        "Presse",
        "Jazz Cats",
        "FAQ",
      ],
      topLabel: "Top",
      topAria: "Retour en haut",
    },
    pt: {
      faqTitle: "Preguntas frecuentes",
      faqSubtitle:
        "Si no encuentras la respuesta que buscas, contáctanos aquí abajo.",
      contact: "Contáctanos",
      afterTitle: "¿Qué podré hacer después de completarlo?",
      afterItems: [
        "Ir a un club de jazz y disfrutar la experiencia con una nueva perspectiva.",
        "Escuchar los grandes clásicos y entender por qué son fundamentales.",
        'Reconocer estilos, épocas y músicos por su "sonido".',
        "Sentirte parte de la cultura del jazz, comprendiendo su lenguaje y libertad creativa.",
      ],
      ctaTitle: "¡No esperes más!",
      ctaSubtitle: "Empieza hoy tu viaje por el jazz.",
      cta: "Regístrate",
      ctaFoot:
        "Únete a miles de amantes del jazz que ya forman parte de esta experiencia única.",
      nav: [
        "Inicio",
        "Professor",
        "Aprender",
        "Cursos",
        "Prensa",
        "Jazz Cats",
        "FAQ",
      ],
      topLabel: "Top",
      topAria: "Volver arriba",
    },
  }[language === 'pt' ? 'es' : language];

  const localizedFaqs =
    language === "es"
      ? faqs
      : [
          {
            pregunta:
              language === "en"
                ? "How much does the course cost?"
                : language === "fr"
                  ? "Combien coûte le cours ?"
                  : "¿Cuánto cuesta el curso?",
            respuesta:
              language === "en"
                ? "Pricing may vary according to active promotions we frequently offer. Check the course page for the current amount."
                : language === "fr"
                  ? "Le prix peut varier selon les promotions actives que nous proposons fréquemment. Consultez la page du cours pour le montant actuel."
                  : "El precio depende de las ofertas activas que lanzamos frecuentemente. A menudo encontrarás promociones especiales. Lo mejor es revisar la página del curso para ver el precio actual.",
          },
          {
            pregunta:
              language === "en"
                ? "What if I realize this course is not for me?"
                : language === "fr"
                  ? "Et si je constate que ce cours n’est pas pour moi ?"
                  : "¿Qué pasa si me doy cuenta de que el curso no es para mí?",
            respuesta:
              language === "en"
                ? "No problem. We want you to enjoy learning and have a positive experience. If you change your mind, we offer a 30-day refund guarantee, risk-free and no questions asked."
                : language === "fr"
                  ? "Aucun problème. Nous voulons que vous profitiez de l'apprentissage et que vous ayez une expérience positive. Si vous changez d'avis, nous offrons une garantie de remboursement de 30 jours, sans risque et sans questions."
                  : "No hay problema. Queremos que disfrutes aprendiendo y tengas una experiencia positiva. Si cambias de opinión, ofrecemos una garantía de devolución de 30 días, sin riesgo y sin preguntas incómodas.",
          },
          {
            pregunta:
              language === "en"
                ? "What will I learn in this course?"
                : language === "fr"
                  ? "Que vais-je apprendre dans ce cours ?"
                  : "¿Qué aprenderé en este curso?",
            respuesta:
              language === "en"
                ? "You will learn jazz fundamentals, history, improvisation, listening, and practical understanding of key styles and artists."
                : language === "fr"
                  ? "Vous apprendrez les fondamentaux du jazz, son histoire, l’improvisation, l’écoute et la compréhension pratique des styles et artistes clés."
                  : "Comenzaremos desde lo esencial para entender qué es el jazz, su historia y su cultura. Aprenderás la importancia de la improvisación, a reconocer estilos y músicos por su sonido, y a disfrutar mucho más de los grandes clásicos y de cualquier concierto en vivo.",
          },
        ];

  const localizedNavLinks = NAV_LINKS.map((link, index) => ({
    ...link,
    label: copy.nav[index] || link.label,
  }));

  const isExpanded = (index: number) =>
    activeIndex === index || hoveredIndex === index;

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    const el = document.getElementById("board-hero");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <div className="min-h-screen w-full bg-white dark:bg-black flex flex-col">
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-8 lg:py-10">
            <div className="space-y-8 lg:space-y-10">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-10 items-start">
                <div>
                  <h2 className="title-accent text-3xl lg:text-4xl font-bold mb-4">
                    {copy.faqTitle}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-5 text-sm">
                    {copy.faqSubtitle}
                  </p>

                  <div className="space-y-3">
                    {localizedFaqs.map((faq, index) => (
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
                            className={`title-accent transition-transform duration-300 flex-shrink-0 ml-2 ${
                              isExpanded(index) ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isExpanded(index) && (
                          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600">
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                              {faq.respuesta}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowContactModal(true)}
                    className="cta-highlight py-3 px-6 rounded-lg transition-colors duration-300 w-fit mt-6"
                  >
                    {copy.contact}
                  </button>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 lg:p-8 h-full">
                  <h3 className="text-gray-900 dark:text-white text-2xl font-bold mb-5">
                    {copy.afterTitle}
                  </h3>
                  <ul className="space-y-3">
                    {copy.afterItems.map((item) => (
                      <li key={item} className="flex items-start">
                        <span className="title-accent mr-3 font-bold text-lg">
                          &#10003;
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-jazz-title-accent)]/35 bg-gray-50/70 dark:bg-gray-900/60 p-8 lg:p-10 text-center">
                <h2 className="text-gray-900 dark:text-white text-4xl sm:text-5xl font-bold mb-3">
                  {copy.ctaTitle}
                </h2>
                <p className="title-accent text-xl mb-7">{copy.ctaSubtitle}</p>

                <button
                  onClick={() => router.push("/auth?tab=register")}
                  className="cta-highlight py-4 px-12 rounded-lg transition-all duration-300 hover:shadow-xl text-lg mb-5"
                >
                  {copy.cta}
                </button>

                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xl mx-auto">
                  {copy.ctaFoot}
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
                    sizes="40px"
                    className="object-contain"
                  />
                </div>
                <span className="text-gray-100 dark:text-white text-sm font-semibold">
                  La Cultura del Jazz
                </span>
              </div>

              {/* Quick navigation links */}
              <nav className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                {localizedNavLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => scrollToSection(e, link.href)}
                    className="text-gray-400 hover:text-[var(--color-jazz-title-accent)] text-xs sm:text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              {/* Back to top */}
              <button
                onClick={scrollToTop}
                className="flex items-center gap-2 title-accent hover:text-[var(--color-jazz-cta)] transition-colors group"
                aria-label={copy.topAria}
              >
                <span className="text-xs uppercase tracking-widest">
                  {copy.topLabel}
                </span>
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
