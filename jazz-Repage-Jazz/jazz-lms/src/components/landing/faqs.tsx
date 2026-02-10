'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  pregunta: string;
  respuesta: string;
}

const faqs: FAQItem[] = [
  {
    pregunta: '¿Cuánto cuesta el curso?',
    respuesta:
      'El precio depende de las ofertas activas en Udemy, que lanza promociones frecuentes. A menudo podrás encontrarlo con descuento respecto al precio habitual. Lo mejor es consultar la página del curso para ver el precio actual.',
  },
  {
    pregunta: '¿Y si me doy cuenta de que el curso no es para mí?',
    respuesta:
      'No pasa nada. Queremos que disfrutes aprendiendo y que la experiencia sea positiva. Si no es lo que esperabas, Udemy ofrece una garantía de reembolso de 30 días, sin riesgo y sin preguntas incómodas.',
  },
  {
    pregunta: '¿Qué aprenderé en este curso?',
    respuesta:
      'Comenzaremos desde lo esencial para entender qué es el jazz, su historia y su cultura. Conocerás la importancia de la improvisación, aprenderás a reconocer estilos y músicos por su sonido, y descubrirás cómo disfrutar mucho más de los grandes clásicos y de cualquier concierto en vivo.',
  },
];

export function FAQs() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="w-full bg-gray-900 py-12 sm:py-16 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-yellow-500 text-3xl font-bold mb-8">
              Preguntas<br />Frecuentes
            </h2>
            <p className="text-gray-300 mb-6">
              Si no encuentras la respuesta que buscas, entra en contacto con
              nosotros mediante el link abajo
            </p>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors">
              Contacto
            </button>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-600 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setActiveIndex(activeIndex === index ? null : index)
                  }
                  className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <span className="text-white font-semibold text-left">
                    {faq.pregunta}
                  </span>
                  <ChevronDown
                    className={`text-yellow-500 transition-transform ${
                      activeIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {activeIndex === index && (
                  <div className="p-4 bg-gray-700 border-t border-gray-600">
                    <p className="text-gray-300">{faq.respuesta}</p>
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
