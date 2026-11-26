import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { OpenFromNotification } from "@/components/open-from-notification";
import { SignOutButton } from "@/components/sign-out-button";
import { Lantern, Wordmark } from "@/components/wordmark";
import type { Dictionary } from "@/lib/i18n/types";
import type { Locale } from "@/lib/locale";

export function AppShell({
  locale,
  dict,
  name,
  showNav,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  name: string;
  showNav: boolean;
  children: React.ReactNode;
}) {
  const links = [
    { href: "/home", label: dict.nav.home },
    { href: "/questions", label: dict.nav.questions },
    { href: "/children", label: dict.nav.child },
    { href: "/stories", label: dict.nav.stories },
    { href: "/book", label: dict.nav.book },
    { href: "/settings", label: dict.nav.settings },
  ];

  return (
    <div className="min-h-screen">
      <OpenFromNotification />
      <header className="no-print sticky top-0 z-30 border-b border-[#e0d3bf]/80 bg-[#f3ecdf]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href={showNav ? "/home" : "/onboarding"} className="flex items-center gap-2 text-[#8d3b2e]">
            <Lantern className="size-8" />
            <Wordmark locale={locale} />
          </Link>
          {showNav ? (
            <nav className="ml-6 hidden items-center gap-1 md:flex">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="min-h-11 rounded-full px-3 py-2 text-base hover:bg-[#efe4d2]">
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-[#6d5e4c] sm:inline">{name}</span>
            <LanguageSwitcher locale={locale} dict={dict} />
            <SignOutButton label={dict.nav.signOut} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-44 md:py-10 md:pb-10">{children}</main>
      {showNav ? (
        <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-[#e0d3bf] bg-[#fffaf3] md:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="min-h-14 px-1 py-2 text-center text-sm leading-tight">
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
