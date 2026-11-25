import type { Metadata } from "next";
import "./fonts";
import "./globals.css";
import { getRequestDictionary } from "@/lib/request-locale";
import { htmlLang } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getRequestDictionary();
  return {
    title: {
      default: `${dict.meta.appNameZh} · ${dict.meta.appName}`,
      template: `%s · ${dict.meta.appName}`,
    },
    description: dict.meta.description,
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale } = await getRequestDictionary();
  const localeClass = locale === "zh-Hant" ? "locale-hant" : locale === "zh-Hans" ? "locale-hans" : "locale-en";
  return (
    <html lang={htmlLang(locale)} className={localeClass}>
      <body>{children}</body>
    </html>
  );
}
