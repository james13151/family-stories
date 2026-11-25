import type { User } from "@prisma/client";

export const FAMILY_ROLES = ["grandparent", "parent", "aunt-or-uncle", "spouse", "self"] as const;
export type FamilyRole = (typeof FAMILY_ROLES)[number];

export const OPEN_TOPIC_IDS = [
  "childhood",
  "elders",
  "school",
  "work",
  "food",
  "places",
  "traditions",
  "children",
  "friendship",
  "objects",
  "era",
  "hobbies",
] as const;

export const SKIP_TOPIC_IDS = ["grief", "health", "money", "war", "romance"] as const;

export type Profile = {
  familyRole: string;
  childhoodPlace: string;
  placesLived: string;
  occupation: string;
  importantPeople: string;
  hobbies: string;
  openTopics: string[];
  skipTopics: string[];
};

export function parseIdList(raw: string, allowed: readonly string[]) {
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string" && allowed.includes(item));
  } catch {
    return [];
  }
}

export function profileFromUser(user: Pick<
  User,
  | "familyRole"
  | "childhoodPlace"
  | "placesLived"
  | "occupation"
  | "importantPeople"
  | "hobbies"
  | "openTopics"
  | "skipTopics"
>): Profile {
  return {
    familyRole: FAMILY_ROLES.includes(user.familyRole as FamilyRole) ? user.familyRole : "",
    childhoodPlace: user.childhoodPlace.trim(),
    placesLived: user.placesLived.trim(),
    occupation: user.occupation.trim(),
    importantPeople: user.importantPeople.trim(),
    hobbies: user.hobbies.trim(),
    openTopics: parseIdList(user.openTopics, OPEN_TOPIC_IDS),
    skipTopics: parseIdList(user.skipTopics, SKIP_TOPIC_IDS),
  };
}

export function firstPiece(value: string) {
  const parts = value
    .split(/\s*(?:、|,|，|;|；|\/|\band\b|及|和)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[0] || "";
}
