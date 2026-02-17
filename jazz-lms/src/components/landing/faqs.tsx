'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
      'No problem. We want you to enjoy learning and have a positive experience. If it\'s not what you expected, Udemy offers a 30-day money-back guarantee, with no risk and no uncomfortable questions.',
  },
  {
    pregunta: 'What will I learn in this course?',
    respuesta:
      'We\'ll start from the essentials to understand what jazz is, its history and culture. You\'ll learn the importance of improvisation, learn to recognize styles and musicians by their sound, and discover how to enjoy the great classics and any live concert much more.',
  },
];

export function FAQs() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const isExpanded = (index: number) => activeIndex === index || hoveredIndex === index;

  return (
    <section className="w-full bg-white dark:bg-black py-12 sm:py-16 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-yellow-500 text-3xl font-bold mb-8">
              Frequently<br />Asked Questions
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              If you can't find the answer you're looking for, contact us via the link below
            </p>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors duration-500 ease-out">
              Contact
            </button>
          </div>

          <div className="space-y-4">
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
                  className="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-500 ease-out"
                >
                  <span className="text-gray-900 dark:text-white font-semibold text-left">
                    {faq.pregunta}
                  </span>
                  <ChevronDown
                    className={`text-yellow-500 transition-transform duration-500 ease-out ${
                      isExpanded(index) ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isExpanded(index) && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600">
                    <p className="text-gray-600 dark:text-gray-300">{faq.respuesta}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
