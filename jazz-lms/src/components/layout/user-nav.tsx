import { createClient } from '@/utils/supabase/server';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { LogoutButton } from './logout-button';
import { UserNavClient } from './user-nav-client';
import { getCurrentUser } from '@/lib/admin';
import Link from 'next/link';
import { isAdminRole } from '@/lib/admin/permissions';
import { resolveProfileAvatar } from '@/lib/profile-avatars';

export const UserNav = async () => {
  const supabase = createClient();

  try {
    await supabase.auth.refreshSession();
  } catch {
    // Ignore refresh errors and fallback to current session
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <UserNavClient user={undefined} />;
  }

  // Verificar se o usuário é admin
  const dbUser = await getCurrentUser();
  const isAdmin = isAdminRole(dbUser?.role);
  const avatarUrl = resolveProfileAvatar(user.id, user.user_metadata?.avatar_url);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt="User avatar" />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.user_metadata.full_name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {isAdmin && (
              <p className="text-xs font-semibold text-yellow-500 mt-1">
                🔑 Administrator
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="cursor-pointer">
            🎓 My Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="cursor-pointer">
            👤 Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="cursor-pointer">
            ⚙️ Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                🔐 Admin Intranet
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem>
          <LogoutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
