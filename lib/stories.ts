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

// The transcript is saved text. A recording that still exists owns the current
// transcript. After that file is removed, the copy kept on the story remains.
export function keptTranscript(saved: string, recording: string | null | undefined) {
  if (recording && recording.trim()) return recording;
  return saved || "";
}
