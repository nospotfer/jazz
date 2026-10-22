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
          <Button asChild
            className="min-h-11 bg-gray-200 px-3 font-semibold text-gray-900 hover:bg-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-900"
          >
            <Link href="/auth">
            {copy.signIn}
            </Link>
          </Button>
          <Button asChild
            className="cta-highlight min-h-11 px-3 text-black hover:text-black"
          >
            <Link href="/auth?tab=register">
            {copy.signUp}
            </Link>
          </Button>
      </>
    );
  }

  return (
    <div>
      <span>{user.email}</span>
    </div>
  );
}
