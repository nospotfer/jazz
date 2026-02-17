import Link from 'next/link';
import Image from 'next/image';
import { UserNav } from './user-nav';
import { ThemeToggle } from '@/components/theme-toggle';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-black/95 backdrop-blur border-b border-yellow-500">
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          <div className="relative w-10 h-10">
            <Image
              src="/images/Logo.jpeg"
              alt="La Cultura del Jazz"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-bold text-gray-900 dark:text-white hidden sm:inline text-sm">
            La Cultura del Jazz
          </span>
        </Link>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
};
