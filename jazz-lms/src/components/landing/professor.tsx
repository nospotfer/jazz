import React from 'react';

export function Professor() {
  return (
    <section className="bg-black-100 text-white py-20">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <img
            src="/images/Conoce a tu Profesor.png"
            alt="Enric Vázquez Ramonich"
            className="rounded-lg shadow-lg w-full"
          />
          <p className="text-sm text-gray-400 mt-2">
            Enric Vázquez Ramonich<br />
            Image provided by the Harlem Jazz Museum, NY
          </p>
        </div>
        <div className="md:w-1/2 md:pl-12">
          <h2 className="text-3xl font-bold mb-4">Know Your Professor</h2>
          <p className="text-lg text-gray-300 mb-4">
            Few people can say they have lived jazz from within for more than 60 years. Enric Vázquez Ramonich is a co-founder of the mythical Jamboree Jazz Club and the Jubilee Jazz Club, and has shared the stage and conversations with legends such as Bill Evans, Chet Baker, or Art Blakey.
          </p>
          <p className="text-lg text-gray-300 mb-4">
            He has presented radio and television programs, written in specialized media, and participated in reference works such as the Universal Guide to Modern Jazz. He is also the author of the first chapters of the History of Jazz for the Generalitat de Catalunya.
          </p>
          <p className="text-lg text-gray-300">
            Now, all that experience and passion are condensed in "Jazz Culture", a course designed so that, even if you've never played an instrument, you can understand, feel and enjoy jazz as if you had always been part of it.
          </p>
        </div>
      </div>
    </section>
  );
}