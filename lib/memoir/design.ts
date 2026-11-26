export const COVER_STYLES = ["seal", "cloth", "lane"] as const;
export type CoverStyle = (typeof COVER_STYLES)[number];

export const STORY_TEMPLATES = ["classic", "photo", "spread"] as const;
export type StoryTemplate = (typeof STORY_TEMPLATES)[number];

export const LANE_IMAGE = "/covers/morning-lane.jpg";

export function isCoverStyle(value: string): value is CoverStyle {
  return (COVER_STYLES as readonly string[]).includes(value);
}

export function isStoryTemplate(value: string): value is StoryTemplate {
  return (STORY_TEMPLATES as readonly string[]).includes(value);
}

/** Classic is the default. A story with a photograph uses the photo page. Spread is the chapter opening and any photographed story. */
export function storyLayout(template: StoryTemplate, hasPhoto: boolean, chapterOpening: boolean): StoryTemplate {
  if (template === "photo") return "photo";
  if (template === "spread") return hasPhoto || chapterOpening ? "spread" : "classic";
  return hasPhoto ? "photo" : "classic";
}
