'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { SignupModal } from '../ui/signup-modal';
import { LoginModal } from '../ui/login-modal';

interface UserNavClientProps {
  user?: {
    email: string;
    user_metadata: {
      full_name: string;
      avatar_url: string;
    };
  };
}

export function UserNavClient({ user }: UserNavClientProps) {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (!user) {
    return (
      <>
        <Button 
          onClick={() => setShowLoginModal(true)}
          className="mr-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold"
        >
          Login
        </Button>
        <Button 
          onClick={() => setShowSignupModal(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
        >
          Register
        </Button>
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
        <SignupModal 
          isOpen={showSignupModal} 
          onClose={() => setShowSignupModal(false)} 
        />
      </>
    );
  }

  return (
    <div>
      {/* Aqui você pode adicionar componentes de user logado depois */}
      <span>{user.email}</span>
    </div>
  );
}
