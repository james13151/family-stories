import { BOOK_STAGE_ORDER, stageRank } from "@/lib/memories";
import { trimByCode, type PrintTrimCode } from "@/lib/print/catalog";
import { CHILD_THEMES } from "@/lib/questions/child";
import { THEMES } from "@/lib/questions/types";

export const BOOK_KINDS = ["life", "child"] as const;
export type BookKind = (typeof BOOK_KINDS)[number];

export function isBookKind(value: string | null | undefined): value is BookKind {
  return value === "life" || value === "child";
}

export function bookFromRequest(request: Request): BookKind {
  return new URL(request.url).searchParams.get("book") === "child" ? "child" : "life";
}

export function bookFileStem(book: BookKind) {
  return book === "child" ? "hearthlight-children" : "hearthlight-memoir";
}

export function storiesForBook<T extends { kind: string }>(stories: T[], book: BookKind) {
  return stories.filter((story) => story.kind === book);
}

export const MEMOIR_GROUPINGS = ["stage", "theme", "person"] as const;
export type MemoirGrouping = (typeof MEMOIR_GROUPINGS)[number];

export const MEMOIR_TRIMS = ["a5", "trade", "trade-6x9"] as const;
export type MemoirTrim = PrintTrimCode;

export type MemoirSource = {
  id: string;
  title: string;
  question: string;
  createdAt: string;
  kind: "life" | "child";
  childName: string;
  theme: string;
  stage: string;
};

export type MemoirChapterPlan = {
  id: string;
  title: string;
  storyIds: string[];
};

export type MemoirStructure = {
  grouping: MemoirGrouping;
  chapters: MemoirChapterPlan[];
  excluded: string[];
};

const themeRank = new Map<string, number>([...THEMES, ...CHILD_THEMES].map((theme, index) => [theme, index]));

export function isMemoirGrouping(value: string): value is MemoirGrouping {
  return (MEMOIR_GROUPINGS as readonly string[]).includes(value);
}

export function isMemoirTrim(value: string): value is MemoirTrim {
  return (MEMOIR_TRIMS as readonly string[]).includes(value);
}

export function chapterKey(story: MemoirSource, grouping: MemoirGrouping) {
  if (grouping === "theme") return story.theme || "other";
  if (grouping === "person") return story.kind === "child" ? `child:${story.childName || "_"}` : "self";
  return story.stage || "across-life";
}

export function compareStories(a: MemoirSource, b: MemoirSource, grouping: MemoirGrouping) {
  if (grouping === "theme") {
    return (
      (themeRank.get(a.theme) ?? 99) - (themeRank.get(b.theme) ?? 99) ||
      stageRank(a.stage) - stageRank(b.stage) ||
      a.createdAt.localeCompare(b.createdAt)
    );
  }
  if (grouping === "person") {
    if (chapterKey(a, "person") === "self" && chapterKey(b, "person") !== "self") return -1;
    if (chapterKey(b, "person") === "self" && chapterKey(a, "person") !== "self") return 1;
    return chapterKey(a, "person").localeCompare(chapterKey(b, "person")) || stageRank(a.stage) - stageRank(b.stage) || a.createdAt.localeCompare(b.createdAt);
  }
  const stageOrder = (stage: string) => {
    const index = BOOK_STAGE_ORDER.indexOf(stage as (typeof BOOK_STAGE_ORDER)[number]);
    return index === -1 ? BOOK_STAGE_ORDER.length : index;
  };
  return stageOrder(a.stage) - stageOrder(b.stage) || a.createdAt.localeCompare(b.createdAt);
}

export function defaultChapters(stories: MemoirSource[], grouping: MemoirGrouping, titleFor: (id: string) => string): MemoirChapterPlan[] {
  const sorted = [...stories].sort((a, b) => compareStories(a, b, grouping));
  const chapters: MemoirChapterPlan[] = [];
  for (const story of sorted) {
    const id = chapterKey(story, grouping);
    let chapter = chapters.find((item) => item.id === id);
    if (!chapter) {
      chapter = { id, title: titleFor(id), storyIds: [] };
      chapters.push(chapter);
    }
    chapter.storyIds.push(story.id);
  }
  return chapters;
}

/**
 * Keep a saved order when the grouping matches. New stories join their chapter.
 * Stories no longer in the account drop out. Exclusions survive a grouping change.
 */
export function mergeStructure(
  stories: MemoirSource[],
  grouping: MemoirGrouping,
  saved: MemoirStructure | null,
  titleFor: (id: string) => string,
): MemoirStructure {
  const known = new Set(stories.map((story) => story.id));
  const excluded = (saved?.excluded || []).filter((id) => known.has(id));
  const excludedSet = new Set(excluded);
  const included = stories.filter((story) => !excludedSet.has(story.id));
  const defaults = defaultChapters(included, grouping, titleFor);
  if (!saved || saved.grouping !== grouping) {
    return { grouping, chapters: defaults, excluded };
  }
  const byId = new Map(defaults.map((chapter) => [chapter.id, chapter]));
  const usedChapters = new Set<string>();
  const usedStories = new Set<string>();
  const chapters: MemoirChapterPlan[] = [];
  for (const savedChapter of saved.chapters) {
    const fresh = byId.get(savedChapter.id);
    if (!fresh) continue;
    usedChapters.add(savedChapter.id);
    const storyIds = savedChapter.storyIds.filter((id) => fresh.storyIds.includes(id) && !usedStories.has(id));
    for (const id of storyIds) usedStories.add(id);
    for (const id of fresh.storyIds) {
      if (!usedStories.has(id)) {
        storyIds.push(id);
        usedStories.add(id);
      }
    }
    chapters.push({
      id: savedChapter.id,
      title: savedChapter.title.trim() || fresh.title,
      storyIds,
    });
  }
  for (const fresh of defaults) {
    if (usedChapters.has(fresh.id)) continue;
    chapters.push(fresh);
  }
  return { grouping, chapters: chapters.filter((chapter) => chapter.storyIds.length > 0), excluded };
}

export function parseStructure(raw: string): MemoirStructure | null {
  try {
    const value = JSON.parse(raw) as Partial<MemoirStructure>;
    if (!value || !isMemoirGrouping(value.grouping || "")) return null;
    const chapters = Array.isArray(value.chapters)
      ? value.chapters.flatMap((chapter) => {
          if (!chapter || typeof chapter.id !== "string" || typeof chapter.title !== "string" || !Array.isArray(chapter.storyIds)) return [];
          return [{ id: chapter.id, title: chapter.title, storyIds: chapter.storyIds.filter((id) => typeof id === "string") }];
        })
      : [];
    const excluded = Array.isArray(value.excluded) ? value.excluded.filter((id) => typeof id === "string") : [];
    return { grouping: value.grouping as MemoirGrouping, chapters, excluded };
  } catch {
    return null;
  }
}

/** Assumed text-paper thickness for an 80 gsm sheet, one side of a leaf. */
export const SPINE_MM_PER_PAGE = 0.05;

export function spineMillimetres(interiorPages: number) {
  return Math.round(Math.max(interiorPages, 1) * SPINE_MM_PER_PAGE * 10) / 10;
}

export function trimSize(trim: MemoirTrim) {
  const item = trimByCode(trim);
  return { name: item.name, widthMm: item.widthMm, heightMm: item.heightMm };
}
