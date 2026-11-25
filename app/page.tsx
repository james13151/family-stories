import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Lantern, Wordmark } from "@/components/wordmark";
import { getRequestDictionary } from "@/lib/request-locale";

export default async function LandingPage() {
  const { locale, dict } = await getRequestDictionary();
  const points = [
    [dict.landing.p1t, dict.landing.p1b],
    [dict.landing.p2t, dict.landing.p2b],
    [dict.landing.p3t, dict.landing.p3b],
  ];
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#8d3b2e]">
          <Lantern className="size-9" />
          <Wordmark locale={locale} />
        </div>
        <LanguageSwitcher locale={locale} dict={dict} />
      </header>
      <main className="grid items-center gap-10 py-12 md:grid-cols-[1.2fr_0.8fr] md:py-20">
        <div>
          <p className="text-[#8d3b2e]">{dict.meta.tagline}</p>
          <h1 className="mt-3 max-w-xl text-5xl leading-tight md:text-6xl">{dict.landing.hero}</h1>
          <p className="mt-5 max-w-xl text-lg text-[#4d4032]">{dict.landing.lede}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up" className="inline-flex h-14 items-center rounded-2xl bg-[#8d3b2e] px-6 text-lg text-[#fffaf3]">{dict.landing.signUp}</Link>
            <Link href="/sign-in" className="inline-flex h-14 items-center rounded-2xl border border-[#e0d3bf] bg-[#fffaf3] px-6 text-lg">{dict.landing.signIn}</Link>
          </div>
        </div>
        <div className="book-sheet p-6 sm:p-8">
          <p className="font-book text-2xl text-[#8d3b2e]">家燈</p>
          <p className="mt-4 text-lg leading-relaxed text-[#4d4032]">{dict.landing.note}</p>
        </div>
      </main>
      <section className="grid gap-4 pb-16 md:grid-cols-3">
        {points.map(([title, body]) => (
          <article key={title} className="book-sheet p-5">
            <h2 className="text-2xl">{title}</h2>
            <p className="mt-2 text-[#4d4032]">{body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
