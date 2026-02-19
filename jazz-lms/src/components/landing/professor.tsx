import React from 'react';
import Image from 'next/image';

export function Professor() {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-background flex items-center">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch min-h-[75vh]">
          {/* Left side - Photo */}
          <div className="relative w-full min-h-[400px] lg:min-h-0 rounded-l-2xl overflow-hidden shadow-2xl">
            <Image
              src="/images/Conoce a tu Profesor.png"
              alt="Enric Vázquez Ramonich"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <p className="text-white text-sm font-medium">
                Enric Vázquez Ramonich
              </p>
              <p className="text-gray-300 text-xs">
                Image provided by the Harlem Jazz Museum, NY
              </p>
            </div>
          </div>

          {/* Right side - Text */}
          <div className="bg-gray-900 dark:bg-gray-900 rounded-r-2xl p-8 lg:p-12 flex flex-col justify-center shadow-2xl">
            <div className="border-b-2 border-yellow-600 pb-6 mb-8">
              <h2 className="text-yellow-500 text-4xl lg:text-5xl font-bold">
                Know Your Professor
              </h2>
            </div>

            <div className="space-y-6">
              <p className="text-gray-200 text-base lg:text-lg leading-relaxed">
                Few people can say they have lived jazz from within for more than 60 years.{' '}
                <span className="text-yellow-500 font-semibold">Enric Vázquez Ramonich</span> is a
                co-founder of the mythical Jamboree Jazz Club and the Jubilee Jazz Club, and has
                shared the stage and conversations with legends such as{' '}
                <span className="text-yellow-500/80 italic">Bill Evans, Chet Baker, or Art Blakey</span>.
              </p>
              <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
                He has presented radio and television programs, written in specialized media, and
                participated in reference works such as the Universal Guide to Modern Jazz. He is also
                the author of the first chapters of the History of Jazz for the Generalitat de Catalunya.
              </p>
              <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
                Now, all that experience and passion are condensed in{' '}
                <span className="text-white font-bold">&quot;Jazz Culture&quot;</span>, a course designed
                so that, even if you&apos;ve never played an instrument, you can understand, feel and
                enjoy jazz as if you had always been part of it.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-1 w-12 bg-yellow-600 rounded-full" />
              <span className="text-yellow-600 text-sm font-semibold uppercase tracking-widest">
                60+ years of jazz experience
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}