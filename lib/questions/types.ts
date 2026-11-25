export const THEMES = [
  "childhood",
  "family",
  "parents",
  "grandparents",
  "siblings",
  "school",
  "coming-of-age",
  "work",
  "self-development",
  "skills",
  "marriage",
  "children",
  "home",
  "places",
  "migration",
  "food",
  "traditions",
  "friendship",
  "objects",
  "historical-era",
  "later-life",
  "romance",
  "grief",
  "health",
  "money",
  "war",
] as const;

export type Theme = (typeof THEMES)[number];

/** Natural order of a life, used to group the bank. Not alphabetical. */
export const LIFE_STAGES = [
  "origins",
  "childhood",
  "school",
  "coming-of-age",
  "career",
  "marriage",
  "children",
  "later-life",
  "across-life",
] as const;

export type LifeStage = (typeof LIFE_STAGES)[number];

/** Place groupings. These are kinds of place, never a private address. */
export const LOCATIONS = ["hometown", "home", "city", "migration", "travel"] as const;

export type Location = (typeof LOCATIONS)[number];

export type Question = {
  id: string;
  theme: Theme;
  also?: Theme[];
  roles?: string[];
  en: string;
  hans: string;
  hant: string;
  enFallback?: string;
  hansFallback?: string;
  hantFallback?: string;
};
