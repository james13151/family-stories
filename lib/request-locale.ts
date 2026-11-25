import { cookies, headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { isLocale, negotiateLocale, type Locale } from "@/lib/locale";
import { LOCALE_COOKIE } from "@/lib/session-token";

export async function getRequestLocale(): Promise<Locale> {
  const user = await getCurrentUser();
  if (user && isLocale(user.locale)) return user.locale;
  const jar = await cookies();
  const saved = jar.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return negotiateLocale((await headers()).get("accept-language"));
}

export async function getRequestDictionary() {
  const locale = await getRequestLocale();
  return { locale, dict: getDictionary(locale) };
}
