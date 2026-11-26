import fs from "fs";
import path from "path";
import type { PdfBook, PdfStory } from "@/lib/memoir/render-pdf";
import { htmlParagraphs, xmlEscape } from "@/lib/memoir/text";
import { zipFiles } from "@/lib/memoir/zip";

function blocks(value: string) {
  return value.split(/\n+/).map((part) => part.trim()).filter(Boolean);
}

function storyXhtml(story: PdfStory, images: { id: string; href: string }[], language: string) {
  const body = htmlParagraphs(story.bodyHtml).map((paragraph) => `<p>${xmlEscape(paragraph)}</p>`).join("\n");
  const figures = images
    .map((image, index) => {
      const caption = story.photos[index]?.caption;
      return `<figure><img src="${image.href}" alt="${xmlEscape(caption || "")}"/>${caption ? `<figcaption>${xmlEscape(caption)}</figcaption>` : ""}</figure>`;
    })
    .join("\n");
  const meta = [story.when, story.childName].filter(Boolean).join(" · ");
  return `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${xmlEscape(language)}" lang="${xmlEscape(language)}">
<head><title>${xmlEscape(story.title || story.question)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
<h2>${xmlEscape(story.title || story.question)}</h2>
<p class="meta">${xmlEscape(meta)}</p>
${story.question && story.question !== story.title ? `<p class="question">${xmlEscape(story.question)}</p>` : ""}
${body}
${figures}
</body></html>`;
}

export async function renderMemoirEpub(book: PdfBook) {
  const files: { name: string; data: Buffer; store?: boolean }[] = [];
  files.push({ name: "mimetype", data: Buffer.from("application/epub+zip"), store: true });
  files.push({
    name: "META-INF/container.xml",
    data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`),
  });
  const manifest: string[] = [
    `<item id="style" href="style.css" media-type="text/css"/>`,
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>`,
  ];
  const spine = [`<itemref idref="title"/>`, `<itemref idref="nav"/>`];
  const navItems: string[] = [];
  if (book.dedication.trim()) {
    manifest.push(`<item id="dedication" href="dedication.xhtml" media-type="application/xhtml+xml"/>`);
    spine.splice(1, 0, `<itemref idref="dedication"/>`);
    files.push({
      name: "OEBPS/dedication.xhtml",
      data: Buffer.from(page(book.title, blocks(book.dedication).map((part) => `<p class="dedication">${xmlEscape(part)}</p>`).join(""), book.language)),
    });
  }
  if (book.preface.trim()) {
    manifest.push(`<item id="preface" href="preface.xhtml" media-type="application/xhtml+xml"/>`);
    spine.splice(book.dedication.trim() ? 2 : 1, 0, `<itemref idref="preface"/>`);
    files.push({
      name: "OEBPS/preface.xhtml",
      data: Buffer.from(page(book.title, blocks(book.preface).map((part) => `<p>${xmlEscape(part)}</p>`).join(""), book.language)),
    });
  }
  let imageCount = 0;
  book.chapters.forEach((chapter, chapterIndex) => {
    const id = `chapter-${chapterIndex + 1}`;
    const storyBlocks: string[] = [`<h1>${xmlEscape(book.chapterLabel(chapterIndex + 1))}</h1>`, `<h2>${xmlEscape(chapter.title)}</h2>`];
    for (const story of chapter.stories) {
      const local: { id: string; href: string }[] = [];
      for (const photo of story.photos) {
        imageCount += 1;
        const ext = photo.mimeType.includes("png") ? "png" : "jpg";
        const href = `images/photo-${imageCount}.${ext}`;
        const media = ext === "png" ? "image/png" : "image/jpeg";
        const itemId = `img-${imageCount}`;
        manifest.push(`<item id="${itemId}" href="${href}" media-type="${media}"/>`);
        files.push({ name: `OEBPS/${href}`, data: photo.bytes });
        local.push({ id: itemId, href });
      }
      storyBlocks.push(storyXhtml(story, local, book.language).replace(/^[\s\S]*<body>/, "").replace(/<\/body>[\s\S]*$/, ""));
    }
    files.push({ name: `OEBPS/${id}.xhtml`, data: Buffer.from(page(chapter.title, storyBlocks.join("\n"), book.language)) });
    manifest.push(`<item id="${id}" href="${id}.xhtml" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="${id}"/>`);
    navItems.push(`<li><a href="${id}.xhtml">${xmlEscape(book.chapterLabel(chapterIndex + 1))} ${xmlEscape(chapter.title)}</a></li>`);
  });
  files.push({
    name: "OEBPS/title.xhtml",
    data: Buffer.from(page(book.title, `<h1>${xmlEscape(book.title)}</h1><p class="meta">${xmlEscape(book.subtitle)}</p><p>${xmlEscape(book.author)}</p>`, book.language)),
  });
  files.push({
    name: "OEBPS/nav.xhtml",
    data: Buffer.from(page(book.contentsLabel, `<h1>${xmlEscape(book.contentsLabel)}</h1><nav epub:type="toc" id="toc"><ol>${navItems.join("")}</ol></nav>`, book.language)),
  });
  files.push({
    name: "OEBPS/style.css",
    data: Buffer.from(`@font-face { font-family: "Hearth Serif"; src: url("fonts/LiberationSerif-Regular.ttf"); }
@font-face { font-family: "Hearth CJK"; src: url("fonts/DroidSansFallbackFull.ttf"); }
body { font-family: "Hearth Serif", "Hearth CJK", serif; line-height: 1.6; margin: 1rem; }
h1, h2 { font-weight: 500; }
.meta, .question { color: #5c5146; }
img { max-width: 100%; height: auto; }
figcaption { text-align: center; font-size: 0.9rem; }`),
  });
  files.push({ name: "OEBPS/fonts/LiberationSerif-Regular.ttf", data: fs.readFileSync(path.join(process.cwd(), "assets/fonts/LiberationSerif-Regular.ttf")) });
  files.push({ name: "OEBPS/fonts/DroidSansFallbackFull.ttf", data: fs.readFileSync(path.join(process.cwd(), "assets/fonts/DroidSansFallbackFull.ttf")) });
  manifest.push(`<item id="font-serif" href="fonts/LiberationSerif-Regular.ttf" media-type="font/ttf"/>`);
  manifest.push(`<item id="font-cjk" href="fonts/DroidSansFallbackFull.ttf" media-type="font/ttf"/>`);
  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0" xml:lang="${xmlEscape(book.language)}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">hearthlight-memoir</dc:identifier>
<dc:title>${xmlEscape(book.title)}</dc:title>
<dc:creator>${xmlEscape(book.author)}</dc:creator>
<dc:language>${xmlEscape(book.language)}</dc:language>
<meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
</metadata>
<manifest>
${manifest.join("\n")}
</manifest>
<spine>
${spine.join("\n")}
</spine>
</package>`;
  files.push({ name: "OEBPS/content.opf", data: Buffer.from(opf) });
  return zipFiles(files);
}

function page(title: string, body: string, language: string) {
  return `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${xmlEscape(language)}" lang="${xmlEscape(language)}">
<head><title>${xmlEscape(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>${body}</body></html>`;
}
