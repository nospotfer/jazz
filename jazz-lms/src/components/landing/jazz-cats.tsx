'use client';

import Image from 'next/image';
import { useState } from 'react';
import { SignupModal } from '@/components/ui/signup-modal';

export function JazzCats() {
  const [showSignupModal, setShowSignupModal] = useState(false);

  return (
    <>
      <section className="w-full bg-gray-800 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-white text-4xl font-bold text-center mb-8">
            Los "Jazz Cats"
          </h2>

          <p className="text-gray-300 text-center mb-8 leading-relaxed">
            El término "jazz cat" es una expresión informal que se utiliza en la
            jerga del jazz para referirse a un músico de jazz o, en un sentido más
            amplio, a una persona que es un entusiasta y conocedor del género. La
            palabra "cat" (gato) es una jerga de la época que se usaba para
            referirse a un hombre, a menudo con un toque de "coolness" o
            "sabiduria callejera".
          </p>

          <div className="relative w-full h-96 mb-8 flex items-center justify-center">
            <Image
              src="/images/Imagen4.png"
              alt="Jazz Cats illustration"
              fill
              className="object-contain"
              quality={90}
            />
          </div>

          <button
            onClick={() => setShowSignupModal(true)}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors text-lg"
          >
            ¡Inscríbete ahora!
          </button>
        </div>
      </section>
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />
    </>
  );
}
