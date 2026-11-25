"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fillTemplate, type Locale } from "@/lib/locale";
import type { Dictionary } from "@/lib/i18n/types";
import { childThemeLabel, memoryPlaceLabel, memoryStageLabel } from "@/lib/memory-labels";
import { CHILD_PLACES, CHILD_STAGES, CHILD_THEMES, type ChildPlace, type ChildStage, type ChildTheme } from "@/lib/questions/child";
import { CHILD_QUESTIONS, childQuestionCategories, childQuestionText } from "@/lib/questions/child-bank";
import { cn } from "cn";

type Saved = {
  id: string;
  title: string;
  question: string;
  childName: string;
  when: string;
  theme: string;
  themes: string[];
  stage: string;
  places: string[];
};

const chipClass =
  "min-h-11 rounded-full border px-3 py-2 text-base transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6844a]";

export function ChildMemories({
  dict,
  locale,
  saved,
  answeredIds,
}: {
  dict: Dictionary;
  locale: Locale;
  saved: Saved[];
  answeredIds: string[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [theme, setTheme] = useState<ChildTheme>("everyday");
  const [stage, setStage] = useState<ChildStage>("growing");
  const [place, setPlace] = useState<ChildPlace>("home");
  const [nameError, setNameError] = useState(false);
  const [pending, setPending] = useState("");
  const [mode, setMode] = useState<"theme" | "time" | "place">("theme");
  const [filter, setFilter] = useState("all");

  const answered = useMemo(() => new Set(answeredIds), [answeredIds]);
  const prompts = useMemo(
    () =>
      CHILD_QUESTIONS.map((question) => ({
        id: question.id,
        text: childQuestionText(question.id, locale, name),
        theme: question.theme,
        themes: childQuestionCategories(question),
        stage: question.stage,
        places: question.places ?? [],
      })),
    [locale, name],
  );

  const visiblePrompts = useMemo(() => {
    return prompts.filter((prompt) => {
      if (filter === "all") return true;
      if (mode === "theme") return prompt.themes.includes(filter as ChildTheme);
      if (mode === "time") return prompt.stage === filter;
      return prompt.places.includes(filter as ChildPlace);
    });
  }, [filter, mode, prompts]);

  const visibleSaved = useMemo(() => {
    return saved.filter((memory) => {
      if (mode === "place" && memory.places.length === 0) return false;
      if (filter === "all") return true;
      if (mode === "theme") return memory.themes.includes(filter);
      if (mode === "time") return memory.stage === filter;
      return memory.places.includes(filter);
    });
  }, [filter, mode, saved]);

  const groups = useMemo(() => {
    const source =
      mode === "time"
        ? CHILD_STAGES.map((id) => ({ id, title: memoryStageLabel(dict, id) }))
        : mode === "place"
          ? CHILD_PLACES.map((id) => ({ id, title: memoryPlaceLabel(dict, id) }))
          : CHILD_THEMES.map((id) => ({ id, title: childThemeLabel(dict, id) }));
    return source
      .map((group) => ({
        ...group,
        items: visiblePrompts.filter((prompt) => {
          if (mode === "time") return prompt.stage === group.id;
          if (mode === "place") return prompt.places.includes(group.id as ChildPlace);
          return prompt.themes.includes(group.id as ChildTheme);
        }),
      }))
      .filter((group) => group.items.length);
  }, [dict, mode, visiblePrompts]);

  async function create(body: Record<string, unknown>, key: string) {
    setPending(key);
    const response = await fetch("/api/stories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { id?: string };
    if (!response.ok || !payload.id) {
      setPending("");
      if (response.status === 400) setNameError(true);
      return;
    }
    router.push(`/stories/${payload.id}/edit`);
  }

  function chooseMode(next: "theme" | "time" | "place") {
    setMode(next);
    setFilter("all");
  }

  const options =
    mode === "time"
      ? CHILD_STAGES.map((id) => ({ id, label: memoryStageLabel(dict, id) }))
      : mode === "place"
        ? CHILD_PLACES.map((id) => ({ id, label: memoryPlaceLabel(dict, id) }))
        : CHILD_THEMES.map((id) => ({ id, label: childThemeLabel(dict, id) }));
  const allLabel = mode === "time" ? dict.child.allStages : mode === "place" ? dict.child.allPlaces : dict.child.allThemes;

  return (
    <div>
      <section className="book-sheet p-5 sm:p-6">
        <label className="block text-sm text-[#6d5e4c]">
          {dict.child.name}
          <Input className="mt-1 h-12 px-4 text-lg md:text-lg" value={name} placeholder={dict.child.namePh} onChange={(event) => { setName(event.target.value); setNameError(false); }} />
        </label>
        <p className="mt-4 text-base text-[#6d5e4c]">{dict.child.blankHelp}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-[#6d5e4c]">
            {dict.child.byTheme}
            <select className="mt-1 h-12 w-full rounded-xl border border-[#e0d3bf] bg-white px-3 text-base text-[#2a2218]" value={theme} onChange={(event) => setTheme(event.target.value as ChildTheme)}>
              {CHILD_THEMES.map((id) => <option key={id} value={id}>{childThemeLabel(dict, id)}</option>)}
            </select>
          </label>
          <label className="text-sm text-[#6d5e4c]">
            {dict.child.byTime}
            <select className="mt-1 h-12 w-full rounded-xl border border-[#e0d3bf] bg-white px-3 text-base text-[#2a2218]" value={stage} onChange={(event) => setStage(event.target.value as ChildStage)}>
              {CHILD_STAGES.map((id) => <option key={id} value={id}>{memoryStageLabel(dict, id)}</option>)}
            </select>
          </label>
          <label className="text-sm text-[#6d5e4c]">
            {dict.child.byPlace}
            <select className="mt-1 h-12 w-full rounded-xl border border-[#e0d3bf] bg-white px-3 text-base text-[#2a2218]" value={place} onChange={(event) => setPlace(event.target.value as ChildPlace)}>
              {CHILD_PLACES.map((id) => <option key={id} value={id}>{memoryPlaceLabel(dict, id)}</option>)}
            </select>
          </label>
        </div>
        {nameError ? <p className="mt-3 text-[#8d3b2e]">{dict.child.nameNeeded}</p> : null}
        <Button type="button" className="mt-4 h-12 px-5 text-base" disabled={pending === "free"} onClick={() => void create({ free: true, childName: name, theme, stage, place }, "free")}>
          {dict.child.blank}
        </Button>
      </section>

      <div className="mt-6 grid grid-cols-3 gap-1 rounded-2xl border border-[#e0d3bf] bg-[#fffaf3] p-1" role="tablist" aria-label={dict.questions.browseBy}>
        {([
          ["theme", dict.child.byTheme],
          ["time", dict.child.byTime],
          ["place", dict.child.byPlace],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} className={cn("min-h-12 rounded-xl px-2 text-base", mode === id ? "bg-[#8d3b2e] text-[#fffaf3]" : "text-[#2a2218] hover:bg-[#efe4d2]")} onClick={() => chooseMode(id)}>
            {label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-base text-[#6d5e4c]">{dict.child.promptsLead}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={cn(chipClass, filter === "all" ? "border-[#8d3b2e] bg-[#8d3b2e] text-[#fffaf3]" : "border-[#e0d3bf] bg-[#fffaf3]")} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>{allLabel}</button>
        {options.map((item) => (
          <button key={item.id} type="button" className={cn(chipClass, filter === item.id ? "border-[#8d3b2e] bg-[#8d3b2e] text-[#fffaf3]" : "border-[#e0d3bf] bg-[#fffaf3]")} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-2xl">{dict.child.saved}</h2>
        {visibleSaved.length ? (
          <div className="mt-3 space-y-3">
            {visibleSaved.map((memory) => (
              <Link key={memory.id} href={`/stories/${memory.id}`} className="book-sheet block p-4">
                <p className="text-sm text-[#6d5e4c]">
                  {memory.childName ? fillTemplate(dict.child.forChild, { name: memory.childName }) : memoryStageLabel(dict, memory.stage)}
                  {" · "}
                  {childThemeLabel(dict, memory.theme)}
                  {memory.places[0] ? ` · ${memoryPlaceLabel(dict, memory.places[0])}` : ""}
                  {" · "}
                  {memory.when}
                </p>
                <p className="mt-1 text-xl">{memory.title || memory.question}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[#6d5e4c]">{dict.child.savedEmpty}</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl">{dict.child.prompts}</h2>
        {groups.map((group) => (
          <div key={group.id} className="mt-6">
            <h3 className="text-xl">{group.title} <span className="text-base font-normal text-[#6d5e4c]">{group.items.length}</span></h3>
            <div className="mt-3 space-y-3">
              {group.items.map((prompt) => (
                <article key={`${group.id}-${prompt.id}`} className="book-sheet p-4 sm:p-5">
                  <p className="text-sm text-[#6d5e4c]">{prompt.themes.map((item) => childThemeLabel(dict, item)).join(" · ")}</p>
                  <p className="mt-1 text-xl leading-snug">{prompt.text}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Button type="button" className="h-12 px-5 text-base" disabled={pending === prompt.id} onClick={() => void create({ questionId: prompt.id, childName: name }, prompt.id)}>
                      {dict.questions.start}
                    </Button>
                    {answered.has(prompt.id) ? <span className="text-sm text-[#6d5e4c]">{dict.questions.answered}</span> : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
        {!groups.length ? <p className="mt-4 text-lg">{dict.questions.none}</p> : null}
      </section>
    </div>
  );
}
