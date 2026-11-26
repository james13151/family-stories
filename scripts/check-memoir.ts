import { inflateRawSync } from "zlib";
import { PDFDocument } from "pdf-lib";
import { mergeStructure, spineMillimetres, trimSize, type MemoirSource } from "../lib/memoir";
import { renderMemoirPdf } from "../lib/memoir/render-pdf";
import { renderMemoirEpub } from "../lib/memoir/render-epub";
import { zipFiles } from "../lib/memoir/zip";

const errors: string[] = [];

function story(id: string, stage: string, theme: string, createdAt: string, kind: "life" | "child" = "life", childName = ""): MemoirSource {
  return { id, title: id, question: id, createdAt, kind, childName, theme, stage };
}

const stories = [
  story("late", "later-life", "family", "2020-01-01"),
  story("child", "childhood", "childhood", "1990-01-01"),
  story("work", "career", "work", "2005-01-01"),
  story("kid", "school-years", "school", "2018-01-01", "child", "Mei"),
];

const stageOrder = mergeStructure(stories, "stage", null, (id) => id);
const stageIds = stageOrder.chapters.map((chapter) => chapter.id);
if (stageIds.indexOf("childhood") > stageIds.indexOf("career")) errors.push("childhood should come before career");
if (!stageIds.includes("school-years")) errors.push("child memory should keep its own stage chapter");

const excluded = mergeStructure(stories, "stage", { grouping: "stage", chapters: [], excluded: ["work"] }, (id) => id);
if (excluded.excluded.join() !== "work") errors.push("exclusion was dropped");
if (excluded.chapters.some((chapter) => chapter.storyIds.includes("work"))) errors.push("excluded story still in a chapter");

const custom = mergeStructure(
  stories,
  "stage",
  {
    grouping: "stage",
    chapters: [
      { id: "career", title: "Working years", storyIds: ["work"] },
      { id: "childhood", title: "", storyIds: ["child"] },
    ],
    excluded: [],
  },
  (id) => `default:${id}`,
);
if (custom.chapters[0]?.title !== "Working years") errors.push("custom chapter title was lost");
if (custom.chapters[0]?.id !== "career") errors.push("custom chapter order was lost");
if (!custom.chapters.some((chapter) => chapter.storyIds.includes("late"))) errors.push("a new story was not appended");

const switched = mergeStructure(stories, "theme", { ...custom, grouping: "stage" }, (id) => id);
if (switched.grouping !== "theme") errors.push("grouping did not change");
if (switched.chapters.some((chapter) => chapter.id === "career")) errors.push("old stage chapters survived a grouping change");

const keptOut = mergeStructure(stories, "person", { grouping: "stage", chapters: custom.chapters, excluded: ["kid"] }, (id) => id);
if (!keptOut.excluded.includes("kid")) errors.push("exclusion did not survive a grouping change");
if (keptOut.chapters.some((chapter) => chapter.storyIds.includes("kid"))) errors.push("excluded story returned after regrouping");

if (spineMillimetres(100) !== 5) errors.push(`spine of 100 pages should be 5 mm, got ${spineMillimetres(100)}`);
if (spineMillimetres(0) !== 0.1) errors.push("empty book still reports a minimum spine");
const a5 = trimSize("a5");
const trade = trimSize("trade");
if (a5.widthMm !== 148 || a5.heightMm !== 210) errors.push("A5 trim is wrong");
if (Math.abs(trade.widthMm - 139.7) > 0.1 || Math.abs(trade.heightMm - 215.9) > 0.1) errors.push("trade trim is wrong");

const tiny = zipFiles([
  { name: "mimetype", data: Buffer.from("application/epub+zip"), store: true },
  { name: "hello.txt", data: Buffer.from("hello") },
]);
if (tiny.subarray(0, 2).toString() !== "PK") errors.push("zip missing local header");
if (tiny.readUInt16LE(8) !== 0) errors.push("mimetype must be stored, not deflated");

const book = {
  title: "家燈回憶錄",
  subtitle: "Stories for the family",
  author: "Mei Chen",
  dedication: "For the people who kept the lamp lit.",
  preface: "A short preface.\nA second paragraph.",
  contentsLabel: "Contents",
  chapterLabel: (number: number) => `Chapter ${number}`,
  language: "zh-Hant",
  trim: "a5" as const,
  chapters: [
    {
      title: "Childhood 童年",
      stories: [
        {
          id: "s1",
          title: "The street market",
          question: "What did the street sound like?",
          bodyHtml: "<p>The street market was loud.</p><p>街市很熱鬧。</p>",
          when: "1990-04-01",
          childName: "",
          photos: [],
        },
      ],
    },
  ],
};

async function renderChecks() {
const pdfBytes = await renderMemoirPdf(book);
if (!Buffer.from(pdfBytes).subarray(0, 5).toString().startsWith("%PDF")) errors.push("pdf header missing");
const pdf = await PDFDocument.load(pdfBytes);
if (pdf.getPageCount() < 4) errors.push(`pdf should include cover, title, contents, and a story, got ${pdf.getPageCount()}`);
const first = pdf.getPage(0).getSize();
const interior = pdf.getPage(1).getSize();
if (first.width <= interior.width) errors.push("cover spread should be wider than an interior page");

const epub = unzip(await renderMemoirEpub(book));
if (epub.get("mimetype")?.toString() !== "application/epub+zip") errors.push("epub mimetype missing");
const chapter = [...epub.keys()].find((name) => name.endsWith("chapter-1.xhtml"));
const chapterText = chapter ? epub.get(chapter)?.toString("utf8") || "" : "";
if (!chapterText.includes("街市很熱鬧")) errors.push("epub dropped traditional Chinese");
const opf = epub.get("OEBPS/content.opf")?.toString("utf8") || "";
if (!opf.includes("zh-Hant")) errors.push("epub language missing");
if (!epub.has("OEBPS/fonts/DroidSansFallbackFull.ttf")) errors.push("epub did not embed the CJK font");
if (!epub.has("OEBPS/fonts/LiberationSerif-Regular.ttf")) errors.push("epub did not embed the Latin font");
}

function unzip(buffer: Buffer) {
  const files = new Map<string, Buffer>();
  let offset = 0;
  while (offset + 30 <= buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
    const method = buffer.readUInt16LE(offset + 8);
    const size = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extra = buffer.readUInt16LE(offset + 28);
    const name = buffer.subarray(offset + 30, offset + 30 + nameLength).toString();
    const start = offset + 30 + nameLength + extra;
    const data = buffer.subarray(start, start + size);
    files.set(name, method === 0 ? Buffer.from(data) : inflateRawSync(data));
    offset = start + size;
  }
  return files;
}

function finish() {
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log("Memoir structure, PDF, and EPUB OK");
}

if (errors.length) finish();
else renderChecks().then(finish).catch((error) => {
  console.error(error);
  process.exit(1);
});
