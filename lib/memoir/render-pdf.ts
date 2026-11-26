import fs from "fs";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, degrees, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { MemoirTrim } from "@/lib/memoir";
import { spineMillimetres, trimSize } from "@/lib/memoir";
import { htmlParagraphs } from "@/lib/memoir/text";

const MM = 72 / 25.4;
const BLEED_MM = 3;

export type PdfStory = {
  id: string;
  title: string;
  question: string;
  bodyHtml: string;
  when: string;
  childName: string;
  photos: { bytes: Buffer; mimeType: string; caption: string }[];
};

export type PdfChapter = { title: string; stories: PdfStory[] };

export type PdfBook = {
  title: string;
  subtitle: string;
  author: string;
  dedication: string;
  preface: string;
  contentsLabel: string;
  chapterLabel: (number: number) => string;
  language: string;
  trim: MemoirTrim;
  chapters: PdfChapter[];
};

type Box = { left: number; right: number; top: number; bottom: number; width: number };

function plainBlocks(value: string) {
  return value.split(/\n+/).map((part) => part.trim()).filter(Boolean);
}

function isCjk(char: string) {
  const code = char.codePointAt(0) || 0;
  return code >= 0x2e80;
}

export async function renderMemoirPdf(book: PdfBook) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(book.title);
  doc.setAuthor(book.author);
  const latin = await doc.embedFont(fs.readFileSync(path.join(process.cwd(), "assets/fonts/LiberationSerif-Regular.ttf")), { subset: true });
  const latinBold = await doc.embedFont(fs.readFileSync(path.join(process.cwd(), "assets/fonts/LiberationSerif-Bold.ttf")), { subset: true });
  const cjk = await doc.embedFont(fs.readFileSync(path.join(process.cwd(), "assets/fonts/DroidSansFallbackFull.ttf")), { subset: true });
  const ink = rgb(0.16, 0.13, 0.09);
  const muted = rgb(0.42, 0.36, 0.3);
  const rule = rgb(0.65, 0.52, 0.29);
  const trim = trimSize(book.trim);
  const pageWidth = (trim.widthMm + BLEED_MM * 2) * MM;
  const pageHeight = (trim.heightMm + BLEED_MM * 2) * MM;
  const interior: PDFPage[] = [];

  function boxFor(pageNumber: number): Box {
    const recto = pageNumber % 2 === 1;
    const gutter = 20;
    const outer = 14;
    const left = (BLEED_MM + (recto ? gutter : outer)) * MM;
    const right = pageWidth - (BLEED_MM + (recto ? outer : gutter)) * MM;
    const top = pageHeight - (BLEED_MM + 16) * MM;
    const bottom = (BLEED_MM + 18) * MM;
    return { left, right, top, bottom, width: right - left };
  }

  function addPage() {
    const page = doc.addPage([pageWidth, pageHeight]);
    interior.push(page);
    const number = interior.length;
    const box = boxFor(number);
    drawRuns(page, String(number), 9, box.right - 20, (BLEED_MM + 8) * MM, latin, cjk, muted);
    cropMarks(page);
    return { page, box, y: box.top };
  }

  function cropMarks(page: PDFPage) {
    const x0 = BLEED_MM * MM;
    const y0 = BLEED_MM * MM;
    const x1 = (BLEED_MM + trim.widthMm) * MM;
    const y1 = (BLEED_MM + trim.heightMm) * MM;
    const mark = 8;
    const color = rgb(0.4, 0.4, 0.4);
    const lines: [number, number, number, number][] = [
      [x0 - mark, y0, x0 - 2, y0],
      [x0, y0 - mark, x0, y0 - 2],
      [x1 + 2, y0, x1 + mark, y0],
      [x1, y0 - mark, x1, y0 - 2],
      [x0 - mark, y1, x0 - 2, y1],
      [x0, y1 + 2, x0, y1 + mark],
      [x1 + 2, y1, x1 + mark, y1],
      [x1, y1 + 2, x1, y1 + mark],
    ];
    for (const [a, b, c, d] of lines) page.drawLine({ start: { x: a, y: b }, end: { x: c, y: d }, thickness: 0.4, color });
  }

  function widthOf(text: string, size: number) {
    let width = 0;
    for (const char of text) {
      const font = isCjk(char) ? cjk : latin;
      try {
        width += font.widthOfTextAtSize(char, size);
      } catch {
        try {
          width += cjk.widthOfTextAtSize(char, size);
        } catch {
          width += size * 0.5;
        }
      }
    }
    return width;
  }

  function wrap(text: string, size: number, maxWidth: number) {
    const lines: string[] = [];
    let line = "";
    const push = (word: string) => {
      const next = line ? `${line}${word}` : word;
      if (widthOf(next, size) <= maxWidth || !line) line = next;
      else {
        lines.push(line.trimEnd());
        line = word.trimStart();
      }
    };
    const tokens = text.split(/(\s+)/);
    for (const token of tokens) {
      if (!token) continue;
      if ([...token].some(isCjk) && !token.trim().includes(" ")) {
        for (const char of token) push(char);
      } else push(token);
    }
    if (line.trim()) lines.push(line.trimEnd());
    return lines.length ? lines : [""];
  }

  function drawRuns(page: PDFPage, text: string, size: number, x: number, y: number, regular: PDFFont, fallback: PDFFont, color: ReturnType<typeof rgb>) {
    let cursor = x;
    let buffer = "";
    let cjkRun = false;
    const flush = () => {
      if (!buffer) return;
      const font = cjkRun ? fallback : regular;
      try {
        page.drawText(buffer, { x: cursor, y, size, font, color });
        cursor += font.widthOfTextAtSize(buffer, size);
      } catch {
        try {
          page.drawText(buffer, { x: cursor, y, size, font: fallback, color });
          cursor += fallback.widthOfTextAtSize(buffer, size);
        } catch {
          cursor += size;
        }
      }
      buffer = "";
    };
    for (const char of text) {
      const next = isCjk(char);
      if (buffer && next !== cjkRun) flush();
      cjkRun = next;
      buffer += char;
    }
    flush();
  }

  let cursor = addPage();

  function newPage() {
    cursor = addPage();
  }

  function ensure(height: number) {
    if (cursor.y - height < cursor.box.bottom) newPage();
  }

  function paragraph(text: string, size: number, color = ink, gap = 8, align: "left" | "center" = "left") {
    const lines = wrap(text, size, cursor.box.width);
    const leading = size * 1.45;
    for (const line of lines) {
      ensure(leading);
      const lineWidth = widthOf(line, size);
      const x = align === "center" ? cursor.box.left + (cursor.box.width - lineWidth) / 2 : cursor.box.left;
      drawRuns(cursor.page, line, size, x, cursor.y - size, latin, cjk, color);
      cursor.y -= leading;
    }
    cursor.y -= gap;
  }

  function centeredBlock(lines: { text: string; size: number; color?: ReturnType<typeof rgb> }[]) {
    for (const line of lines) paragraph(line.text, line.size, line.color || ink, 6, "center");
  }

  // Title page
  cursor.y = cursor.box.top - 80;
  centeredBlock([
    { text: book.title || " ", size: 22 },
    { text: book.subtitle, size: 13, color: muted },
  ]);
  cursor.y -= 16;
  cursor.page.drawLine({
    start: { x: cursor.box.left + cursor.box.width / 2 - 24, y: cursor.y },
    end: { x: cursor.box.left + cursor.box.width / 2 + 24, y: cursor.y },
    thickness: 0.6,
    color: rule,
  });
  cursor.y -= 28;
  paragraph(book.author, 12, ink, 0, "center");

  if (book.dedication.trim()) {
    newPage();
    cursor.y = cursor.box.top - 100;
    for (const block of plainBlocks(book.dedication)) paragraph(block, 12, ink, 8, "center");
  }
  if (book.preface.trim()) {
    newPage();
    for (const block of plainBlocks(book.preface)) paragraph(block, 11, ink, 8, "left");
  }

  newPage();
  paragraph(book.contentsLabel, 18, ink, 16, "left");
  let storyNumber = 0;
  book.chapters.forEach((chapter, index) => {
    paragraph(`${book.chapterLabel(index + 1)}  ${chapter.title}`, 12, ink, 4);
    for (const story of chapter.stories) {
      storyNumber += 1;
      paragraph(`${storyNumber}   ${story.title || story.question}`, 11, muted, 2);
    }
    cursor.y -= 6;
  });

  for (const [index, chapter] of book.chapters.entries()) {
    newPage();
    cursor.y = cursor.box.top - 120;
    paragraph(book.chapterLabel(index + 1), 11, rule, 8, "center");
    paragraph(chapter.title, 20, ink, 8, "center");
    let number = book.chapters.slice(0, index).reduce((sum, item) => sum + item.stories.length, 0);
    for (const story of chapter.stories) {
      number += 1;
      newPage();
      paragraph(String(number), 10, rule, 4);
      paragraph(story.title || story.question, 16, ink, 4);
      const meta = [story.when, story.childName].filter(Boolean).join("  ·  ");
      if (meta) paragraph(meta, 10, muted, 8);
      if (story.question && story.question !== story.title) paragraph(story.question, 11, muted, 10);
      for (const text of htmlParagraphs(story.bodyHtml)) paragraph(text, 11, ink, 8);
      for (const photo of story.photos) {
        let image: PDFImage | null = null;
        try {
          image = photo.mimeType.includes("png") ? await doc.embedPng(photo.bytes) : photo.mimeType.includes("jpeg") || photo.mimeType.includes("jpg") ? await doc.embedJpg(photo.bytes) : null;
        } catch {
          image = null;
        }
        if (!image) {
          if (photo.caption) paragraph(photo.caption, 9, muted, 8, "center");
          continue;
        }
        const maxW = cursor.box.width;
        const maxH = 90 * MM;
        const scale = Math.min(maxW / image.width, maxH / image.height, 1);
        const width = image.width * scale;
        const height = image.height * scale;
        ensure(height + 24);
        cursor.page.drawImage(image, {
          x: cursor.box.left + (cursor.box.width - width) / 2,
          y: cursor.y - height,
          width,
          height,
        });
        cursor.y -= height + 6;
        if (photo.caption) paragraph(photo.caption, 9, muted, 10, "center");
      }
    }
  }

  if (interior.length % 2 === 1) addPage();
  const spineMm = spineMillimetres(interior.length);
  drawCover(doc, book, latin, latinBold, cjk, trim.widthMm, trim.heightMm, spineMm);
  return doc.save();
}

