"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/lib/i18n/types";
import { fillTemplate, type Locale } from "@/lib/locale";
import { OPEN_TOPIC_IDS, SKIP_TOPIC_IDS, FAMILY_ROLES } from "@/lib/profile";
import { cn } from "cn";

const fieldClass = "h-12 px-4 text-lg md:text-lg";

type Draft = {
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

export function OnboardingWizard({
  dict,
  initial,
}: {
  dict: Dictionary;
  initial: Draft;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const total = 7;

  useEffect(() => {
    const saved = sessionStorage.getItem("hl-onboarding");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { step?: number; draft?: Draft };
        if (parsed.draft) setDraft({ ...initial, ...parsed.draft });
        if (typeof parsed.step === "number") setStep(Math.min(parsed.step, total - 1));
      } catch {
        sessionStorage.removeItem("hl-onboarding");
      }
    }
    setReady(true);
    // The saved draft should win over the first server snapshot after a language reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    sessionStorage.setItem("hl-onboarding", JSON.stringify({ step, draft }));
  }, [ready, step, draft]);

  function toggle(list: "openTopics" | "skipTopics", id: string) {
    setDraft((current) => {
      const has = current[list].includes(id);
      return { ...current, [list]: has ? current[list].filter((item) => item !== id) : [...current[list], id] };
    });
  }

  async function finish(override?: Partial<Draft>) {
    setPending(true);
    setError("");
    const payload = { ...draft, ...override, onboarded: true };
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setError(dict.common.error);
      setPending(false);
      return;
    }
    sessionStorage.removeItem("hl-onboarding");
    window.location.href = "/home";
  }

  const roleLabels: Record<string, string> = {
    grandparent: dict.roles.grandparent,
    parent: dict.roles.parent,
    "aunt-or-uncle": dict.roles.aunt,
    spouse: dict.roles.spouse,
    self: dict.roles.self,
  };
  const topicLabels: Record<string, string> = {
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
  const skipLabels: Record<string, string> = {
    grief: dict.skips.grief,
    health: dict.skips.health,
    money: dict.skips.money,
    war: dict.skips.war,
    romance: dict.skips.romance,
  };

  return (
    <div className="book-sheet p-5 sm:p-8">
      <p className="text-sm text-[#6d5e4c]">{fillTemplate(dict.onboarding.progress, { step: step + 1, total })}</p>
      {step === 0 ? (
        <section className="mt-4 space-y-4">
          <h1 className="text-3xl">{dict.onboarding.langTitle}</h1>
          <p className="text-[#6d5e4c]">{dict.onboarding.langBody}</p>
          <div className="grid gap-3">
            {(["en", "zh-Hans", "zh-Hant"] as Locale[]).map((locale) => (
              <button
                key={locale}
                type="button"
                aria-pressed={draft.locale === locale}
                className={cn("min-h-14 rounded-2xl border px-4 text-left text-lg", draft.locale === locale ? "border-[#8d3b2e] bg-[#8d3b2e] text-[#fffaf3]" : "border-[#e0d3bf] bg-white")}
                onClick={() => setDraft({ ...draft, locale })}
              >
                {locale === "en" ? dict.languages.en : locale === "zh-Hans" ? dict.languages.zhHans : dict.languages.zhHant}
              </button>
            ))}
          </div>
        </section>
      ) : null}
      {step === 1 ? (
        <section className="mt-4 space-y-4">
          <h1 className="text-3xl">{dict.onboarding.nameTitle}</h1>
          <p className="text-[#6d5e4c]">{dict.onboarding.nameBody}</p>
          <Label htmlFor="name">{dict.common.name}</Label>
          <Input id="name" className={fieldClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          <h2 className="pt-2 text-2xl">{dict.onboarding.roleTitle}</h2>
          <p className="text-[#6d5e4c]">{dict.onboarding.roleBody}</p>
          <div className="grid gap-2">
            {FAMILY_ROLES.map((role) => (
              <button key={role} type="button" aria-pressed={draft.familyRole === role} className={cn("min-h-12 rounded-2xl border px-4 text-left", draft.familyRole === role ? "border-[#8d3b2e] bg-[#fff1ea]" : "border-[#e0d3bf] bg-white")} onClick={() => setDraft({ ...draft, familyRole: draft.familyRole === role ? "" : role })}>
                {roleLabels[role]}
              </button>
            ))}
          </div>
        </section>
      ) : null}
      {step === 2 ? (
        <section className="mt-4 space-y-4">
          <h1 className="text-3xl">{dict.onboarding.lifeTitle}</h1>
          <p className="text-[#6d5e4c]">{dict.onboarding.lifeBody}</p>
          <Label htmlFor="childhood">{dict.onboarding.childhood}</Label>
          <Input id="childhood" className={fieldClass} placeholder={dict.onboarding.childhoodPh} value={draft.childhoodPlace} onChange={(event) => setDraft({ ...draft, childhoodPlace: event.target.value })} />
          <Label htmlFor="places">{dict.onboarding.places}</Label>
          <Input id="places" className={fieldClass} placeholder={dict.onboarding.placesPh} value={draft.placesLived} onChange={(event) => setDraft({ ...draft, placesLived: event.target.value })} />
          <Label htmlFor="work">{dict.onboarding.occupation}</Label>
          <Input id="work" className={fieldClass} placeholder={dict.onboarding.occupationPh} value={draft.occupation} onChange={(event) => setDraft({ ...draft, occupation: event.target.value })} />
          <p className="text-sm text-[#6d5e4c]">{dict.common.optional}</p>
        </section>
      ) : null}
      {step === 3 ? (
        <section className="mt-4 space-y-4">
          <h1 className="text-3xl">{dict.onboarding.peopleTitle}</h1>
          <p className="text-[#6d5e4c]">{dict.onboarding.peopleBody}</p>
          <Label htmlFor="people">{dict.onboarding.people}</Label>
          <Input id="people" className={fieldClass} placeholder={dict.onboarding.peoplePh} value={draft.importantPeople} onChange={(event) => setDraft({ ...draft, importantPeople: event.target.value })} />
          <Label htmlFor="hobbies">{dict.onboarding.hobbies}</Label>
          <Input id="hobbies" className={fieldClass} placeholder={dict.onboarding.hobbiesPh} value={draft.hobbies} onChange={(event) => setDraft({ ...draft, hobbies: event.target.value })} />
        </section>
      ) : null}
      {step === 4 ? (
        <section className="mt-4 space-y-4">
          <h1 className="text-3xl">{dict.onboarding.openTitle}</h1>
          <p className="text-[#6d5e4c]">{dict.onboarding.openBody}</p>
          <div className="flex flex-wrap gap-2">
            {OPEN_TOPIC_IDS.map((id) => (
              <button key={id} type="button" aria-pressed={draft.openTopics.includes(id)} className={cn("min-h-11 rounded-full border px-4", draft.openTopics.includes(id) ? "border-[#3d5c4b] bg-[#3d5c4b] text-white" : "border-[#e0d3bf] bg-white")} onClick={() => toggle("openTopics", id)}>
                {topicLabels[id]}
              </button>
            ))}
          </div>
        </section>
      ) : null}
      {step === 5 ? (
        <section className="mt-4 space-y-4">
          <h1 className="text-3xl">{dict.onboarding.skipTitle}</h1>
          <p className="text-[#6d5e4c]">{dict.onboarding.skipBody}</p>
          <div className="flex flex-wrap gap-2">
            {SKIP_TOPIC_IDS.map((id) => (
              <button key={id} type="button" aria-pressed={draft.skipTopics.includes(id)} className={cn("min-h-11 rounded-full border px-4", draft.skipTopics.includes(id) ? "border-[#8d3b2e] bg-[#8d3b2e] text-white" : "border-[#e0d3bf] bg-white")} onClick={() => toggle("skipTopics", id)}>
                {skipLabels[id]}
              </button>
            ))}
          </div>
        </section>
      ) : null}
      {step === 6 ? (
        <section className="mt-4 space-y-4">
          <h1 className="text-3xl">{dict.onboarding.freqTitle}</h1>
          <p className="text-[#6d5e4c]">{dict.onboarding.freqBody}</p>
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
              <Input className={`${fieldClass} mt-2`} type="number" min={1} max={5} value={draft.promptsPerDay} onChange={(event) => setDraft({ ...draft, promptsPerDay: Number(event.target.value) })} />
            </label>
          ) : null}
          {draft.frequency === "custom" ? (
            <label className="block text-base">
              {fillTemplate(dict.frequency.every, { count: draft.customIntervalDays })}
              <Input className={`${fieldClass} mt-2`} type="number" min={1} max={365} value={draft.customIntervalDays} onChange={(event) => setDraft({ ...draft, customIntervalDays: Number(event.target.value) })} />
            </label>
          ) : null}
          <div className="rounded-2xl bg-[#efe6d6] p-4">
            <h2 className="text-2xl">{dict.onboarding.doneTitle}</h2>
            <p className="mt-2 text-[#6d5e4c]">{dict.onboarding.doneBody}</p>
          </div>
        </section>
      ) : null}
      {error ? <p className="mt-4 text-[#8d3b2e]">{error}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        {step > 0 ? (
          <Button type="button" variant="outline" className="h-12 px-5 text-base" onClick={() => setStep((value) => value - 1)}>
            {dict.common.back}
          </Button>
        ) : null}
        {step < total - 1 ? (
          <Button
            type="button"
            className="h-12 px-5 text-base"
            onClick={() => {
              if (step !== 0) {
                setStep((value) => value + 1);
                return;
              }
              sessionStorage.setItem("hl-onboarding", JSON.stringify({ step: 1, draft }));
              void fetch("/api/locale", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ locale: draft.locale }),
              }).then(() => window.location.reload());
            }}
          >
            {dict.common.next}
          </Button>
        ) : (
          <Button type="button" className="h-12 px-5 text-base" disabled={pending} onClick={() => void finish()}>
            {dict.onboarding.doneCta}
          </Button>
        )}
        {step > 0 && step < total - 1 ? (
          <Button type="button" variant="ghost" className="h-12 px-5 text-base" onClick={() => setStep((value) => value + 1)}>
            {dict.common.skip}
          </Button>
        ) : null}
        {step > 0 && step < total - 1 ? (
          <Button type="button" variant="ghost" className="h-12 px-5 text-base" disabled={pending} onClick={() => void finish()}>
            {dict.common.skipRest}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
