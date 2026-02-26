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
            The "Jazz Cats"
          </h2>

          <p className="text-gray-600 dark:text-gray-300 text-center mb-8 leading-relaxed text-base sm:text-lg">
            The term "jazz cat" is an informal expression used in jazz slang to refer to a jazz musician, or in a broader sense, to a person who is an enthusiast and connoisseur of the genre. The word "cat" is slang from that era that was used to refer to a man, often with a touch of "coolness" or "street wisdom".
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
            Sign Up
          </button>
        </div>
      </div>
    </>
  );
}
