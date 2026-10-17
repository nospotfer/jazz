import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import Link from "next/link";
import { HeaderNav } from "./header-nav";
import { UserNav } from "./user-nav";
import { UserNavClient } from "./user-nav-client";

interface HeaderProps {
  authMode?: "auto" | "guest";
}

export const Header = ({ authMode = "auto" }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-black/95 backdrop-blur border-b border-[var(--color-jazz-title-accent)]/80">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-2 gap-y-2 px-4 py-2 sm:gap-x-3 sm:px-6 xl:h-16 xl:flex-nowrap xl:px-8 xl:py-0">
        <Link href="/" className="order-1 flex min-h-11 shrink-0 items-center gap-2">
          <div className="relative w-9 h-9">
            <Image
              src="/images/logo-mark.png"
              alt="La Cultura del Jazz"
              fill
              sizes="36px"
              className="rounded-sm object-contain"
            />
          </div>
          <span className="hidden text-sm font-bold text-gray-900 dark:text-white sm:inline">
            La Cultura del Jazz
          </span>
        </Link>

        <HeaderNav />

        <div className="order-3 ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <LanguageSelector />
        </div>
        <div className="order-5 ml-auto flex min-h-11 items-center gap-2 xl:order-4 xl:ml-0">
          {authMode === "guest" ? (
            <UserNavClient user={undefined} />
          ) : (
            <UserNav />
          )}
        </div>
      </div>
    </header>
  );
};
