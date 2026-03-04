'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ContactModal } from '@/components/ui/contact-modal';

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

export function FAQs() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

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
              Si no encuentras la respuesta que buscas, contáctanos desde el enlace de abajo
            </p>
            <button
              onClick={() => setShowContactModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors duration-500 ease-out"
            >
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
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </section>
  );
}
