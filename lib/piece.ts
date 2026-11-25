import type { Photo, Story } from "@prisma/client";
import { parseFormat, type StoryFormat } from "@/lib/format";
import type { Locale } from "@/lib/locale";
import { formatWhen } from "@/lib/locale";

export type PieceStory = {
  id: string;
  title: string;
  question: string;
  bodyHtml: string;
  when: string;
  childName: string;
  format: StoryFormat;
  photos: { id: string; caption: string }[];
};

export function toPieceStory(story: Story & { photos: Photo[] }, locale: Locale): PieceStory {
  return {
    id: story.id,
    title: story.title,
    question: story.questionText,
    bodyHtml: story.bodyHtml,
    when: formatWhen(story.createdAt, locale),
    childName: story.childName,
    format: parseFormat(story.formatJson, locale),
    photos: [...story.photos]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => ({ id: photo.id, caption: photo.caption })),
  };
}

export function parseStoryIds(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw.join(",") : raw || "";
  const ids: string[] = [];
  for (const part of value.split(",")) {
    const id = part.trim();
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids.slice(0, 24);
}
