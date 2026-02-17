import React from 'react';

export function WhatYouLearn() {
  return (
    <section className="bg-gray-50 dark:bg-background text-gray-900 dark:text-white py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          {/* Left side */}
          <div className="md:w-1/2">
            <h2 className="text-4xl font-bold mb-8 text-amber-600">What You'll Learn</h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              This course is designed so that you not only listen to jazz, <span className="font-bold text-gray-900 dark:text-white">but you live it and feel it</span>. You will discover its true essence, its history and the elements that make it unique and emotional.
            </p>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              You will be able to go to a jazz club and enjoy it even more because <span className="font-bold text-gray-900 dark:text-white">you will understand what is happening on stage</span>, you will feel part of its culture and recognize the matrices that make it special.
            </p>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              In addition, <span className="font-bold text-gray-900 dark:text-white">you will learn to enjoy the great classics with fresh eyes</span>, understanding their styles, their musical language and why their importance in the history of jazz.
            </p>
            
            <button className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded transition duration-300">
              Start Now
            </button>
          </div>

          {/* Right side - Benefits */}
          <div className="md:w-1/2">
            <div className="space-y-8">
              {/* Benefit 1 */}
              <div>
                <h3 className="text-xl font-bold text-amber-600 mb-2">Jazz as independent culture</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You will understand that jazz is not just a fusion of African and European influences, but its own musical culture that has profoundly influenced all modern popular music that came later.
                </p>
              </div>

              {/* Benefit 2 */}
              <div>
                <h3 className="text-xl font-bold text-amber-600 mb-2">Improvisation as original creation</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You will learn how improvisation becomes the jazz musician's authorship in each performance, understanding how mechanisms work in different eras and styles, just like a composer in classical music.
                </p>
              </div>

              {/* Benefit 3 */}
              <div>
                <h3 className="text-xl font-bold text-amber-600 mb-2">The musician's personal "Sound"</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You will discover how to identify a musician by their unique sound: timbre, color and artistic personality. You will understand why this "sonata silhouette" is its true fingerprint in the jazz world.
                </p>
              </div>

              {/* Benefit 4 */}
              <div>
                <h3 className="text-xl font-bold text-amber-600 mb-2">Creative freedom and collaborative composition</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You will understand how jazz integrates "rough" and sonorous heterogeneity, adopts elements from other musics and combines composition and improvisation without losing the musician's individuality or the orchestra's own sound.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
