'use client';

import Image from 'next/image';

export function Footer() {
  return (
    <footer className="w-full bg-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-12 h-12">
              <Image
                src="/images/Logo.jpeg"
                alt="La Cultura del Jazz"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-white underline text-lg font-semibold">
              Contacto
            </span>
          </div>
          <p className="text-white text-center text-sm">
            Copyright 2025 @CulturadelJazz
          </p>
        </div>
      </div>
    </footer>
  );
}
