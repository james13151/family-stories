"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/types";
import type { Locale } from "@/lib/locale";
import { cn } from "cn";

const options: { id: Locale; label: keyof Dictionary["languages"] }[] = [
  { id: "en", label: "en" },
  { id: "zh-Hans", label: "zhHans" },
  { id: "zh-Hant", label: "zhHant" },
];

export function LanguageSwitcher({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [pending, setPending] = useState<Locale | null>(null);

  async function choose(next: Locale) {
    if (next === locale || pending) return;
    setPending(next);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    window.location.reload();
  }

  return (
    <div className="flex shrink-0 flex-nowrap gap-0.5 rounded-full bg-[#fffaf3]/80 p-0.5 ring-1 ring-[#e0d3bf]" role="group" aria-label={dict.languages.picker}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => void choose(option.id)}
          aria-pressed={locale === option.id}
          className={cn(
            "min-h-10 whitespace-nowrap rounded-full px-1.5 text-sm sm:px-3",
            locale === option.id ? "bg-[#8d3b2e] text-[#fffaf3]" : "text-[#2a2218] hover:bg-[#efe4d2]",
          )}
        >
          {dict.languages[option.label]}
        </button>
      ))}
    </div>
  );
}
