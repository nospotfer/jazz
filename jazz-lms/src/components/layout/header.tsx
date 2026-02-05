import Link from 'next/link';
import { UserNav } from './user-nav';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-14 items-center justify-center relative px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-center">
            La Cultura del Jazz
          </span>
        </Link>
        <div className="absolute right-4 flex items-center space-x-4">
          <UserNav />
        </div>
      </div>
    </header>
  );
};
