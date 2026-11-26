import { LanguageSwitcher } from "@/components/language-switcher";
import { SignInForm } from "@/components/auth-forms";
import { Lantern, Wordmark } from "@/components/wordmark";
import { getRequestDictionary } from "@/lib/request-locale";

export default async function SignInPage() {
  const { locale, dict } = await getRequestDictionary();
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#8d3b2e]">
          <Lantern />
          <Wordmark locale={locale} />
        </div>
        <LanguageSwitcher locale={locale} dict={dict} />
      </div>
      <div className="book-sheet p-6 sm:p-8">
        <h1 className="text-4xl">{dict.auth.signInTitle}</h1>
        <p className="mt-2 text-[#6d5e4c]">{dict.auth.signInLead}</p>
        <div className="mt-6">
          <SignInForm dict={dict} />
        </div>
      </div>
    </div>
  );
}
