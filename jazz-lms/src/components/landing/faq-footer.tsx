'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SignupModal } from '@/components/ui/signup-modal';
import { ContactModal } from '@/components/ui/contact-modal';
import Image from 'next/image';

interface FAQItem {
  pregunta: string;
  respuesta: string;
}

const faqs: FAQItem[] = [
  {
    pregunta: 'How much does the course cost?',
    respuesta:
      'The price depends on active offers on Udemy, which launches frequent promotions. You can often find it at a discount from the regular price. The best thing is to check the course page to see the current price.',
  },
  {
    pregunta: 'What if I realize the course is not for me?',
    respuesta:
      "No problem. We want you to enjoy learning and have a positive experience. If it's not what you expected, Udemy offers a 30-day money-back guarantee, with no risk and no uncomfortable questions.",
  },
  {
    pregunta: 'What will I learn in this course?',
    respuesta:
      "We'll start from the essentials to understand what jazz is, its history and culture. You'll learn the importance of improvisation, learn to recognize styles and musicians by their sound, and discover how to enjoy the great classics and any live concert much more.",
  },
];

const NAV_LINKS = [
  { label: 'Home', href: '#board-hero' },
  { label: 'Professor', href: '#board-professor' },
  { label: 'Learn', href: '#board-learn' },
  { label: 'Courses', href: '#board-courses' },
  { label: 'Press', href: '#board-press' },
  { label: 'Jazz Cats', href: '#board-jazzcats' },
  { label: 'FAQ', href: '#board-faq' },
];

export function FAQFooter() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
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
                  Frequently Asked Questions
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                  If you can&apos;t find the answer you&apos;re looking for, contact us below.
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
                  Contact Us
                </button>

                {/* What will I be able to do section */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 lg:p-8">
                  <h3 className="text-gray-900 dark:text-white text-xl lg:text-2xl font-bold mb-5">
                    What will I be able to do after completing it?
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-3 font-bold text-lg">&#10003;</span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Go to a jazz club and enjoy the experience with a fresh perspective.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-3 font-bold text-lg">&#10003;</span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Listen to the great classics and understand why they are fundamental.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-3 font-bold text-lg">&#10003;</span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Recognize styles, eras and musicians by their &quot;sound&quot;.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-3 font-bold text-lg">&#10003;</span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Feel part of jazz culture, understanding its language and creative freedom.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right side - Sign Up CTA */}
              <div className="flex flex-col justify-center items-center text-center lg:pl-8">
                <h2 className="text-gray-900 dark:text-white text-4xl sm:text-5xl font-bold mb-4">
                  Don&apos;t Wait!
                </h2>
                <p className="text-yellow-600 text-xl mb-8">
                  Start your jazz journey today.
                </p>

                <button
                  onClick={() => setShowSignupModal(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 px-12 rounded-lg transition-all duration-300 hover:shadow-xl text-lg mb-6"
                >
                  Sign Up Now!
                </button>

                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">
                  Join thousands of jazz enthusiasts who are already part of this unique experience.
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
                aria-label="Back to top"
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

      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </>
  );
}
