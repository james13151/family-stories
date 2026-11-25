import type { LifeStage, Location, Question, Theme } from "@/lib/questions/types";

export type Facet = {
  stage: LifeStage;
  locations?: Location[];
  also?: Theme[];
};

function facet(stage: LifeStage, locations?: Location[], also?: Theme[]): Facet {
  return {
    stage,
    ...(locations && locations.length ? { locations } : {}),
    ...(also && also.length ? { also } : {}),
  };
}

/**
 * Browsing metadata for every question.
 * `stage` is the era of the memory, in life order.
 * `locations` are kinds of place, never a street address.
 * `also` adds categories on top of the question's own theme and `also` list.
 */
export const FACETS: Record<string, Facet> = {
  "ch-morning-street": facet("childhood", ["hometown", "home"]),
  "ch-kitchen-smell": facet("childhood", ["home"], ["family"]),
  "ch-outside-game": facet("childhood", ["hometown"]),
  "ch-bed": facet("childhood", ["home"]),
  "ch-rule": facet("childhood", undefined, ["family", "self-development"]),
  "ch-pockets": facet("childhood"),
  "ch-neighbor": facet("childhood", ["hometown"]),
  "ch-season": facet("childhood"),
  "ch-door-view": facet("childhood", ["hometown", "home"]),
  "ch-smell": facet("childhood"),
  "ch-stayed-home": facet("childhood"),
  "ch-repeated-story": facet("origins", undefined, ["family"]),
  "ch-night-fear": facet("childhood", undefined, ["family"]),
  "ch-rest-day": facet("childhood", undefined, ["family"]),
  "ch-festival-clothes": facet("childhood"),
  "ch-place-gone": facet("childhood", ["hometown"]),

  "pa-mother-hands": facet("childhood", undefined, ["family"]),
  "pa-father-taught": facet("childhood", undefined, ["family", "self-development"]),
  "pa-how-met": facet("origins", undefined, ["family", "marriage"]),
  "pa-disagreed": facet("childhood", undefined, ["family"]),
  "pa-saying": facet("childhood", undefined, ["family", "self-development"]),
  "pa-life-before": facet("coming-of-age", undefined, ["family", "self-development"]),
  "pa-comfort-food": facet("childhood", undefined, ["family"]),
  "pa-their-work": facet("childhood", undefined, ["family"]),
  "pa-proud": facet("coming-of-age", undefined, ["family", "self-development"]),
  "pa-kindness": facet("childhood", undefined, ["family"]),

  "gp-hands": facet("origins", undefined, ["family"]),
  "gp-home": facet("origins", ["home", "hometown"], ["family"]),
  "gp-story": facet("origins", undefined, ["family"]),
  "gp-names": facet("origins", undefined, ["family"]),
  "gp-habit": facet("across-life", undefined, ["family", "self-development"]),

  "sb-chores": facet("childhood", undefined, ["family"]),
  "sb-secrets": facet("childhood", undefined, ["family"]),
  "sb-trouble": facet("childhood", undefined, ["family"]),
  "sb-order": facet("childhood", undefined, ["family", "self-development"]),
  "sb-wish-said": facet("later-life", undefined, ["family"]),

  "sc-teacher": facet("school"),
  "sc-capable": facet("school", undefined, ["self-development"]),
  "sc-small": facet("school", undefined, ["self-development"]),
  "sc-way": facet("school", ["hometown"]),
  "sc-lunch": facet("school"),
  "sc-classmate": facet("school", undefined, ["self-development"]),
  "sc-uniform": facet("school"),
  "sc-wanted": facet("school", undefined, ["self-development", "work"]),

  "ca-alone": facet("coming-of-age", ["travel"]),
  "ca-adult": facet("coming-of-age", undefined, ["self-development", "work", "marriage"]),
  "ca-mistake": facet("coming-of-age", undefined, ["self-development"]),
  "ca-friend": facet("coming-of-age"),
  "ca-song": facet("coming-of-age"),

  "wk-first-day": facet("career"),
  "wk-wages": facet("career"),
  "wk-real-teacher": facet("career", undefined, ["self-development"]),
  "wk-hardest-hour": facet("career"),
  "wk-pride": facet("career", undefined, ["self-development"]),
  "wk-colleague": facet("career"),
  "wk-changed": facet("career"),
  "wk-explain": facet("career"),
  "wk-for-family": facet("career", undefined, ["family"]),
  "wk-tool": facet("career"),

  "hm-most-like-home": facet("across-life", ["home"]),
  "hm-first-move": facet("coming-of-age", ["migration", "home"]),

  "pl-known": facet("across-life", ["city"]),
  "pl-rain": facet("across-life", ["city"]),
  "pl-quiet": facet("across-life", ["home", "city"]),
  "pl-window": facet("across-life", ["home"]),
  "pl-make-home": facet("across-life", ["migration", "home"]),
  "pl-hot": facet("across-life", ["city"]),

  "fd-the-way": facet("across-life"),
  "fd-ingredient": facet("across-life"),
  "fd-guests": facet("across-life"),
  "fd-scarce": facet("childhood", undefined, ["historical-era", "family"]),
  "fd-birthday": facet("across-life", undefined, ["family"]),
  "fd-taught": facet("coming-of-age", undefined, ["self-development"]),
  "fd-learned": facet("across-life", ["migration"]),
  "fd-keep": facet("later-life"),

  "tr-new-year": facet("childhood", undefined, ["family"]),
  "tr-festival-food": facet("across-life"),
  "tr-kept": facet("across-life"),
  "tr-birthdays": facet("across-life", undefined, ["family"]),
  "tr-wedding": facet("marriage"),
  "tr-blessing": facet("across-life"),
  "tr-youngest": facet("later-life"),

  "cd-first-hold": facet("children"),
  "cd-soothe": facet("children"),
  "cd-not-repeat": facet("children", undefined, ["self-development", "childhood"]),
  "cd-afternoon": facet("children"),
  "cd-notice": facet("children"),
  "cd-ask": facet("later-life"),
  "cd-rule": facet("children", undefined, ["family"]),
  "cd-have": facet("children"),

  "mr-meet": facet("marriage"),
  "mr-habit": facet("marriage"),
  "mr-disagree": facet("marriage"),
  "mr-promise": facet("marriage"),
  "mr-weekday": facet("marriage"),

  "fr-season": facet("across-life"),
  "fr-cheap": facet("across-life"),
  "fr-helped": facet("across-life", undefined, ["family"]),

  "ob-visitor": facet("across-life"),
  "ob-kept": facet("across-life"),
  "ob-gift": facet("across-life"),
  "ob-descendant": facet("later-life"),

  "hi-outside": facet("across-life"),
  "hi-radio": facet("coming-of-age"),
  "hi-neighborhood": facet("across-life", ["hometown", "city"]),
  "hi-ordinary": facet("later-life"),
  "hi-good-life": facet("coming-of-age", undefined, ["self-development"]),

  "lt-morning": facet("later-life"),
  "lt-learn": facet("later-life", undefined, ["self-development"]),
  "lt-advice": facet("later-life", undefined, ["self-development"]),
  "lt-glad": facet("later-life"),
  "lt-loved": facet("later-life"),
  "lt-laugh": facet("later-life"),
  "lt-phone": facet("later-life"),
  "lt-visit": facet("later-life", ["travel"]),
  "lt-ordinary": facet("later-life"),

  "sk-hobby": facet("across-life", undefined, ["self-development"]),
  "sk-useful": facet("across-life", undefined, ["self-development"]),
  "sk-hands": facet("across-life", undefined, ["self-development"]),
  "sk-pleasure": facet("across-life", undefined, ["self-development"]),

  "mg-languages": facet("across-life", ["home", "migration"]),
  "mg-hardest": facet("across-life", ["migration", "city"]),
  "mg-misunderstood": facet("across-life", ["city", "migration"]),
  "mg-carry": facet("later-life", undefined, ["family"]),

  "pe-before": facet("later-life"),

  "gf-meal": facet("later-life", undefined, ["food"]),
  "gf-day": facet("later-life"),
  "he-ill": facet("childhood", undefined, ["family"]),
  "he-body": facet("across-life", undefined, ["self-development"]),
  "mo-enough": facet("childhood", undefined, ["family"]),
  "mo-saved": facet("across-life"),
  "wa-day": facet("across-life", ["city"]),
  "wa-kept": facet("across-life"),
  "ro-keep": facet("marriage", undefined, ["family"]),
  "ro-unsaid": facet("marriage"),
};

export function questionCategories(question: Question): Theme[] {
  const extra = FACETS[question.id]?.also ?? [];
  const seen = new Set<Theme>();
  const categories: Theme[] = [];
  for (const theme of [question.theme, ...(question.also ?? []), ...extra]) {
    if (seen.has(theme)) continue;
    seen.add(theme);
    categories.push(theme);
  }
  return categories;
}

export function questionStage(question: Question): LifeStage {
  return FACETS[question.id]?.stage ?? "across-life";
}

export function questionLocations(question: Question): Location[] {
  return FACETS[question.id]?.locations ?? [];
}
