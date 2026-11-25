"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatClass, firstLetterIsLatin } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/types";
import { fillTemplate } from "@/lib/locale";
import type { PieceStory } from "@/lib/piece";
import { sanitizeStoryHtml, storyToPlain } from "@/lib/sanitize";

export function PieceBooklet({
  dict,
  author,
  stories,
}: {
  dict: Dictionary;
  author: string;
  stories: PieceStory[];
}) {
  const single = stories.length === 1 ? stories[0] : null;

  if (!stories.length) {
    return (
      <div className="book-sheet p-8">
        <h2 className="text-2xl">{dict.piece.empty}</h2>
        <Link href="/stories" className="mt-4 inline-flex h-12 items-center text-[#8d3b2e] underline decoration-[#a6844a] underline-offset-4">{dict.stories.title}</Link>
      </div>
    );
  }

  return (
    <div className="piece-booklet">
      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <Button type="button" className="h-12 px-5 text-base" onClick={() => window.print()}>{dict.piece.print}</Button>
        <Link href="/book" className="inline-flex h-12 items-center text-[#8d3b2e] underline decoration-[#a6844a] underline-offset-4">{dict.booklet.open}</Link>
      </div>

      <header className="piece-leaf piece-cover book-sheet flex min-h-[70vh] flex-col items-center justify-center px-8 py-16 text-center">
        <p className="text-sm tracking-[0.28em] text-[#8d3b2e]">{dict.booklet.coverKicker}</p>
        <h2 className="mt-6 text-5xl leading-tight">{single ? single.title || single.question : dict.piece.setTitle}</h2>
        {single && single.question && single.question !== single.title ? <p className="mt-4 max-w-md text-xl text-[#4d4032]">{single.question}</p> : null}
        {!single ? <p className="mt-4 text-xl text-[#4d4032]">{dict.piece.setSubtitle}</p> : null}
        <div className="my-8 h-px w-16 bg-[#a6844a]" />
        <p className="text-lg">{fillTemplate(dict.preview.by, { name: author })}</p>
        <p className="mt-2 text-[#6d5e4c]">
          {single ? single.when : stories.map((story) => story.when).filter(Boolean)[0]}
          {single?.childName ? ` · ${fillTemplate(dict.booklet.forChild, { name: single.childName })}` : ""}
        </p>
      </header>

      {stories.length > 1 ? (
        <nav className="piece-leaf book-sheet mt-6 p-6 sm:p-10" aria-label={dict.piece.contents}>
          <h2 className="text-3xl">{dict.piece.contents}</h2>
          <ol className="mt-4 space-y-3">
            {stories.map((story, index) => (
              <li key={story.id}>
                <a href={`#piece-${story.id}`} className="flex gap-3 text-lg">
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
      ) : null}

      {stories.map((story, index) => {
        const clean = sanitizeStoryHtml(story.bodyHtml);
        const plain = storyToPlain(clean);
        return (
          <article key={story.id} id={`piece-${story.id}`} className={`piece-leaf book-sheet mt-6 p-6 sm:p-10 ${formatClass(story.format, firstLetterIsLatin(plain))}`}>
            {stories.length > 1 ? <p className="text-sm tracking-wide text-[#8d3b2e]">{index + 1}</p> : null}
            <h3 className="mt-2 text-3xl leading-tight">{story.title || story.question}</h3>
            <p className="piece-kicker mt-2 text-[#6d5e4c]">
              {fillTemplate(dict.preview.by, { name: author })}
              {" · "}
              {story.when}
              {story.childName ? ` · ${fillTemplate(dict.booklet.forChild, { name: story.childName })}` : ""}
            </p>
            {story.question && story.question !== story.title ? <p className="mt-4 text-lg text-[#4d4032]">{story.question}</p> : null}
            {plain ? <div className="mt-5" dangerouslySetInnerHTML={{ __html: clean }} /> : null}
            {story.photos.length ? (
              <div className="mt-6 space-y-5">
                {story.photos.map((photo) => (
                  <figure key={photo.id} className="piece-photo">
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
