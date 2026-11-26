import { prisma } from "@/lib/db";
import { fillTemplate } from "@/lib/locale";
import type { Dictionary } from "@/lib/i18n/types";
import { storyMemory } from "@/lib/memories";
import { accountStoryWhere } from "@/lib/account";
import {
  isMemoirGrouping,
  isMemoirTrim,
  mergeStructure,
  parseStructure,
  type MemoirGrouping,
  type MemoirSource,
  type MemoirStructure,
  type MemoirTrim,
} from "@/lib/memoir";
import { isPrintCover, isPrintPaper, type PrintCoverCode, type PrintPaperCode } from "@/lib/print/catalog";
import { memoirChapterTitle } from "@/lib/memoir/labels";
import type { PdfBook } from "@/lib/memoir/render-pdf";
import { storageGet } from "@/lib/storage";

export type MemoirDraft = {
  title: string;
  subtitle: string;
  authorName: string;
  grouping: MemoirGrouping;
  dedication: string;
  preface: string;
  trim: MemoirTrim;
  cover: PrintCoverCode;
  paper: PrintPaperCode;
  structure: MemoirStructure;
};

const PHOTO_LIMIT = 12_000_000;

export async function loadMemoirDraft(userId: string, author: string, dict: Dictionary): Promise<MemoirDraft> {
  const [userStories, memoir] = await Promise.all([
    prisma.story.findMany({ where: accountStoryWhere(userId), orderBy: { createdAt: "asc" } }),
    prisma.memoir.findUnique({ where: { userId } }),
  ]);
  const sources = userStories.map(toSource);
  const saved = memoir ? parseStructure(memoir.structureJson) : null;
  const grouping = memoir && isMemoirGrouping(memoir.grouping) ? memoir.grouping : saved?.grouping || "stage";
  const name = memoir?.authorName.trim() || author;
  const structure = mergeStructure(sources, grouping, saved, (id) => memoirChapterTitle(dict, name, id, grouping));
  return {
    title: memoir?.title || "",
    subtitle: memoir?.subtitle || "",
    authorName: memoir?.authorName || "",
    grouping,
    dedication: memoir?.dedication || "",
    preface: memoir?.preface || "",
    trim: memoir && isMemoirTrim(memoir.trim) ? memoir.trim : "a5",
    cover: memoir && isPrintCover(memoir.cover) ? memoir.cover : "hardcover",
    paper: memoir && isPrintPaper(memoir.paper) ? memoir.paper : "uncoated",
    structure,
  };
}

export async function saveMemoirDraft(userId: string, author: string, dict: Dictionary, draft: MemoirDraft) {
  const stories = await prisma.story.findMany({ where: accountStoryWhere(userId), orderBy: { createdAt: "asc" } });
  const name = draft.authorName.trim() || author;
  const structure = mergeStructure(stories.map(toSource), draft.grouping, draft.structure, (id) => memoirChapterTitle(dict, name, id, draft.grouping));
  const data = {
    title: draft.title.trim(),
    subtitle: draft.subtitle.trim(),
    authorName: draft.authorName.trim(),
    grouping: draft.grouping,
    dedication: draft.dedication.trim(),
    preface: draft.preface.trim(),
    trim: draft.trim,
    cover: draft.cover,
    paper: draft.paper,
    structureJson: JSON.stringify(structure),
  };
  await prisma.memoir.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  return { ...draft, ...data, structure, authorName: data.authorName };
}

export async function composeMemoirPdf(userId: string, author: string, dict: Dictionary, language: string): Promise<PdfBook> {
  const draft = await loadMemoirDraft(userId, author, dict);
  const stories = await prisma.story.findMany({
    where: accountStoryWhere(userId),
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  const byId = new Map(stories.map((story) => [story.id, story]));
  const displayAuthor = draft.authorName.trim() || author;
  const chapters = [];
  for (const chapter of draft.structure.chapters) {
    const items = [];
    for (const id of chapter.storyIds) {
      const story = byId.get(id);
      if (!story) continue;
      const photos = [];
      for (const photo of story.photos) {
        if (!photo.mimeType.includes("jpeg") && !photo.mimeType.includes("jpg") && !photo.mimeType.includes("png")) continue;
        const bytes = await storageGet(photo.storageKey);
        if (!bytes || bytes.length > PHOTO_LIMIT) continue;
        photos.push({ bytes, mimeType: photo.mimeType, caption: photo.caption });
      }
      items.push({
        id: story.id,
        title: story.title,
        question: story.questionText,
        bodyHtml: story.bodyHtml,
        when: story.createdAt.toISOString().slice(0, 10),
        childName: story.childName,
        photos,
      });
    }
    if (items.length) chapters.push({ title: chapter.title, stories: items });
  }
  return {
    title: draft.title.trim() || dict.booklet.coverTitle,
    subtitle: draft.subtitle.trim() || dict.booklet.coverSubtitle,
    author: displayAuthor,
    dedication: draft.dedication,
    preface: draft.preface,
    contentsLabel: dict.booklet.contents,
    chapterLabel: (number) => fillTemplate(dict.booklet.chapter, { number }),
    language,
    trim: draft.trim,
    cover: draft.cover,
    paper: draft.paper,
    chapters,
  };
}

function toSource(story: { id: string; title: string; questionText: string; createdAt: Date; kind: string; childName: string; questionId: string | null; theme: string; stage: string; place: string }): MemoirSource {
  const memory = storyMemory(story);
  return {
    id: story.id,
    title: story.title,
    question: story.questionText,
    createdAt: story.createdAt.toISOString(),
    kind: memory.kind,
    childName: story.childName,
    theme: memory.theme,
    stage: memory.stage,
  };
}
