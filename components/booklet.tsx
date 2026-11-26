"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/types";
import { fillTemplate } from "@/lib/locale";
import { childThemeLabel, memoryStageLabel } from "@/lib/memory-labels";
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

type Chapter = {
  id: string;
  title: string;
  stories: (BookletStory & { number: number })[];
};

const themeRank = new Map<string, number>([...THEMES, ...CHILD_THEMES].map((theme, index) => [theme, index]));

function personKey(story: BookletStory) {
  if (story.kind !== "child") return "self";
  return `child:${story.childName || "_"}`;
}

export type BookletEdition = {
  title: string;
  subtitle: string;
  author: string;
  dedication: string;
  preface: string;
  chapters: { id: string; title: string; storyIds: string[] }[];
};

export function Booklet({
  dict,
  author,
  compiled,
  stories,
  edition,
}: {
  dict: Dictionary;
  author: string;
  compiled: string;
  stories: BookletStory[];
  edition?: BookletEdition;
}) {
  const [order, setOrder] = useState<"stage" | "theme" | "person">("stage");

  const chapters = useMemo(() => {
    if (edition) {
      const byId = new Map(stories.map((story) => [story.id, story]));
      let number = 0;
      return edition.chapters.flatMap((chapter) => {
        const items = chapter.storyIds.flatMap((id) => {
          const story = byId.get(id);
          if (!story) return [];
          number += 1;
          return [{ ...story, number }];
        });
        if (!items.length) return [];
        return [{ id: chapter.id, title: chapter.title, stories: items }];
      });
    }
    const copy = [...stories];
    copy.sort((a, b) => {
      if (order === "theme") {
        return (themeRank.get(a.theme) ?? 99) - (themeRank.get(b.theme) ?? 99) || stageRank(a.stage) - stageRank(b.stage) || a.createdAt.localeCompare(b.createdAt);
      }
      if (order === "person") {
        const person = personKey(a).localeCompare(personKey(b));
        if (personKey(a) === "self" && personKey(b) !== "self") return -1;
        if (personKey(b) === "self" && personKey(a) !== "self") return 1;
        return person || stageRank(a.stage) - stageRank(b.stage) || a.createdAt.localeCompare(b.createdAt);
      }
      return stageRank(a.stage) - stageRank(b.stage) || a.createdAt.localeCompare(b.createdAt);
    });

    const groups: Chapter[] = [];
    let number = 0;
    for (const story of copy) {
      const id = order === "theme" ? story.theme || "other" : order === "person" ? personKey(story) : story.stage || "across-life";
      const title =
        order === "theme"
          ? story.theme
            ? childThemeLabel(dict, story.theme)
            : dict.booklet.other
          : order === "person"
            ? story.kind === "child"
              ? story.childName
                ? fillTemplate(dict.booklet.forChild, { name: story.childName })
                : dict.booklet.forAChild
              : fillTemplate(dict.booklet.ownLife, { name: author })
            : memoryStageLabel(dict, story.stage || "across-life");
      let chapter = groups.find((item) => item.id === id);
      if (!chapter) {
        chapter = { id, title, stories: [] };
        groups.push(chapter);
      }
      number += 1;
      chapter.stories.push({ ...story, number });
    }
    return groups;
  }, [author, dict, edition, order, stories]);

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
        {edition ? null : ([
          ["stage", dict.booklet.byStage],
          ["theme", dict.booklet.byTheme],
          ["person", dict.booklet.byPerson],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" className={cn("min-h-12 rounded-full border px-4 text-base", order === id ? "border-[#8d3b2e] bg-[#8d3b2e] text-[#fffaf3]" : "border-[#e0d3bf] bg-[#fffaf3]")} aria-pressed={order === id} onClick={() => setOrder(id)}>
            {label}
          </button>
        ))}
        <Button type="button" variant="outline" className="h-12 px-5" onClick={() => window.print()}>{dict.booklet.print}</Button>
      </div>

      <header className="booklet-leaf booklet-cover book-sheet flex min-h-[70vh] flex-col items-center justify-center px-8 py-16 text-center">
        <p className="text-sm tracking-[0.28em] text-[#8d3b2e]">{dict.booklet.coverKicker}</p>
        <h2 className="mt-6 text-5xl leading-tight">{edition?.title.trim() || dict.booklet.coverTitle}</h2>
        <p className="mt-4 text-xl text-[#4d4032]">{edition?.subtitle.trim() || dict.booklet.coverSubtitle}</p>
        <div className="my-8 h-px w-16 bg-[#a6844a]" />
        <p className="text-lg">{fillTemplate(dict.booklet.coverBy, { name: edition?.author.trim() || author })}</p>
        <p className="mt-2 text-[#6d5e4c]">{compiled}</p>
      </header>

      {edition?.dedication.trim() ? (
        <section className="booklet-leaf book-sheet mt-6 flex min-h-[40vh] items-center justify-center p-10 text-center">
          <p className="max-w-md whitespace-pre-wrap text-xl leading-relaxed">{edition.dedication.trim()}</p>
        </section>
      ) : null}
      {edition?.preface.trim() ? (
        <section className="booklet-leaf book-sheet mt-6 p-6 sm:p-10">
          <div className="max-w-2xl whitespace-pre-wrap text-lg leading-relaxed">{edition.preface.trim()}</div>
        </section>
      ) : null}

      <nav className="booklet-leaf booklet-toc book-sheet mt-6 p-6 sm:p-10" aria-label={dict.booklet.contents}>
        <h2 className="text-3xl">{dict.booklet.contents}</h2>
        <ol className="mt-6 space-y-6">
          {chapters.map((chapter, index) => (
            <li key={chapter.id}>
              <a href={`#chapter-${chapter.id}`} className="text-xl">
                <span className="text-[#8d3b2e]">{fillTemplate(dict.booklet.chapter, { number: index + 1 })}</span>
                <span className="mx-2 text-[#a6844a]">·</span>
                {chapter.title}
              </a>
              <ol className="mt-2 space-y-1 pl-1">
                {chapter.stories.map((story) => (
                  <li key={story.id}>
                    <a href={`#story-${story.id}`} className="flex gap-3 text-lg">
                      <span className="w-8 shrink-0 text-[#6d5e4c]">{story.number}</span>
                      <span>
                        {story.title || story.question}
                        <span className="mt-0.5 block text-sm text-[#6d5e4c]">{story.when}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      </nav>

      {chapters.map((chapter, index) => (
        <section key={chapter.id}>
          <header id={`chapter-${chapter.id}`} className="booklet-leaf booklet-chapter book-sheet mt-6 flex min-h-[70vh] flex-col items-center justify-center px-8 py-16 text-center">
            <p className="text-sm tracking-[0.22em] text-[#8d3b2e]">{fillTemplate(dict.booklet.chapter, { number: index + 1 })}</p>
            <div className="my-6 h-px w-16 bg-[#a6844a]" />
            <h2 className="text-4xl leading-tight">{chapter.title}</h2>
            <p className="mt-4 text-[#6d5e4c]">{fillTemplate(dict.booklet.pieces, { count: chapter.stories.length })}</p>
          </header>
          {chapter.stories.map((story) => {
            const clean = sanitizeStoryHtml(story.bodyHtml);
            return (
              <article key={story.id} id={`story-${story.id}`} className="booklet-leaf booklet-story book-sheet mt-6 p-6 sm:p-10">
                <p className="text-sm tracking-wide text-[#8d3b2e]">{story.number}</p>
                <h3 className="mt-2 text-3xl leading-tight">{story.title || story.question}</h3>
                <p className="memoir-kicker mt-2 text-[#6d5e4c]">
                  {story.when}
                  {story.kind === "child" ? ` · ${story.childName ? fillTemplate(dict.booklet.forChild, { name: story.childName }) : dict.booklet.forAChild}` : ""}
                </p>
                {story.question && story.question !== story.title ? <p className="mt-4 text-lg text-[#4d4032]">{story.question}</p> : null}
                {clean ? <div className="book-page book-size-md book-relaxed mt-5" dangerouslySetInnerHTML={{ __html: clean }} /> : null}
                {story.photos.length ? (
                  <div className="mt-6 space-y-5">
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
        </section>
      ))}
    </div>
  );
}
