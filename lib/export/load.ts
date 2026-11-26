import { accountStoryWhere, assertOneAccount } from "@/lib/account";
import { planAllows } from "@/lib/billing/plans";
import { prisma } from "@/lib/db";
import { buildArchive, buildStoryCsv, buildStoryTxt, storyBody, type ExportMedia, type ExportStory } from "@/lib/export/stories";
import { storageGet } from "@/lib/storage";

const MEDIA_LIMIT = 40_000_000;

export async function loadExport(userId: string) {
  const stories = await prisma.story.findMany({
    where: accountStoryWhere(userId),
    orderBy: { createdAt: "asc" },
    include: {
      audio: true,
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });
  assertOneAccount(stories, userId);
  const memoir = await prisma.memoir.findUnique({ where: { userId } });
  let excluded = new Set<string>();
  if (memoir?.structureJson) {
    try {
      const parsed = JSON.parse(memoir.structureJson) as { excluded?: unknown };
      if (Array.isArray(parsed.excluded)) {
        excluded = new Set(parsed.excluded.filter((id): id is string => typeof id === "string"));
      }
    } catch {
      excluded = new Set();
    }
  }
  const rows: ExportStory[] = stories.map((story) => ({
    userId: story.userId,
    id: story.id,
    createdAt: story.createdAt.toISOString(),
    updatedAt: story.updatedAt.toISOString(),
    kind: story.kind,
    childName: story.childName,
    theme: story.theme,
    stage: story.stage,
    place: story.place,
    title: story.title,
    question: story.questionText,
    body: storyBody(story.bodyHtml),
    transcript: story.audio?.transcript || "",
    inBook: !excluded.has(story.id),
  }));
  return { stories: rows, records: stories };
}

export async function exportText(userId: string, accountName: string, kind: "txt" | "csv") {
  const { stories } = await loadExport(userId);
  const text = kind === "csv" ? buildStoryCsv(userId, stories) : buildStoryTxt(userId, accountName, stories);
  return Buffer.from(text, "utf8");
}

export async function exportArchive(userId: string, accountName: string) {
  const { stories, records } = await loadExport(userId);
  const media: ExportMedia[] = [];
  for (const story of records) {
    for (const photo of story.photos) {
      const bytes = await storageGet(photo.storageKey);
      if (!bytes || bytes.length > MEDIA_LIMIT) continue;
      media.push({ storyId: story.id, kind: "photo", id: photo.id, mimeType: photo.mimeType, caption: photo.caption, bytes });
    }
    if (story.audio) {
      const bytes = await storageGet(story.audio.storageKey);
      if (bytes && bytes.length <= MEDIA_LIMIT) {
        media.push({
          storyId: story.id,
          kind: "audio",
          id: story.audio.id,
          mimeType: story.audio.mimeType,
          caption: "",
          bytes,
        });
      }
    }
  }
  return buildArchive(userId, accountName, stories, media);
}

export function accountMayExport(plan: string | null | undefined) {
  return planAllows(plan, "exports");
}