function drawCover(
  doc: PDFDocument,
  book: PdfBook,
  latin: PDFFont,
  latinBold: PDFFont,
  cjk: PDFFont,
  trimW: number,
  trimH: number,
  spineMm: number,
) {
  const width = (BLEED_MM + trimW + spineMm + trimW + BLEED_MM) * MM;
  const height = (BLEED_MM + trimH + BLEED_MM) * MM;
  const page = doc.insertPage(0, [width, height]);
  const cloth = rgb(0.55, 0.23, 0.18);
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.95, 0.93, 0.88) });
  const backX = BLEED_MM * MM;
  const spineX = (BLEED_MM + trimW) * MM;
  const frontX = (BLEED_MM + trimW + spineMm) * MM;
  const bottom = BLEED_MM * MM;
  page.drawRectangle({ x: spineX, y: bottom, width: spineMm * MM, height: trimH * MM, color: cloth });
  const ink = rgb(0.16, 0.13, 0.09);
  const fontFor = (text: string, bold: boolean) => ([...text].some(isCjk) ? cjk : bold ? latinBold : latin);
  const measure = (text: string, size: number, font: PDFFont) => {
    try {
      return font.widthOfTextAtSize(text, size);
    } catch {
      try {
        return cjk.widthOfTextAtSize(text, size);
      } catch {
        return text.length * size * 0.5;
      }
    }
  };
  const draw = (text: string, size: number, x: number, y: number, font: PDFFont, color = ink) => {
    if (!text) return;
    try {
      page.drawText(text, { x, y, size, font, color });
    } catch {
      try {
        page.drawText(text, { x, y, size, font: cjk, color });
      } catch {
        /* A glyph neither embedded font can draw is left off the cover. */
      }
    }
  };
  const frontCenter = frontX + (trimW * MM) / 2;
  const title = book.title || "";
  const titleFont = fontFor(title, true);
  let titleSize = 22;
  let titleWidth = measure(title, titleSize, titleFont);
  const maxTitle = (trimW - 24) * MM;
  while (titleWidth > maxTitle && titleSize > 12) {
    titleSize -= 1;
    titleWidth = measure(title, titleSize, titleFont);
  }
  draw(title, titleSize, frontCenter - titleWidth / 2, bottom + trimH * MM * 0.62, titleFont);
  const subtitleFont = fontFor(book.subtitle, false);
  const subtitleWidth = measure(book.subtitle, 12, subtitleFont);
  draw(book.subtitle, 12, frontCenter - subtitleWidth / 2, bottom + trimH * MM * 0.54, subtitleFont);
  const authorFont = fontFor(book.author, false);
  const authorWidth = measure(book.author, 12, authorFont);
  draw(book.author, 12, frontCenter - authorWidth / 2, bottom + trimH * MM * 0.22, authorFont);
  const note = `Spine ${spineMm} mm / 80 gsm text`;
  draw(note, 8, backX + 18, bottom + 18, latin);
  if (spineMm >= 8 && title) {
    const spineFont = fontFor(title, false);
    const spineSize = 8;
    const spineWidth = measure(title, spineSize, spineFont);
    try {
      page.drawText(title, {
        x: spineX + (spineMm * MM) / 2 + spineSize / 2,
        y: bottom + (trimH * MM) / 2 - spineWidth / 2,
        size: spineSize,
        font: spineFont,
        color: rgb(0.98, 0.96, 0.93),
        rotate: degrees(90),
      });
    } catch {
      /* A thin spine stays blank when the title cannot be drawn. */
    }
  }
}
