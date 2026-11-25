export type StoryFont = "serif" | "sans";
export type StorySize = "comfortable" | "large" | "xlarge";
export type StoryAlign = "left" | "center" | "justify";
export type StorySpacing = "normal" | "relaxed" | "loose";

export type StoryFormat = {
  font: StoryFont;
  size: StorySize;
  align: StoryAlign;
  lineHeight: StorySpacing;
  indent: boolean;
  dropCap: boolean;
};

export function defaultFormat(locale: string): StoryFormat {
  const chinese = locale.startsWith("zh");
  return {
    font: "serif",
    size: chinese ? "large" : "comfortable",
    align: "left",
    lineHeight: "relaxed",
    indent: chinese,
    dropCap: !chinese,
  };
}

export function parseFormat(raw: string | null | undefined, locale = "en"): StoryFormat {
  const base = defaultFormat(locale);
  if (!raw) return base;
  try {
    const value = JSON.parse(raw) as Partial<StoryFormat>;
    return {
      font: value.font === "sans" ? "sans" : "serif",
      size: value.size === "xlarge" || value.size === "large" ? value.size : value.size === "comfortable" ? "comfortable" : base.size,
      align: value.align === "center" || value.align === "justify" ? value.align : "left",
      lineHeight:
        value.lineHeight === "normal" || value.lineHeight === "loose" ? value.lineHeight : "relaxed",
      indent: Boolean(value.indent),
      dropCap: Boolean(value.dropCap),
    };
  } catch {
    return base;
  }
}

export function formatClass(format: StoryFormat, dropCapActive: boolean) {
  return [
    "book-page",
    format.font === "sans" ? "font-clear" : "font-book",
    format.size === "xlarge" ? "book-size-xl" : format.size === "large" ? "book-size-lg" : "book-size-md",
    format.align === "center" ? "text-center" : format.align === "justify" ? "text-justify" : "text-left",
    format.lineHeight === "loose" ? "book-loose" : format.lineHeight === "normal" ? "book-normal" : "book-relaxed",
    format.indent ? "book-indent" : "",
    format.dropCap && dropCapActive ? "book-dropcap" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function firstLetterIsLatin(text: string) {
  const trimmed = text.trim();
  return /^[A-Za-z]/.test(trimmed);
}
