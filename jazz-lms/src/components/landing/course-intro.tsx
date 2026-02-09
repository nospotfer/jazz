'use client';

import Image from 'next/image';
import { SignupModal } from '@/components/ui/signup-modal';
import { useState } from 'react';

export function CourseIntro() {
  const [showSignupModal, setShowSignupModal] = useState(false);

  return (
    <section className="w-full bg-gradient-to-b from-gray-900 to-gray-800 py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Logo and Text */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative w-32 h-32 mb-8">
              <Image
                src="/images/Logo.jpeg"
                alt="La Cultura del Jazz"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 text-center lg:text-left">
              ¡Accede al curso completo hoy mismo!
            </h1>
            <p className="text-gray-300 text-lg mb-8 text-center lg:text-left leading-relaxed">
              Sabemos que cada persona tiene su propio ritmo y presupuesto, por eso hemos decidido alojar este curso de forma exclusiva en Udemy. Al ofrecer el curso en Udemy, nos aseguramos de que disfrutes de la mejor relación calidad-precio, flexibilidad total y actualizaciones constantes.
            </p>

            {/* Benefits boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8 lg:mb-12">
              <div className="border-2 border-yellow-500 rounded-lg p-4 text-center">
                <h3 className="text-yellow-500 font-bold mb-2">Acceso de por vida</h3>
                <p className="text-gray-300 text-sm">
                  Paga una sola vez y disfruta del curso completo para siempre, con todas sus actualizaciones.
                </p>
              </div>
              <div className="border-2 border-yellow-500 rounded-lg p-4 text-center">
                <h3 className="text-yellow-500 font-bold mb-2">Flexibilidad total</h3>
                <p className="text-gray-300 text-sm">
                  Aprende a tu ritmo, desde cualquier dispositivo y en cualquier momento.
                </p>
              </div>
              <div className="border-2 border-yellow-500 rounded-lg p-4 text-center">
                <h3 className="text-yellow-500 font-bold mb-2">Sin riesgo</h3>
                <p className="text-gray-300 text-sm">
                  Aprovecha los descuentos frecuentes y la garantía de reembolso de 30 días.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSignupModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 rounded-lg transition-colors text-lg w-full md:w-auto"
            >
              ¡Inscríbete ahora!
            </button>
          </div>

          {/* Right side - Image placeholder */}
          <div className="relative h-96 lg:h-full rounded-lg overflow-hidden">
            <Image
              src="/images/enric_GFPGANv1.4_realesr-general-x4v3.png"
              alt="Jazz instructor"
              fill
              className="object-cover"
              quality={90}
            />
          </div>
        </div>
      </div>
      <SignupModal isOpen={showSignupModal} onClose={() => setShowSignupModal(false)} />
    </section>
  );
}
