"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/lib/i18n/types";
import { fillTemplate } from "@/lib/locale";

export function StoryList({
  dict,
  stories,
}: {
  dict: Dictionary;
  stories: {
    id: string;
    title: string;
    question: string;
    excerpt: string;
    when: string;
    childName: string;
    hasAudio: boolean;
    photoCount: number;
    photoId: string | null;
  }[];
}) {
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return stories;
    return stories.filter((story) => `${story.title} ${story.question} ${story.excerpt}`.toLowerCase().includes(needle));
  }, [query, stories]);

  if (!stories.length) {
    return (
      <div className="book-sheet p-8">
        <h2 className="text-2xl">{dict.stories.emptyTitle}</h2>
        <p className="mt-2 text-[#6d5e4c]">{dict.stories.emptyBody}</p>
        <Link href="/questions" className="mt-4 inline-flex h-12 items-center rounded-xl bg-[#8d3b2e] px-5 text-[#fffaf3]">{dict.home.choose}</Link>
      </div>
    );
  }

  return (
    <div>
      <Input className="h-12 px-4 text-lg md:text-lg" value={query} placeholder={dict.stories.search} aria-label={dict.stories.search} onChange={(event) => setQuery(event.target.value)} />
      {chosen.length ? (
        <Link href={`/booklet?ids=${chosen.map(encodeURIComponent).join(",")}`} className="mt-4 inline-flex h-12 items-center rounded-xl bg-[#8d3b2e] px-5 text-[#fffaf3]">
          {fillTemplate(dict.stories.makeSet, { count: chosen.length })}
        </Link>
      ) : null}
      <div className="mt-4 space-y-3">
        {visible.map((story) => (
          <article key={story.id} className="book-sheet p-4">
            <div className="flex gap-3">
              <label className="flex shrink-0 items-start pt-1">
                <input
                  type="checkbox"
                  className="size-5 accent-[#8d3b2e]"
                  checked={chosen.includes(story.id)}
                  aria-label={dict.stories.include}
                  onChange={() => setChosen((current) => current.includes(story.id) ? current.filter((id) => id !== story.id) : [...current, story.id])}
                />
              </label>
              <Link href={`/stories/${story.id}`} className="flex min-w-0 flex-1 gap-4">
                {story.photoId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/media/photo/${story.photoId}`} alt="" className="size-20 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="size-20 shrink-0 rounded-lg bg-[#efe4d2]" />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-[#6d5e4c]">
                    {story.when}
                    {story.childName ? ` · ${story.childName}` : ""}
                  </p>
                  <h2 className="truncate text-xl">{story.title || story.question}</h2>
                  <p className="line-clamp-2 text-[#4d4032]">{story.excerpt || story.question}</p>
                  <p className="mt-1 text-sm text-[#6d5e4c]">
                    {story.hasAudio ? dict.stories.audio : ""}
                    {story.hasAudio && story.photoCount ? " · " : ""}
                    {story.photoCount ? `${dict.stories.photos} ${story.photoCount}` : ""}
                  </p>
                </div>
              </Link>
            </div>
            <Link href={`/stories/${story.id}/booklet`} className="mt-3 inline-flex min-h-11 items-center text-base text-[#8d3b2e] underline decoration-[#a6844a] underline-offset-4">{dict.piece.open}</Link>
          </article>
        ))}
        {!visible.length ? <p>{dict.questions.none}</p> : null}
      </div>
    </div>
  );
}
