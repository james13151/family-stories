/** Themes for memories a parent keeps about a child. */
export const CHILD_THEMES = [
  "arrival",
  "firsts",
  "birthdays",
  "everyday",
  "school",
  "outings",
  "character",
  "family",
] as const;

export type ChildTheme = (typeof CHILD_THEMES)[number];

/** A child's years, earliest first. */
export const CHILD_STAGES = [
  "waiting",
  "newborn",
  "first-year",
  "toddler",
  "school-years",
  "growing",
] as const;

export type ChildStage = (typeof CHILD_STAGES)[number];

/** Kinds of place. Never a private address. */
export const CHILD_PLACES = ["home", "hometown", "city", "travel"] as const;

export type ChildPlace = (typeof CHILD_PLACES)[number];

export type ChildQuestion = {
  id: string;
  theme: ChildTheme;
  also?: ChildTheme[];
  stage: ChildStage;
  places?: ChildPlace[];
  en: string;
  hans: string;
  hant: string;
  enFallback?: string;
  hansFallback?: string;
  hantFallback?: string;
};
