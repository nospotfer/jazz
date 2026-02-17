'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/utils/supabase/client';

export default function AuthPage() {
  const supabase = createClient();
  return (
    <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-full max-w-md p-8 space-y-8 bg-card border border-border rounded-xl shadow-lg">
            <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#FBBF24',
                        brandAccent: '#F59E0B',
                        inputBackground: '#1f2937',
                        inputBorder: '#374151',
                        inputBorderHover: '#FBBF24',
                        inputBorderFocus: '#FBBF24',
                        inputText: '#ffffff',
                        inputPlaceholder: '#9CA3AF',
                        messageText: '#D1D5DB',
                        messageTextDanger: '#FCA5A5',
                        anchorTextColor: '#FBBF24',
                        anchorTextHoverColor: '#F59E0B',
                      },
                      space: {
                        inputPadding: '12px',
                        buttonPadding: '12px',
                      },
                      fontSizes: {
                        baseButtonSize: '16px',
                        baseInputSize: '16px',
                      },
                      radii: {
                        borderRadiusButton: '8px',
                        inputBorderRadius: '8px',
                      },
                    },
                  },
                }}
            />
        </div>
    </div>
  );
}
