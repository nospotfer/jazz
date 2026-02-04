'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { SignupModal } from '../ui/signup-modal';

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

  if (!user) {
    return (
      <>
        <Button 
          onClick={() => setShowSignupModal(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
        >
          Login
        </Button>
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
