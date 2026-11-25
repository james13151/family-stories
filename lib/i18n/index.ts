import { en } from "@/lib/i18n/en";
import type { Dictionary } from "@/lib/i18n/types";
import { zhHans } from "@/lib/i18n/zh-Hans";
import { zhHant } from "@/lib/i18n/zh-Hant";
import type { Locale } from "@/lib/locale";
import type { LifeStage, Location, Theme } from "@/lib/questions/types";

const dictionaries: Record<Locale, Dictionary> = {
  en,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export function themeLabel(dict: Dictionary, theme: string) {
  const map: Record<Theme, string> = {
    childhood: dict.themes.childhood,
    family: dict.themes.family,
    parents: dict.themes.parents,
    grandparents: dict.themes.grandparents,
    siblings: dict.themes.siblings,
    school: dict.themes.school,
    "coming-of-age": dict.themes.comingOfAge,
    work: dict.themes.work,
    "self-development": dict.themes.selfDevelopment,
    skills: dict.themes.skills,
    home: dict.themes.home,
    places: dict.themes.places,
    food: dict.themes.food,
    traditions: dict.themes.traditions,
    children: dict.themes.children,
    marriage: dict.themes.marriage,
    friendship: dict.themes.friendship,
    objects: dict.themes.objects,
    "historical-era": dict.themes.historicalEra,
    "later-life": dict.themes.laterLife,
    migration: dict.themes.migration,
    grief: dict.themes.grief,
    health: dict.themes.health,
    money: dict.themes.money,
    war: dict.themes.war,
    romance: dict.themes.romance,
  };
  return map[theme as Theme] || theme;
}

export function stageLabel(dict: Dictionary, stage: string) {
  const map: Record<LifeStage, string> = {
    origins: dict.questions.stages.origins,
    childhood: dict.questions.stages.childhood,
    school: dict.questions.stages.school,
    "coming-of-age": dict.questions.stages.comingOfAge,
    career: dict.questions.stages.career,
    marriage: dict.questions.stages.marriage,
    children: dict.questions.stages.children,
    "later-life": dict.questions.stages.laterLife,
    "across-life": dict.questions.stages.acrossLife,
  };
  return map[stage as LifeStage] || stage;
}

export function locationLabel(dict: Dictionary, location: string) {
  const map: Record<Location, string> = {
    hometown: dict.questions.places.hometown,
    home: dict.questions.places.home,
    city: dict.questions.places.city,
    migration: dict.questions.places.migration,
    travel: dict.questions.places.travel,
  };
  return map[location as Location] || location;
}
