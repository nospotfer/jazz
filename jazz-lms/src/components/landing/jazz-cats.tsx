'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function JazzCats() {
  const router = useRouter();

  return (
    <>
      <div className="min-h-screen w-full bg-gray-50 dark:bg-background flex items-center">
        <div className="w-full max-w-4xl mx-auto px-6 sm:px-12 lg:px-16 py-12">
          <h2 className="text-gray-900 dark:text-white text-4xl font-bold text-center mb-8">
            Los "Jazz Cats"
          </h2>

          <p className="text-gray-600 dark:text-gray-300 text-center mb-8 leading-relaxed text-base sm:text-lg">
            El término "jazz cat" es una expresión informal del argot del jazz para referirse a un músico de jazz o, en un sentido más amplio, a una persona entusiasta y conocedora del género. La palabra "cat" era jerga de la época para referirse a un hombre, a menudo con un toque de "estilo" o "sabiduría callejera".
          </p>

          <div className="relative w-full h-96 mb-8 flex items-center justify-center">
            <Image
              src="/images/jazzcats.jpg"
              alt=" Made by pattesdeveloursandco.blogspot.com "
              fill
              className="object-contain"
              quality={90}
            />
          </div>

          <button
            onClick={() => router.push('/auth?tab=register')}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors text-lg"
          >
            Regístrate
          </button>
        </div>
      </div>
    </>
  );
}
