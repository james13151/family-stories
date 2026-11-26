import { assertOneAccount } from "@/lib/account";
import { htmlParagraphs } from "@/lib/memoir/text";
import { zipFiles } from "@/lib/memoir/zip";

export const CSV_COLUMNS = [
  "id",
  "created_at",
  "updated_at",
  "kind",
  "child_name",
  "theme",
  "stage",
  "place",
  "title",
  "question",
  "body",
  "transcript",
  "in_book",
] as const;

export type ExportStory = {
  userId: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  kind: string;
  childName: string;
  theme: string;
  stage: string;
  place: string;
  title: string;
  question: string;
  body: string;
  transcript: string;
  inBook: boolean;
};

export type ExportMedia = {
  storyId: string;
  kind: "photo" | "audio";
  id: string;
  mimeType: string;
  caption: string;
  bytes: Buffer;
};

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function storyBody(html: string) {
  const paragraphs = htmlParagraphs(html);
  return paragraphs.length ? paragraphs.join("\n\n") : "";
}

export function buildStoryCsv(accountId: string, stories: ExportStory[]) {
  assertOneAccount(stories, accountId);
  const lines = [CSV_COLUMNS.join(",")];
  for (const story of stories) {
    const cells = [
      story.id,
      story.createdAt,
      story.updatedAt,
      story.kind,
      story.childName,
      story.theme,
      story.stage,
      story.place,
      story.title,
      story.question,
      story.body,
      story.transcript,
      story.inBook ? "yes" : "no",
    ];
    lines.push(cells.map(csvCell).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function buildStoryTxt(accountId: string, accountName: string, stories: ExportStory[]) {
  assertOneAccount(stories, accountId);
  const blocks = stories.map((story) => {
    const heading = story.title || story.question || story.id;
    const meta = [story.createdAt.slice(0, 10), story.kind === "child" ? story.childName : "", story.inBook ? "" : "left out"]
      .filter(Boolean)
      .join(" · ");
    return [heading, meta, story.question && story.question !== story.title ? story.question : "", story.body, story.transcript ? story.transcript : ""]
      .filter((line) => line !== "")
      .join("\n");
  });
  return `${accountName}\n\n${blocks.join("\n\n---\n\n")}\n`;
}

export function fileSlug(title: string, id: string) {
  const base = title.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
  const safe = base.replace(/ /g, "-") || "story";
  return `${safe}-${id.slice(-6)}`;
}

export function mediaExtension(mimeType: string, kind: "photo" | "audio") {
  const mime = mimeType.toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return kind === "photo" ? "img" : "audio";
}

export function buildArchive(accountId: string, accountName: string, stories: ExportStory[], media: ExportMedia[]) {
  assertOneAccount(stories, accountId);
  const known = new Set(stories.map((story) => story.id));
  const files: { name: string; data: Buffer; store?: boolean }[] = [];
  const listed: { path: string; storyId: string; kind: string; caption: string }[] = [];
  const used = new Set<string>();
  for (const item of media) {
    if (!known.has(item.storyId)) continue;
    const story = stories.find((entry) => entry.id === item.storyId);
    const folder = item.kind === "photo" ? "photos" : "audio";
    const ext = mediaExtension(item.mimeType, item.kind);
    let path = `${folder}/${fileSlug(story?.title || story?.question || "", item.storyId)}-${item.id.slice(-6)}.${ext}`;
    while (used.has(path)) path = path.replace(new RegExp(`\\.${ext}$`), `-${used.size}.${ext}`);
    used.add(path);
    files.push({ name: path, data: item.bytes });
    listed.push({ path, storyId: item.storyId, kind: item.kind, caption: item.caption });
  }
  listed.unshift(
    { path: "stories.txt", storyId: "", kind: "text", caption: "" },
    { path: "stories.csv", storyId: "", kind: "text", caption: "" },
  );
  const manifest = {
    product: "hearthlight",
    accountName,
    exportedAt: new Date().toISOString(),
    note: "Private family archive. Paths are inside this zip. There are no public links.",
    stories: stories.map((story) => ({ id: story.id, title: story.title || story.question, inBook: story.inBook })),
    files: listed,
  };
  const manifestText = JSON.stringify(manifest, null, 2);
  if (/https?:\/\//.test(manifestText)) throw new Error("archive manifest must not contain a url");
  files.unshift(
    { name: "stories.txt", data: Buffer.from(buildStoryTxt(accountId, accountName, stories), "utf8") },
    { name: "stories.csv", data: Buffer.from(buildStoryCsv(accountId, stories), "utf8") },
  );
  files.push({ name: "manifest.json", data: Buffer.from(manifestText, "utf8") });
  return zipFiles(files);
}
