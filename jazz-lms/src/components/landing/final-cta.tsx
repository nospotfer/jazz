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
            Don't Wait!
          </h2>
          <p className="text-gray-800 text-xl mb-8">
            Start your jazz journey today.
          </p>

          <button
            onClick={() => setShowSignupModal(true)}
            className="bg-black hover:bg-gray-900 text-white font-bold py-4 px-12 rounded-lg transition-colors text-xl mb-8"
          >
            Sign Up Now and Take the First Step!
          </button>

          <div className="bg-gray-100 rounded-lg p-8 mt-12">
            <h3 className="text-gray-800 text-2xl font-bold mb-6">
              What will I be able to do after completing it?
            </h3>
            <ul className="text-left space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="text-yellow-600 mr-4 font-bold">✓</span>
                <span>Go to a jazz club and enjoy the experience with a fresh perspective.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-4 font-bold">✓</span>
                <span>Listen to the great classics and understand why they are fundamental.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-4 font-bold">✓</span>
                <span>Recognize styles, eras and musicians by their "sound".</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-4 font-bold">✓</span>
                <span>Feel part of jazz culture, understanding its language and creative freedom.</span>
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
