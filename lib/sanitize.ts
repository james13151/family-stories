import sanitizeHtml from "sanitize-html";

const options: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "div"],
  allowedAttributes: {},
  disallowedTagsMode: "discard",
};

export function sanitizeStoryHtml(dirty: string) {
  const clean = sanitizeHtml(dirty || "", options).trim();
  return clean;
}

export function storyToPlain(html: string) {
  return sanitizeHtml(html || "", { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(html: string, max = 140) {
  const plain = storyToPlain(html);
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max).trim()}…`;
}
