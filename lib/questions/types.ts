export const THEMES = [
  "childhood",
  "parents",
  "grandparents",
  "siblings",
  "school",
  "coming-of-age",
  "work",
  "home",
  "places",
  "food",
  "traditions",
  "children",
  "marriage",
  "friendship",
  "objects",
  "historical-era",
  "later-life",
  "skills",
  "migration",
  "grief",
  "health",
  "money",
  "war",
  "romance",
] as const;

export type Theme = (typeof THEMES)[number];

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
