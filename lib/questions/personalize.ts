import type { Locale } from "@/lib/locale";
import { firstPiece, type Profile } from "@/lib/profile";
import { QUESTIONS } from "@/lib/questions/bank";
import { questionCategories, questionLocations, questionStage } from "@/lib/questions/facets";
import type { LifeStage, Location, Theme } from "@/lib/questions/types";

const OPEN_TO_THEMES: Record<string, Theme[]> = {
  childhood: ["childhood", "coming-of-age"],
  elders: ["parents", "grandparents", "siblings", "family"],
  school: ["school"],
  work: ["work", "self-development"],
  food: ["food"],
  places: ["places", "home", "migration"],
  traditions: ["traditions"],
  children: ["children"],
  friendship: ["friendship"],
  objects: ["objects"],
  era: ["historical-era"],
  hobbies: ["skills", "later-life", "self-development"],
};

const SKIP_TO_THEMES: Record<string, Theme[]> = {
  grief: ["grief"],
  health: ["health"],
  money: ["money"],
  war: ["war"],
  romance: ["romance"],
};

const ROLE_THEMES: Record<string, Theme[]> = {
  grandparent: ["children", "later-life", "traditions", "historical-era"],
  parent: ["children", "work", "home", "school"],
  "aunt-or-uncle": ["siblings", "childhood", "traditions"],
  spouse: ["marriage", "home", "food"],
  self: ["childhood", "work", "places", "coming-of-age"],
};

export type PersonalizedQuestion = {
  id: string;
  theme: Theme;
  categories: Theme[];
  stage: LifeStage;
  locations: Location[];
  order: number;
  text: string;
  score: number;
  hidden: boolean;
  suggested: boolean;
  personalized: boolean;
};

function themeSet(ids: string[], map: Record<string, Theme[]>) {
  const themes = new Set<Theme>();
  for (const id of ids) {
    for (const theme of map[id] || []) themes.add(theme);
  }
  return themes;
}

function valuesFromProfile(profile: Profile) {
  return {
    childhoodPlace: profile.childhoodPlace,
    placeLived: firstPiece(profile.placesLived),
    occupation: profile.occupation,
    person: firstPiece(profile.importantPeople),
    hobby: firstPiece(profile.hobbies),
  };
}

function wording(
  template: string,
  fallback: string | undefined,
  values: Record<string, string>,
) {
  if (!template.includes("{")) {
    return { text: template, personalized: false };
  }
  let missing = false;
  let used = false;
  const text = template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    if (!value) {
      missing = true;
      return "";
    }
    used = true;
    return value;
  });
  if (missing) return { text: fallback || template, personalized: false };
  return { text, personalized: used };
}

export function personalizeQuestions(profile: Profile, locale: Locale, answeredIds: string[]) {
  const open = themeSet(profile.openTopics, OPEN_TO_THEMES);
  const skip = themeSet(profile.skipTopics, SKIP_TO_THEMES);
  const roleThemes = new Set(ROLE_THEMES[profile.familyRole] || []);
  const values = valuesFromProfile(profile);
  const answered = new Set(answeredIds);

  const cards: PersonalizedQuestion[] = QUESTIONS.map((question, order) => {
    const categories = questionCategories(question);
    const hidden = skip.has(question.theme);
    const localized =
      locale === "zh-Hans"
        ? wording(question.hans, question.hansFallback, values)
        : locale === "zh-Hant"
          ? wording(question.hant, question.hantFallback, values)
          : wording(question.en, question.enFallback, values);

    let score = 0;
    if (open.has(question.theme)) score += 5;
    for (const theme of categories) {
      if (theme !== question.theme && open.has(theme)) score += 2;
    }
    if (roleThemes.has(question.theme)) score += 3;
    if (question.roles?.includes(profile.familyRole)) score += 4;
    if (localized.personalized) score += 6;
    if (answered.has(question.id)) score -= 4;

    return {
      id: question.id,
      theme: question.theme,
      categories,
      stage: questionStage(question),
      locations: questionLocations(question),
      order,
      text: localized.text,
      score,
      hidden,
      suggested: !hidden && !answered.has(question.id) && score >= 5,
      personalized: localized.personalized,
    };
  });

  cards.sort((a, b) => b.score - a.score || a.text.localeCompare(b.text));
  return cards;
}

export function questionTextFor(id: string, profile: Profile, locale: Locale) {
  const [card] = personalizeQuestions(profile, locale, []).filter((item) => item.id === id);
  return card?.text || "";
}
