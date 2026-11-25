import type { Audio, Photo, Story } from "@prisma/client";
import { parseFormat } from "@/lib/format";

export function serializeStory(
  story: Story & { audio: Audio | null; photos: Photo[] },
  locale: string,
) {
  return {
    id: story.id,
    title: story.title,
    questionId: story.questionId,
    questionText: story.questionText,
    kind: story.kind,
    childName: story.childName,
    bodyHtml: story.bodyHtml,
    format: parseFormat(story.formatJson, locale),
    createdAt: story.createdAt.toISOString(),
    updatedAt: story.updatedAt.toISOString(),
    audio: story.audio
      ? {
          id: story.audio.id,
          mimeType: story.audio.mimeType,
          transcript: story.audio.transcript,
          durationSec: story.audio.durationSec,
        }
      : null,
    photos: [...story.photos]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => ({ id: photo.id, caption: photo.caption })),
  };
}

export type StoryPayload = ReturnType<typeof serializeStory>;
