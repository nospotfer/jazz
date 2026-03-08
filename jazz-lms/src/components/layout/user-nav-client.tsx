'use client';

import Link from 'next/link';
import { Button } from '../ui/button';
import { useLanguage } from '@/components/providers/language-provider';

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
  const { language } = useLanguage();
  const copy = {
    es: { signIn: 'Iniciar sesión', signUp: 'Regístrate' },
    en: { signIn: 'Sign in', signUp: 'Sign up' },
    fr: { signIn: 'Se connecter', signUp: 'S’inscrire' },
    pt: { signIn: 'Entrar', signUp: 'Cadastrar' },
  }[language];

  if (!user) {
    return (
      <>
        <Link href="/auth">
          <Button 
            className="mr-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-900 text-gray-900 dark:text-white font-semibold"
          >
            {copy.signIn}
          </Button>
        </Link>
        <Link href="/auth?tab=register">
          <Button 
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
          >
            {copy.signUp}
          </Button>
        </Link>
      </>
    );
  }

  return (
    <div>
      <span>{user.email}</span>
    </div>
  );
}
