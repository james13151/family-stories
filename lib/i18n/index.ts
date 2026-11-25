import { en } from "@/lib/i18n/en";
import type { Dictionary } from "@/lib/i18n/types";
import { zhHans } from "@/lib/i18n/zh-Hans";
import { zhHant } from "@/lib/i18n/zh-Hant";
import type { Locale } from "@/lib/locale";

const dictionaries: Record<Locale, Dictionary> = {
  en,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export function themeLabel(dict: Dictionary, theme: string) {
  const map: Record<string, string> = {
    childhood: dict.themes.childhood,
    parents: dict.themes.parents,
    grandparents: dict.themes.grandparents,
    siblings: dict.themes.siblings,
    school: dict.themes.school,
    "coming-of-age": dict.themes.comingOfAge,
    work: dict.themes.work,
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
    skills: dict.themes.skills,
    migration: dict.themes.migration,
    grief: dict.themes.grief,
    health: dict.themes.health,
    money: dict.themes.money,
    war: dict.themes.war,
    romance: dict.themes.romance,
  };
  return map[theme] || theme;
}
