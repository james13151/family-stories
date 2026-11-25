export const LOCALES = ["en", "zh-Hans", "zh-Hant"] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "zh-Hans" || value === "zh-Hant";
}

export function negotiateLocale(header: string | null | undefined): Locale {
  if (!header) return "en";
  const parts = header.split(",").map((part) => part.split(";")[0]?.trim().toLowerCase() || "");
  for (const part of parts) {
    if (part.startsWith("zh")) {
      if (/(hant|tw|hk|mo)/.test(part)) return "zh-Hant";
      return "zh-Hans";
    }
    if (part.startsWith("en")) return "en";
  }
  return "en";
}

export function htmlLang(locale: Locale) {
  if (locale === "zh-Hans") return "zh-CN";
  if (locale === "zh-Hant") return "zh-HK";
  return "en";
}

export function intlLocale(locale: Locale) {
  if (locale === "zh-Hans") return "zh-CN";
  if (locale === "zh-Hant") return "zh-HK";
  return "en-GB";
}

export function formatWhen(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function fillTemplate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] === undefined || vars[key] === null ? "" : String(vars[key]),
  );
}
