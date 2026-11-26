"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/types";
import { fillTemplate } from "@/lib/locale";

const PASSED_KEY = "hl-passed-home";
const REMIND_KEY = "hl-remind";

type Suggestion = { id: string; text: string; personalized: boolean };

export function HomePrompt({
  dict,
  due,
  promptsLeft,
  nextDateLabel,
  nextPromptAt,
  suggestions,
}: {
  dict: Dictionary;
  due: boolean;
  promptsLeft: number;
  nextDateLabel: string;
  nextPromptAt: string | null;
  suggestions: Suggestion[];
}) {
  const router = useRouter();
  const [passed, setPassed] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [remindNote, setRemindNote] = useState("");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PASSED_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as unknown;
        if (Array.isArray(parsed)) setPassed(parsed.filter((item) => typeof item === "string"));
      }
    } catch {
      sessionStorage.removeItem(PASSED_KEY);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (localStorage.getItem(REMIND_KEY) !== "1") return;
    void scheduleReminder({ dict, nextPromptAt, question: suggestions[0]?.text, ask: false }).then((note) => {
      if (note) setRemindNote(note);
    });
  }, [dict, nextPromptAt, ready, suggestions]);

  const remaining = suggestions.filter((item) => !passed.includes(item.id));
  const current = remaining[0] ?? null;

  function remember(ids: string[]) {
    sessionStorage.setItem(PASSED_KEY, JSON.stringify(ids));
    setPassed(ids);
  }

  async function start(id: string) {
    setPending(true);
    const response = await fetch("/api/stories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ questionId: id }),
    });
    const payload = (await response.json()) as { id?: string };
    if (!response.ok || !payload.id) {
      setPending(false);
      return;
    }
    router.push(`/stories/${payload.id}/edit`);
  }

  async function remind() {
    const note = await scheduleReminder({ dict, nextPromptAt, question: current?.text, ask: true });
    setRemindNote(note);
  }

  return (
    <section className="book-sheet mt-4 p-6 sm:p-8">
      {due && current ? (
        <>
          <p className="text-sm tracking-wide text-[#8d3b2e]">{dict.home.dueTitle}</p>
          {promptsLeft > 1 ? <p className="mt-2 text-[#6d5e4c]">{fillTemplate(dict.home.readyCount, { count: promptsLeft })}</p> : null}
          <h1 className="mt-3 text-3xl leading-snug sm:text-4xl">{current.text}</h1>
          {current.personalized ? <p className="mt-3 text-sm text-[#3d5c4b]">{dict.questions.personalized}</p> : null}
          <p className="mt-3 text-lg text-[#4d4032]">{dict.home.dueBody}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" className="h-14 px-6 text-lg" disabled={pending} onClick={() => void start(current.id)}>
              {dict.questions.start}
            </Button>
            <Button type="button" variant="outline" className="h-14 px-6 text-lg" disabled={pending || remaining.length < 2} onClick={() => remember([...passed, current.id])}>
              {dict.home.another}
            </Button>
            <Link href="/questions" className="inline-flex h-14 items-center rounded-2xl border border-[#e0d3bf] bg-white px-6 text-lg">
              {dict.home.choose}
            </Link>
          </div>
        </>
      ) : due ? (
        <>
          <h1 className="text-3xl leading-snug sm:text-4xl">{dict.home.passedAll}</h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="outline" className="h-14 px-6 text-lg" onClick={() => remember([])}>
              {dict.home.seePassed}
            </Button>
            <Link href="/questions" className="inline-flex h-14 items-center rounded-2xl bg-[#8d3b2e] px-6 text-lg text-[#fffaf3]">
              {dict.home.choose}
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl leading-snug sm:text-4xl">{fillTemplate(dict.home.notDueTitle, { date: nextDateLabel })}</h1>
          <p className="mt-3 text-lg text-[#4d4032]">{dict.home.notDueBody}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/questions" className="inline-flex h-14 items-center rounded-2xl bg-[#8d3b2e] px-6 text-lg text-[#fffaf3]">
              {dict.home.writeAnyway}
            </Link>
          </div>
        </>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/children" className="inline-flex h-14 items-center rounded-2xl border border-[#e0d3bf] bg-white px-6 text-lg">
          {dict.child.title}
        </Link>
        <Link href="/book" className="inline-flex h-14 items-center rounded-2xl border border-[#e0d3bf] bg-white px-6 text-lg">
          {dict.booklet.open}
        </Link>
        <Button type="button" variant="outline" className="h-14 px-6 text-lg" onClick={() => void remind()}>
          {dict.home.remind}
        </Button>
      </div>
      {remindNote ? <p className="mt-4 text-[#6d5e4c]">{remindNote}</p> : null}
    </section>
  );
}

async function scheduleReminder({
  dict,
  nextPromptAt,
  question,
  ask,
}: {
  dict: Dictionary;
  nextPromptAt: string | null;
  question?: string;
  ask: boolean;
}) {
  const when = nextPromptAt ? new Date(nextPromptAt) : null;
  const future = when && when.getTime() > Date.now() + 15_000 ? when : null;
  const body = question && question.length < 140 ? question : dict.home.remindBody;

  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      if (ask) {
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display !== "granted") return dict.home.remindDenied;
        localStorage.setItem(REMIND_KEY, "1");
      } else if (localStorage.getItem(REMIND_KEY) !== "1") {
        return "";
      }
      const pending = await LocalNotifications.checkPermissions();
      if (pending.display !== "granted") return "";
      await LocalNotifications.cancel({ notifications: [{ id: 41024 }] });
      if (future) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 41024,
              title: dict.meta.appNameZh,
              body,
              schedule: { at: future, allowWhileIdle: true },
              extra: { path: "/home" },
            },
          ],
        });
        return fillTemplate(dict.home.remindSet, { date: future.toLocaleDateString() });
      }
      return dict.home.remindReady;
    }
  } catch {
    // The website, or an older APK without the local notification plugin.
  }

  if (!ask) return "";
  if (typeof Notification === "undefined") return dict.home.remindWeb;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return dict.home.remindDenied;
  localStorage.setItem(REMIND_KEY, "1");
  if (future) {
    window.setTimeout(() => {
      new Notification(dict.meta.appNameZh, { body });
    }, future.getTime() - Date.now());
  }
  return dict.home.remindWeb;
}
