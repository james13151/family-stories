"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { locationLabel, stageLabel, themeLabel } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/types";
import type { PersonalizedQuestion } from "@/lib/questions/personalize";
import { LIFE_STAGES, LOCATIONS, THEMES, type Location, type Theme } from "@/lib/questions/types";
import { cn } from "cn";

type Card = PersonalizedQuestion & { answered: boolean };
type Mode = "theme" | "time" | "place";

const chipClass =
  "min-h-11 rounded-full border px-3 py-2 text-base transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6844a]";

export function QuestionBrowser({
  dict,
  cards,
}: {
  dict: Dictionary;
  cards: Card[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("theme");
  const [filter, setFilter] = useState("all");
  const [showSkipped, setShowSkipped] = useState(false);
  const [pending, setPending] = useState("");

  const hiddenCount = cards.filter((card) => card.hidden).length;

  const view = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = cards.filter((card) => {
      if (needle && !card.text.toLowerCase().includes(needle)) return false;
      if (mode === "place" && card.locations.length === 0) return false;
      if (filter === "all") return true;
      if (mode === "theme") return card.categories.includes(filter as Theme);
      if (mode === "time") return card.stage === filter;
      return card.locations.includes(filter as Location);
    });
    const visible = matched.filter((card) => !card.hidden);
    const suggested = mode === "theme" ? visible.filter((card) => card.suggested).slice(0, 8) : [];
    const suggestedIds = new Set(suggested.map((card) => card.id));
    const rest = visible.filter((card) => !suggestedIds.has(card.id));
    const skipped = showSkipped ? matched.filter((card) => card.hidden) : [];
    const byOrder = (a: Card, b: Card) => a.order - b.order;
    const groups =
      mode === "time"
        ? LIFE_STAGES.map((stage) => ({
            id: stage,
            title: stageLabel(dict, stage),
            items: rest.filter((card) => card.stage === stage).sort(byOrder),
          }))
        : mode === "place"
          ? LOCATIONS.map((location) => ({
              id: location,
              title: locationLabel(dict, location),
              items: rest.filter((card) => card.locations.includes(location)).sort(byOrder),
            }))
          : THEMES.map((theme) => ({
              id: theme,
              title: themeLabel(dict, theme),
              items: rest.filter((card) => card.categories.includes(theme)).sort(byOrder),
            }));

    return {
      suggested,
      skipped,
      groups: groups.filter((group) => group.items.length > 0),
    };
  }, [cards, dict, filter, mode, query, showSkipped]);

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

  function categoryLine(card: Card) {
    return card.categories.map((theme) => themeLabel(dict, theme)).join(" · ");
  }

  function Questions({ items, groupId }: { items: Card[]; groupId: string }) {
    return (
      <div className="mt-3 space-y-3">
        {items.map((card) => (
          <article key={`${groupId}-${card.id}`} className="book-sheet p-4 sm:p-5">
            <p className="text-sm text-[#6d5e4c]">{categoryLine(card)}</p>
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
    );
  }

  const modes: { id: Mode; label: string }[] = [
    { id: "theme", label: dict.questions.byTheme },
    { id: "time", label: dict.questions.byTime },
    { id: "place", label: dict.questions.byPlace },
  ];
  const lead =
    mode === "time" ? dict.questions.browseTime : mode === "place" ? dict.questions.browsePlaces : dict.questions.browseThemes;
  const options =
    mode === "time"
      ? LIFE_STAGES.map((id) => ({ id, label: stageLabel(dict, id) }))
      : mode === "place"
        ? LOCATIONS.map((id) => ({ id, label: locationLabel(dict, id) }))
        : THEMES.map((id) => ({ id, label: themeLabel(dict, id) }));
  const allLabel =
    mode === "time" ? dict.questions.allStages : mode === "place" ? dict.questions.allPlaces : dict.questions.allThemes;

  return (
    <div>
      <Input className="h-12 px-4 text-lg md:text-lg" value={query} placeholder={dict.questions.search} onChange={(event) => setQuery(event.target.value)} aria-label={dict.questions.search} />
      <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-[#e0d3bf] bg-[#fffaf3] p-1" role="tablist" aria-label={dict.questions.browseBy}>
        {modes.map((item) => {
          const selected = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={cn(
                "min-h-12 rounded-xl px-2 text-base",
                selected ? "bg-[#8d3b2e] text-[#fffaf3]" : "text-[#2a2218] hover:bg-[#efe4d2]",
              )}
              onClick={() => {
                setMode(item.id);
                setFilter("all");
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-base text-[#6d5e4c]">{lead}</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={allLabel}>
        <button
          type="button"
          className={cn(chipClass, filter === "all" ? "border-[#8d3b2e] bg-[#8d3b2e] text-[#fffaf3]" : "border-[#e0d3bf] bg-[#fffaf3] text-[#2a2218]")}
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          {allLabel}
        </button>
        {options.map((item) => {
          const selected = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={cn(chipClass, selected ? "border-[#8d3b2e] bg-[#8d3b2e] text-[#fffaf3]" : "border-[#e0d3bf] bg-[#fffaf3] text-[#2a2218]")}
              aria-pressed={selected}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {hiddenCount ? (
        <button type="button" className="mt-3 min-h-11 text-base underline decoration-[#a6844a] underline-offset-4" onClick={() => setShowSkipped((value) => !value)}>
          {showSkipped ? dict.questions.hideSkipped : dict.questions.showSkipped}
        </button>
      ) : null}
      {view.suggested.length ? (
        <section className="mt-8">
          <h2 className="text-2xl">{dict.questions.suggested}</h2>
          <Questions items={view.suggested} groupId="suggested" />
        </section>
      ) : null}
      {view.groups.map((group) => (
        <section key={group.id} className="mt-8">
          <h2 className="text-2xl">
            {group.title} <span className="text-base font-normal text-[#6d5e4c]">{group.items.length}</span>
          </h2>
          <Questions items={group.items} groupId={group.id} />
        </section>
      ))}
      {view.skipped.length ? (
        <section className="mt-8">
          <h2 className="text-2xl">{dict.questions.skipped}</h2>
          <Questions items={view.skipped} groupId="skipped" />
        </section>
      ) : null}
      {!view.suggested.length && !view.groups.length && !view.skipped.length ? <p className="mt-8 text-lg">{dict.questions.none}</p> : null}
    </div>
  );
}
