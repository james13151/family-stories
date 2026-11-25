"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/types";
import { fillTemplate } from "@/lib/locale";
import { childThemeLabel, memoryPlaceLabel, memoryStageLabel } from "@/lib/memory-labels";
import { stageRank } from "@/lib/memories";
import { sanitizeStoryHtml } from "@/lib/sanitize";
import { THEMES } from "@/lib/questions/types";
import { CHILD_THEMES } from "@/lib/questions/child";
import { cn } from "cn";

export type BookletStory = {
  id: string;
  title: string;
  question: string;
  bodyHtml: string;
  when: string;
  createdAt: string;
  kind: "life" | "child";
  childName: string;
  theme: string;
  stage: string;
  places: string[];
  photos: { id: string; caption: string }[];
};

export function Booklet({
  dict,
  author,
  stories,
}: {
  dict: Dictionary;
  author: string;
  stories: BookletStory[];
}) {
  const [order, setOrder] = useState<"time" | "stage" | "theme">("time");
  const ordered = useMemo(() => {
    const copy = [...stories];
    if (order === "stage") {
      copy.sort((a, b) => stageRank(a.stage) - stageRank(b.stage) || a.createdAt.localeCompare(b.createdAt));
    } else if (order === "theme") {
      const rank = new Map<string, number>([...THEMES, ...CHILD_THEMES].map((theme, index) => [theme, index]));
      copy.sort((a, b) => (rank.get(a.theme) ?? 99) - (rank.get(b.theme) ?? 99) || a.createdAt.localeCompare(b.createdAt));
    } else {
      copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    return copy;
  }, [order, stories]);

  if (!stories.length) {
    return (
      <div className="book-sheet p-8">
        <h2 className="text-2xl">{dict.booklet.empty}</h2>
        <Link href="/questions" className="mt-4 inline-flex h-12 items-center rounded-xl bg-[#8d3b2e] px-5 text-[#fffaf3]">{dict.booklet.writeFirst}</Link>
      </div>
    );
  }

  return (
    <div className="booklet">
      <div className="no-print mb-6 flex flex-wrap items-center gap-2">
        {([
          ["time", dict.booklet.byTime],
          ["stage", dict.booklet.byStage],
          ["theme", dict.booklet.byTheme],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" className={cn("min-h-12 rounded-full border px-4 text-base", order === id ? "border-[#8d3b2e] bg-[#8d3b2e] text-[#fffaf3]" : "border-[#e0d3bf] bg-[#fffaf3]")} aria-pressed={order === id} onClick={() => setOrder(id)}>
            {label}
          </button>
        ))}
        <Button type="button" variant="outline" className="h-12 px-5" onClick={() => window.print()}>{dict.booklet.print}</Button>
      </div>

      <header className="booklet-leaf booklet-cover book-sheet px-8 py-16 text-center">
        <p className="text-sm tracking-[0.2em] text-[#8d3b2e]">{dict.booklet.coverKicker}</p>
        <h2 className="mt-4 text-4xl">{dict.booklet.coverTitle}</h2>
        <p className="mt-4 text-lg text-[#4d4032]">{fillTemplate(dict.booklet.coverBy, { name: author })}</p>
      </header>

      <nav className="booklet-leaf booklet-toc book-sheet mt-6 p-6 sm:p-8" aria-label={dict.booklet.contents}>
        <h2 className="text-3xl">{dict.booklet.contents}</h2>
        <ol className="mt-4 space-y-2">
          {ordered.map((story, index) => (
            <li key={story.id}>
              <a href={`#story-${story.id}`} className="flex gap-3 text-lg">
                <span className="w-8 text-[#8d3b2e]">{index + 1}</span>
                <span>
                  {story.title || story.question}
                  <span className="mt-0.5 block text-sm text-[#6d5e4c]">
                    {story.when}
                    {story.childName ? ` · ${fillTemplate(dict.booklet.forChild, { name: story.childName })}` : ""}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {ordered.map((story, index) => {
        const clean = sanitizeStoryHtml(story.bodyHtml);
        return (
          <article key={story.id} id={`story-${story.id}`} className="booklet-leaf book-sheet mt-6 p-6 sm:p-10">
            <p className="text-sm text-[#8d3b2e]">{index + 1}</p>
            <h3 className="mt-2 text-3xl leading-tight">{story.title || story.question}</h3>
            <p className="mt-2 text-[#6d5e4c]">
              {story.when}
              {story.childName ? ` · ${fillTemplate(dict.booklet.forChild, { name: story.childName })}` : ""}
              {" · "}
              {memoryStageLabel(dict, story.stage)}
              {story.theme ? ` · ${childThemeLabel(dict, story.theme)}` : ""}
              {story.places[0] ? ` · ${memoryPlaceLabel(dict, story.places[0])}` : ""}
            </p>
            {story.question && story.question !== story.title ? <p className="mt-4 text-lg text-[#4d4032]">{story.question}</p> : null}
            {clean ? <div className="book-page book-size-md book-relaxed mt-5" dangerouslySetInnerHTML={{ __html: clean }} /> : null}
            {story.photos.length ? (
              <div className="mt-6 space-y-4">
                {story.photos.map((photo) => (
                  <figure key={photo.id} className="booklet-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/media/photo/${photo.id}`} alt={photo.caption || ""} />
                    {photo.caption ? <figcaption>{photo.caption}</figcaption> : null}
                  </figure>
                ))}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
