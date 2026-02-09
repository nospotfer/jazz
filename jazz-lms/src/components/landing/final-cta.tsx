'use client';

import { useState } from 'react';
import { SignupModal } from '@/components/ui/signup-modal';

export function FinalCTA() {
  const [showSignupModal, setShowSignupModal] = useState(false);

  return (
    <>
      <section className="w-full bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-yellow-600 text-4xl sm:text-5xl font-bold mb-4">
            ¡No esperes más!
          </h2>
          <p className="text-gray-800 text-xl mb-8">
            Empieza hoy mismo tu viaje en el jazz.
          </p>

          <button
            onClick={() => setShowSignupModal(true)}
            className="bg-black hover:bg-gray-900 text-white font-bold py-4 px-12 rounded-lg transition-colors text-xl mb-8"
          >
            ¡Apúntate ahora y da el primer paso!
          </button>

          <div className="bg-gray-100 rounded-lg p-8 mt-12">
            <h3 className="text-gray-800 text-2xl font-bold mb-6">
              ¿Qué podré hacer después de completarlo?
            </h3>
            <ul className="text-left space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="text-yellow-600 mr-4 font-bold">✓</span>
                <span>Ir a un club de jazz y disfrutar la experiencia con una nueva mirada.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-4 font-bold">✓</span>
                <span>Escuchar a los grandes clásicos y entender por qué son fundamentales.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-4 font-bold">✓</span>
                <span>Reconocer estilos, épocas y músicos por su "sound".</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-4 font-bold">✓</span>
                <span>Sentirte parte de la cultura del jazz, comprendiendo su lenguaje y su libertad creativa.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />
    </>
  );
}
