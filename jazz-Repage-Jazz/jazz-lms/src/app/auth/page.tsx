'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/utils/supabase/client';

export default function AuthPage() {
  const supabase = createClient();
  return (
    <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
            <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={['github']}
            />
        </div>
    </div>
  );
}
