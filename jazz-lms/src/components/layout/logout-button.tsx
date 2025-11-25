'use client';
import { createClient } from '@/utils/supabase/client';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const LogoutButton = () => {
  const router = useRouter();
  const supabase = createClient();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };
  return (
    <button
      onClick={handleLogout}
      className="flex items-center w-full text-left"
    >
      <LogOut className="mr-2 h-4 w-4" />
      <span>Log out</span>
    </button>
  );
};
