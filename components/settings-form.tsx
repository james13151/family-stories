"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/lib/i18n/types";
import { fillTemplate, type Locale } from "@/lib/locale";
import { FAMILY_ROLES, OPEN_TOPIC_IDS, SKIP_TOPIC_IDS } from "@/lib/profile";
import { cn } from "cn";

const fieldClass = "h-12 px-4 text-lg md:text-lg";

export function SettingsForm({
  dict,
  email,
  initial,
}: {
  dict: Dictionary;
  email: string;
  initial: {
    name: string;
    locale: Locale;
    familyRole: string;
    childhoodPlace: string;
    placesLived: string;
    occupation: string;
    importantPeople: string;
    hobbies: string;
    openTopics: string[];
    skipTopics: string[];
    frequency: string;
    customIntervalDays: number;
    promptsPerDay: number;
  };
}) {
  const [draft, setDraft] = useState(initial);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  function toggle(list: "openTopics" | "skipTopics", id: string) {
    setDraft((current) => {
      const has = current[list].includes(id);
      return { ...current, [list]: has ? current[list].filter((item) => item !== id) : [...current[list], id] };
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    setPending(false);
    if (!response.ok) {
      setNote(dict.common.error);
      return;
    }
    setNote(dict.settings.saved);
    if (draft.locale !== initial.locale) window.location.reload();
  }

  const roles: Record<string, string> = {
    grandparent: dict.roles.grandparent,
    parent: dict.roles.parent,
    "aunt-or-uncle": dict.roles.aunt,
    spouse: dict.roles.spouse,
    self: dict.roles.self,
  };
  const topics: Record<string, string> = {
    childhood: dict.topics.childhood,
    elders: dict.topics.elders,
    school: dict.topics.school,
    work: dict.topics.work,
    food: dict.topics.food,
    places: dict.topics.places,
    traditions: dict.topics.traditions,
    children: dict.topics.children,
    friendship: dict.topics.friendship,
    objects: dict.topics.objects,
    era: dict.topics.era,
    hobbies: dict.topics.hobbies,
  };
  const skips: Record<string, string> = {
    grief: dict.skips.grief,
    health: dict.skips.health,
    money: dict.skips.money,
    war: dict.skips.war,
    romance: dict.skips.romance,
  };

  return (
    <form className="space-y-8" onSubmit={(event) => void save(event)}>
      <section className="book-sheet space-y-3 p-5">
        <h2 className="text-2xl">{dict.common.language}</h2>
        <p className="text-[#6d5e4c]">{dict.settings.languageHelp}</p>
        <div className="grid gap-2">
          {(["en", "zh-Hans", "zh-Hant"] as Locale[]).map((locale) => (
            <button key={locale} type="button" aria-pressed={draft.locale === locale} className={cn("min-h-12 rounded-2xl border px-4 text-left", draft.locale === locale ? "border-[#8d3b2e] bg-[#fff1ea]" : "border-[#e0d3bf] bg-white")} onClick={() => setDraft({ ...draft, locale })}>
              {locale === "en" ? dict.languages.en : locale === "zh-Hans" ? dict.languages.zhHans : dict.languages.zhHant}
            </button>
          ))}
        </div>
      </section>
      <section className="book-sheet space-y-3 p-5">
        <h2 className="text-2xl">{dict.settings.frequency}</h2>
        <p className="text-[#6d5e4c]">{dict.settings.frequencyHelp}</p>
        {[
          ["daily", dict.frequency.daily, dict.frequency.dailyHelp],
          ["weekly", dict.frequency.weekly, dict.frequency.weeklyHelp],
          ["twice_weekly", dict.frequency.twice, dict.frequency.twiceHelp],
          ["monthly", dict.frequency.monthly, dict.frequency.monthlyHelp],
          ["custom", dict.frequency.custom, dict.frequency.customHelp],
        ].map(([id, label, help]) => (
          <button key={id} type="button" aria-pressed={draft.frequency === id} className={cn("block w-full rounded-2xl border p-4 text-left", draft.frequency === id ? "border-[#8d3b2e] bg-[#fff1ea]" : "border-[#e0d3bf] bg-white")} onClick={() => setDraft({ ...draft, frequency: id })}>
            <span className="block text-lg">{label}</span>
            <span className="text-sm text-[#6d5e4c]">{help}</span>
          </button>
        ))}
        {draft.frequency === "daily" ? (
          <label className="block text-base">
            {dict.frequency.perDay}
            <Input className={`${fieldClass} mt-2`} type="number" min={1} max={5} value={draft.promptsPerDay} aria-label={dict.frequency.perDay} onChange={(event) => setDraft({ ...draft, promptsPerDay: Number(event.target.value) })} />
          </label>
        ) : null}
        {draft.frequency === "custom" ? (
          <Input className={fieldClass} type="number" min={1} max={365} value={draft.customIntervalDays} aria-label={fillTemplate(dict.frequency.every, { count: draft.customIntervalDays })} onChange={(event) => setDraft({ ...draft, customIntervalDays: Number(event.target.value) })} />
        ) : null}
      </section>
      <section className="book-sheet space-y-3 p-5">
        <h2 className="text-2xl">{dict.settings.profile}</h2>
        <p className="text-[#6d5e4c]">{dict.settings.profileHelp}</p>
        <Label htmlFor="name">{dict.common.name}</Label>
        <Input id="name" className={fieldClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        <div className="grid gap-2">
          {FAMILY_ROLES.map((role) => (
            <button key={role} type="button" aria-pressed={draft.familyRole === role} className={cn("min-h-12 rounded-2xl border px-4 text-left", draft.familyRole === role ? "border-[#8d3b2e] bg-[#fff1ea]" : "border-[#e0d3bf] bg-white")} onClick={() => setDraft({ ...draft, familyRole: draft.familyRole === role ? "" : role })}>
              {roles[role]}
            </button>
          ))}
        </div>
        <Label htmlFor="childhood">{dict.onboarding.childhood}</Label>
        <Input id="childhood" className={fieldClass} value={draft.childhoodPlace} onChange={(event) => setDraft({ ...draft, childhoodPlace: event.target.value })} />
        <Label htmlFor="places">{dict.onboarding.places}</Label>
        <Input id="places" className={fieldClass} value={draft.placesLived} onChange={(event) => setDraft({ ...draft, placesLived: event.target.value })} />
        <Label htmlFor="work">{dict.onboarding.occupation}</Label>
        <Input id="work" className={fieldClass} value={draft.occupation} onChange={(event) => setDraft({ ...draft, occupation: event.target.value })} />
        <Label htmlFor="people">{dict.onboarding.people}</Label>
        <Input id="people" className={fieldClass} value={draft.importantPeople} onChange={(event) => setDraft({ ...draft, importantPeople: event.target.value })} />
        <Label htmlFor="hobbies">{dict.onboarding.hobbies}</Label>
        <Input id="hobbies" className={fieldClass} value={draft.hobbies} onChange={(event) => setDraft({ ...draft, hobbies: event.target.value })} />
        <p className="pt-2 font-medium">{dict.onboarding.openTitle}</p>
        <div className="flex flex-wrap gap-2">
          {OPEN_TOPIC_IDS.map((id) => (
            <button key={id} type="button" aria-pressed={draft.openTopics.includes(id)} className={cn("min-h-11 rounded-full border px-4", draft.openTopics.includes(id) ? "border-[#3d5c4b] bg-[#3d5c4b] text-white" : "border-[#e0d3bf] bg-white")} onClick={() => toggle("openTopics", id)}>
              {topics[id]}
            </button>
          ))}
        </div>
        <p className="pt-2 font-medium">{dict.onboarding.skipTitle}</p>
        <div className="flex flex-wrap gap-2">
          {SKIP_TOPIC_IDS.map((id) => (
            <button key={id} type="button" aria-pressed={draft.skipTopics.includes(id)} className={cn("min-h-11 rounded-full border px-4", draft.skipTopics.includes(id) ? "border-[#8d3b2e] bg-[#8d3b2e] text-white" : "border-[#e0d3bf] bg-white")} onClick={() => toggle("skipTopics", id)}>
              {skips[id]}
            </button>
          ))}
        </div>
      </section>
      <section className="book-sheet space-y-2 p-5">
        <h2 className="text-2xl">{dict.settings.account}</h2>
        <p>{email}</p>
        <h2 className="pt-3 text-2xl">{dict.settings.gift}</h2>
        <p className="text-[#6d5e4c]">{dict.settings.giftHelp}</p>
        <Link href="/gift" className="inline-flex h-12 items-center rounded-xl border border-[#e0d3bf] bg-white px-5">{dict.nav.gift}</Link>
      </section>
      {note ? <p>{note}</p> : null}
      <Button type="submit" className="h-12 px-6 text-base" disabled={pending}>{dict.common.save}</Button>
    </form>
  );
}
