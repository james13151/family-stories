import type { Dictionary } from "@/lib/i18n/types";
import { locationLabel, stageLabel, themeLabel } from "@/lib/i18n";
import type { ChildStage, ChildTheme } from "@/lib/questions/child";

export function childThemeLabel(dict: Dictionary, theme: string) {
  const map: Record<ChildTheme, string> = {
    arrival: dict.child.themes.arrival,
    firsts: dict.child.themes.firsts,
    birthdays: dict.child.themes.birthdays,
    everyday: dict.child.themes.everyday,
    school: dict.child.themes.school,
    outings: dict.child.themes.outings,
    character: dict.child.themes.character,
    family: dict.child.themes.family,
  };
  return map[theme as ChildTheme] || themeLabel(dict, theme);
}

export function memoryStageLabel(dict: Dictionary, stage: string) {
  const map: Record<ChildStage, string> = {
    waiting: dict.child.stages.waiting,
    newborn: dict.child.stages.newborn,
    "first-year": dict.child.stages.firstYear,
    toddler: dict.child.stages.toddler,
    "school-years": dict.child.stages.schoolYears,
    growing: dict.child.stages.growing,
  };
  return map[stage as ChildStage] || stageLabel(dict, stage);
}

export function memoryPlaceLabel(dict: Dictionary, place: string) {
  return locationLabel(dict, place);
}
