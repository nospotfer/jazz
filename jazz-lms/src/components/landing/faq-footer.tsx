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
      "La primera clase es gratis al registrarte. Después, puedes consultar el precio del curso completo en tu cuenta antes de comprar.",
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
        "Crea tu cuenta y empieza por la primera clase gratis. Después, elige cómo continuar.",
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
        "Create your account and start with the first lesson free. Then choose how to continue.",
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
        "Créez votre compte et commencez par la première leçon gratuite. Choisissez ensuite comment continuer.",
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
      faqTitle: "Perguntas frequentes",
      faqSubtitle:
        "Se não encontrar a resposta que procura, fale conosco abaixo.",
      contact: "Fale conosco",
      afterTitle: "O que poderei fazer depois de concluir o curso?",
      afterItems: [
        "Ir a um clube de jazz e aproveitar a experiência com uma nova perspectiva.",
        "Ouvir os grandes clássicos e entender por que são fundamentais.",
        'Reconhecer estilos, épocas e músicos pelo seu "som".',
        "Sentir-se parte da cultura do jazz, compreendendo sua linguagem e liberdade criativa.",
      ],
      ctaTitle: "Não espere mais!",
      ctaSubtitle: "Comece hoje sua jornada pelo jazz.",
      cta: "Cadastre-se",
      ctaFoot:
        "Crie sua conta e comece pela primeira aula grátis. Depois, escolha como continuar.",
      nav: [
        "Início",
        "Professor",
        "Aprender",
        "Cursos",
        "Imprensa",
        "Jazz Cats",
        "FAQ",
      ],
      topLabel: "Top",
      topAria: "Voltar ao início",
    },
  }[language];

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
                  : "Quanto custa o curso?",
            respuesta:
              language === "en"
                ? "The first lesson is free when you register. You can then check the price of the full course in your account before purchasing."
                : language === "fr"
                  ? "La première leçon est offerte à l’inscription. Consultez ensuite le prix du cours complet dans votre compte avant d’acheter."
                  : "A primeira aula é grátis ao se cadastrar. Depois, consulte o preço do curso completo na sua conta antes de comprar.",
          },
          {
            pregunta:
              language === "en"
                ? "What if I realize this course is not for me?"
                : language === "fr"
                  ? "Et si je constate que ce cours n’est pas pour moi ?"
                  : "E se eu perceber que o curso não é para mim?",
            respuesta:
              language === "en"
                ? "No problem. We want you to enjoy learning and have a positive experience. If you change your mind, we offer a 30-day refund guarantee, risk-free and no questions asked."
                : language === "fr"
                  ? "Aucun problème. Nous voulons que vous profitiez de l'apprentissage et que vous ayez une expérience positive. Si vous changez d'avis, nous offrons une garantie de remboursement de 30 jours, sans risque et sans questions."
                  : "Não há problema. Queremos que você goste de aprender e tenha uma experiência positiva. Se mudar de ideia, oferecemos garantia de reembolso de 30 dias, sem risco e sem perguntas incômodas.",
          },
          {
            pregunta:
              language === "en"
                ? "What will I learn in this course?"
                : language === "fr"
                  ? "Que vais-je apprendre dans ce cours ?"
                  : "O que vou aprender neste curso?",
            respuesta:
              language === "en"
                ? "You will learn jazz fundamentals, history, improvisation, listening, and practical understanding of key styles and artists."
                : language === "fr"
                  ? "Vous apprendrez les fondamentaux du jazz, son histoire, l’improvisation, l’écoute et la compréhension pratique des styles et artistes clés."
                  : "Você aprenderá os fundamentos do jazz, sua história e sua cultura. Descubra a importância da improvisação, reconheça estilos e músicos pelo som e aprecie os grandes clássicos e os shows ao vivo.",
          },
        ];

  const localizedNavLinks = NAV_LINKS.map((link, index) => ({
    ...link,
    label: copy.nav[index] || link.label,
  }));

  const isExpanded = (index: number) =>
    activeIndex === index;

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  };

  const scrollToTop = () => {
    const el = document.getElementById("board-hero");
    if (el) {
      el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  };

  return (
    <>
      <div className="w-full bg-white dark:bg-black">
        <div>
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 lg:py-16">
            <div className="space-y-8 lg:space-y-10">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-10 items-start">
                <div>
                  <h2 className="title-accent font-serif text-3xl sm:text-4xl font-semibold mb-4">
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
                      >
                        <button
                          type="button"
                          aria-expanded={isExpanded(index)}
                          aria-controls={`faq-answer-${index}`}
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
                          <div id={`faq-answer-${index}`} role="region" aria-label={faq.pregunta} className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600">
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
                <h2 className="font-serif text-gray-900 dark:text-white text-3xl sm:text-4xl font-semibold mb-3">
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
                    src="/images/logo-mark.png"
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
                    className="inline-flex min-h-11 items-center text-gray-400 hover:text-[var(--color-jazz-title-accent)] text-sm transition-colors"
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
                © {new Date().getFullYear()} La Cultura del Jazz
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
