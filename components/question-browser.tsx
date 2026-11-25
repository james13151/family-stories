"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { themeLabel } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/types";
import type { PersonalizedQuestion } from "@/lib/questions/personalize";
import { THEMES } from "@/lib/questions/types";
import { cn } from "cn";

export function QuestionBrowser({
  dict,
  cards,
}: {
  dict: Dictionary;
  cards: (PersonalizedQuestion & { answered: boolean })[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState("all");
  const [showSkipped, setShowSkipped] = useState(false);
  const [pending, setPending] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return cards.filter((card) => {
      if (theme !== "all" && card.theme !== theme) return false;
      if (!needle) return true;
      return card.text.toLowerCase().includes(needle);
    });
  }, [cards, query, theme]);

  const suggested = filtered.filter((card) => card.suggested && !card.hidden).slice(0, 8);
  const suggestedIds = new Set(suggested.map((card) => card.id));
  const rest = filtered.filter((card) => !card.hidden && !suggestedIds.has(card.id));
  const skipped = showSkipped ? filtered.filter((card) => card.hidden) : [];
  const hiddenCount = cards.filter((card) => card.hidden).length;

  async function start(id: string) {
    setPending(id);
    const response = await fetch("/api/stories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ questionId: id }),
    });
    const payload = (await response.json()) as { id?: string };
    if (!response.ok || !payload.id) {
      setPending("");
      return;
    }
    router.push(`/stories/${payload.id}/edit`);
  }

  function Section({ title, items }: { title: string; items: typeof cards }) {
    if (!items.length) return null;
    return (
      <section className="mt-8">
        <h2 className="text-2xl">{title}</h2>
        <div className="mt-3 space-y-3">
          {items.map((card) => (
            <article key={card.id} className="book-sheet p-4 sm:p-5">
              <p className="text-sm text-[#6d5e4c]">{themeLabel(dict, card.theme)}</p>
              <p className="mt-1 text-xl leading-snug">{card.text}</p>
              {card.personalized ? <p className="mt-2 text-sm text-[#3d5c4b]">{dict.questions.personalized}</p> : null}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button type="button" className="h-12 px-5 text-base" disabled={pending === card.id} onClick={() => void start(card.id)}>
                  {dict.questions.start}
                </Button>
                {card.answered ? <span className="text-sm text-[#6d5e4c]">{dict.questions.answered}</span> : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div>
      <Input className="h-12 px-4 text-lg md:text-lg" value={query} placeholder={dict.questions.search} onChange={(event) => setQuery(event.target.value)} aria-label={dict.questions.search} />
      <label className="mt-3 block text-sm text-[#6d5e4c]">
        {dict.questions.allThemes}
        <select className="mt-1 h-12 w-full rounded-xl border border-[#e0d3bf] bg-white px-3 text-base text-[#2a2218]" value={theme} onChange={(event) => setTheme(event.target.value)}>
          <option value="all">{dict.questions.allThemes}</option>
          {THEMES.map((item) => (
            <option key={item} value={item}>{themeLabel(dict, item)}</option>
          ))}
        </select>
      </label>
      {hiddenCount ? (
        <button type="button" className={cn("mt-3 min-h-11 text-base underline decoration-[#a6844a] underline-offset-4")} onClick={() => setShowSkipped((value) => !value)}>
          {showSkipped ? dict.questions.hideSkipped : dict.questions.showSkipped}
        </button>
      ) : null}
      <Section title={dict.questions.suggested} items={suggested} />
      <Section title={dict.questions.more} items={rest} />
      <Section title={dict.questions.skipped} items={skipped} />
      {!suggested.length && !rest.length && !skipped.length ? <p className="mt-8 text-lg">{dict.questions.none}</p> : null}
    </div>
  );
}
