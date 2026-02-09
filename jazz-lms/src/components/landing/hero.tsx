'use client';
// Last updated: 2025-11-26 - Fixed null course handling
import { Button } from '@/components/ui/button';
import { SignupModal } from '@/components/ui/signup-modal';
import { createClient } from '@/utils/supabase/client';
import axios from 'axios';
import { Course } from '@prisma/client';
import { useState } from 'react';
import { Edit2, X } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

interface HeroProps {
  course: Course | null;
}

export const Hero = ({ course }: HeroProps) => {
  const [mediaUrl, setMediaUrl] = useState<string>('https://media.giphy.com/media/xT9IgEx8SbQ0teblUQ/giphy.gif');
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(mediaUrl);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleCheckout = async () => {
    if (!course) return;

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // You might want to redirect to login or show a modal
        console.error('User not logged in');
        return;
      }

      const response = await axios.post('/api/checkout', {
        courseId: course.id,
      });

      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const handleSaveMedia = () => {
    if (inputValue.trim()) {
      setMediaUrl(inputValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setInputValue(mediaUrl);
    setIsEditing(false);
  };

  const isGif = mediaUrl.toLowerCase().includes('.gif') || mediaUrl.includes('giphy.com');
  const isVideo = mediaUrl.toLowerCase().includes('.mp4') || mediaUrl.toLowerCase().includes('.webm') || mediaUrl.includes('youtube.com') || mediaUrl.includes('vimeo.com');

  return (
    <div className="relative isolate pt-14">
      <div className="mx-auto max-w-2xl py-4 sm:py-6 lg:py-8">
        <div className="hidden sm:mb-8 sm:flex sm:justify-center">
          <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-border hover:ring-primary">
            A course by Enric Vazquez Ramonich.{' '}
            <a href="#" className="font-semibold text-primary">
              <span className="absolute inset-0" aria-hidden="true" />
              Read more <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl font-serif">
            {course?.title || 'Welcome to Jazz LMS'}
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {course?.description || 'Start your journey with our premium courses. Check back soon for new content!'}
          </p>

          {/* Central Image - Replace /images/your-image.jpg with your image path */}
          <div className="mt-8 flex justify-center">
            <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden">
              <Image
                src="/images/jazz-placeholder.jpg"
                alt="Jazz Course Image"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Media Section */}
          <div className="mt-4 flex flex-col items-center justify-center gap-4">
            <div className="relative w-full max-w-2xl group">
              <div className="relative rounded-lg overflow-hidden bg-gray-900 h-[360px] flex items-center justify-center">
                {isEditing ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4 bg-gray-800">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Enter video/gif URL (mp4, webm, gif, youtube, vimeo, giphy)"
                      className="w-full px-4 py-2 rounded-md text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveMedia}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="text-white"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {isVideo ? (
                      <div className="w-full h-full relative">
                        <iframe
                          width="100%"
                          height="100%"
                          src={mediaUrl.includes('youtube.com') ? `https://www.youtube.com/embed/${new URL(mediaUrl).searchParams.get('v') || mediaUrl.split('/').pop()}` : mediaUrl}
                          title="Jazz Course Video"
                          frameBorder="0"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        />
                      </div>
                    ) : isGif ? (
                      <img
                        src={mediaUrl}
                        alt="Jazz Course GIF"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
                        <p>Invalid media URL</p>
                        <p className="text-sm">Click edit to add a video or gif</p>
                      </div>
                    )}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="absolute top-4 right-4 p-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Edit media"
                    >
                      <Edit2 className="h-5 w-5 text-black" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-4 flex items-center justify-center gap-x-6">
            {course ? (
              <>
                <Button onClick={() => setShowSignupModal(true)}>Inscríbete ahora</Button>
                <a
                  href="#"
                  className="text-sm font-semibold leading-6 text-foreground"
                >
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No courses available yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Signup Modal */}
      <SignupModal 
        isOpen={showSignupModal} 
        onClose={() => setShowSignupModal(false)} 
      />

      {/* Entra en el Mundo del Jazz */}
      <section className="bg-white py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-yellow-700 mb-6">
            Entra en el Mundo del Jazz
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-6">
            Vive una experiencia que cambiará para siempre tu manera de sentir la música.
          </p>
          <p className="text-lg sm:text-xl text-gray-700 mb-8">
            No necesitas ser músico ni experto para disfrutar del jazz. Con este curso aprenderás a comprender su lenguaje, reconocer sus estilos y vivirlo con más intensidad en cada escucha.
          </p>
          <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors text-lg">
            Inscríbete ahora
          </button>
        </div>
      </section>
    </div>
  );
};
