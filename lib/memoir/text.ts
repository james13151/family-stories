import { sanitizeStoryHtml } from "@/lib/sanitize";

function decode(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

export function htmlParagraphs(html: string) {
  const clean = sanitizeStoryHtml(html);
  if (!clean) return [];
  return clean
    .split(/<\/p>|<br\s*\/?>/i)
    .map((part) => decode(part.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
