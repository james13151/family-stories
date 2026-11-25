import type { Story } from "@prisma/client";
import { questionStage, questionLocations } from "@/lib/questions/facets";
import { childQuestionById } from "@/lib/questions/child-bank";
import { questionById } from "@/lib/questions/bank";

/** Life stages and a child's years, in an order a family book can follow. */
export const BOOK_STAGE_ORDER = [
  "waiting",
  "newborn",
  "first-year",
  "toddler",
  "origins",
  "childhood",
  "school",
  "school-years",
  "coming-of-age",
  "growing",
  "career",
  "marriage",
  "children",
  "later-life",
  "across-life",
] as const;

export type StoryMemory = {
  kind: "life" | "child";
  childName: string;
  theme: string;
  themes: string[];
  stage: string;
  places: string[];
};

export function storyMemory(story: Pick<Story, "kind" | "childName" | "questionId" | "theme" | "stage" | "place">): StoryMemory {
  const child = story.questionId ? childQuestionById(story.questionId) : null;
  const adult = story.questionId && !child ? questionById(story.questionId) : null;
  const themes = new Set<string>();
  if (story.theme) themes.add(story.theme);
  if (child) {
    themes.add(child.theme);
    for (const theme of child.also ?? []) themes.add(theme);
  }
  if (adult) {
    themes.add(adult.theme);
    for (const theme of adult.also ?? []) themes.add(theme);
  }
  const places = new Set<string>();
  if (story.place) places.add(story.place);
  if (child) for (const place of child.places ?? []) places.add(place);
  if (adult) for (const place of questionLocations(adult)) places.add(place);

  const stage = story.stage || child?.stage || (adult ? questionStage(adult) : "") || "across-life";
  const theme = story.theme || child?.theme || adult?.theme || "";
  if (theme) themes.add(theme);

  return {
    kind: story.kind === "child" ? "child" : "life",
    childName: story.childName,
    theme,
    themes: [...themes],
    stage,
    places: [...places],
  };
}

export function stageRank(stage: string) {
  const index = BOOK_STAGE_ORDER.indexOf(stage as (typeof BOOK_STAGE_ORDER)[number]);
  return index === -1 ? BOOK_STAGE_ORDER.length : index;
}
