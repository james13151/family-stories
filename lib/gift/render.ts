import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { PDFDocument } from "pdf-lib";
import { Resvg } from "@resvg/resvg-js";
import type { Locale } from "@/lib/locale";

const WIDTH = 1240;
const HEIGHT = 1748;

export function publicBaseUrl() {
  const configured = process.env.PUBLIC_BASE_URL?.trim();
  return (configured || "https://stories.example.com").replace(/\/$/, "");
}

export function signUpUrl(base = publicBaseUrl()) {
  return `${base.replace(/\/$/, "")}/sign-up`;
}

export function isSampleBaseUrl(base = publicBaseUrl()) {
  return base.includes("example.com") || base.includes("localhost") || base.includes("127.0.0.1");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type CardCopy = {
  eyebrow: string;
  title: string[];
  body: string[];
  aside: string;
  scan: string;
  cjk: boolean;
};

function copyFor(locale: Locale): CardCopy {
  if (locale === "zh-Hans") {
    return {
      eyebrow: "一份生日礼物",
      title: ["把你的故事", "留下来"],
      body: ["你想讲的时候，", "回答一个温柔的问题。", "可以打字，也可以说话。", "留给爱你的人。"],
      aside: "Stories only you can tell.",
      scan: "扫码开始",
      cjk: true,
    };
  }
  if (locale === "zh-Hant") {
    return {
      eyebrow: "一份生日禮物",
      title: ["把你的故事", "留下來"],
      body: ["你想講的時候，", "回答一個溫柔的問題。", "可以打字，也可以說話。", "留給愛你的人。"],
      aside: "Stories only you can tell.",
      scan: "掃碼開始",
      cjk: true,
    };
  }
  return {
    eyebrow: "A BIRTHDAY GIFT",
    title: ["Stories only", "you can tell"],
    body: ["When you feel ready,", "answer a gentle question.", "Type, or speak.", "Leave it for the people who love you."],
    aside: "家燈 · 把故事留下來",
    scan: "Scan to begin",
    cjk: false,
  };
}

function qrRects(url: string) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const count = qr.modules.size;
  const size = 430;
  const originX = (WIDTH - size) / 2;
  const originY = 1088;
  const cell = size / count;
  const parts: string[] = [];
  parts.push(
    `<rect x="${originX - 18}" y="${originY - 18}" width="${size + 36}" height="${size + 36}" rx="18" fill="#fffaf3"/>`,
  );
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.modules.get(row, col)) continue;
      const x = originX + col * cell;
      const y = originY + row * cell;
      parts.push(
        `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(cell + 0.4).toFixed(2)}" height="${(cell + 0.4).toFixed(2)}" fill="#2a2218"/>`,
      );
    }
  }
  return parts.join("");
}

export function giftCardSvg(locale: Locale, url: string) {
  const copy = copyFor(locale);
  const displayUrl = url.replace(/^https?:\/\//, "");
  const titleSize = copy.cjk ? 92 : 78;
  const bodySize = copy.cjk ? 36 : 32;
  const textFont = copy.cjk ? "Droid Sans Fallback" : "Liberation Serif";
  const asideFont = copy.cjk ? "Liberation Serif" : "Droid Sans Fallback";
  const title = copy.title
    .map(
      (line, index) =>
        `<text x="620" y="${430 + index * (titleSize + 18)}" text-anchor="middle" font-family="${textFont}" font-size="${titleSize}" fill="#2a2218">${escapeXml(line)}</text>`,
    )
    .join("");
  const body = copy.body
    .map(
      (line, index) =>
        `<text x="620" y="${700 + index * 52}" text-anchor="middle" font-family="${textFont}" font-size="${bodySize}" fill="#4d4032">${escapeXml(line)}</text>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#f4eadc"/>
  <rect x="46" y="46" width="${WIDTH - 92}" height="${HEIGHT - 92}" fill="none" stroke="#8d3b2e" stroke-width="4"/>
  <rect x="64" y="64" width="${WIDTH - 128}" height="${HEIGHT - 128}" fill="none" stroke="#a6844a" stroke-width="2"/>
  <circle cx="620" cy="176" r="58" fill="#8d3b2e"/>
  <text x="620" y="196" text-anchor="middle" font-family="Droid Sans Fallback" font-size="54" fill="#fffaf3">家</text>
  <text x="620" y="278" text-anchor="middle" font-family="Liberation Serif" font-size="22" letter-spacing="6" fill="#8d3b2e">HEARTHLIGHT</text>
  <text x="620" y="328" text-anchor="middle" font-family="${textFont}" font-size="${copy.cjk ? 30 : 24}" letter-spacing="${copy.cjk ? 8 : 4}" fill="#3d5c4b">${escapeXml(copy.eyebrow)}</text>
  ${title}
  <line x1="470" y1="650" x2="770" y2="650" stroke="#a6844a" stroke-width="2"/>
  ${body}
  <text x="620" y="940" text-anchor="middle" font-family="${asideFont}" font-size="28" font-style="${copy.cjk ? "italic" : "normal"}" fill="#8d3b2e">${escapeXml(copy.aside)}</text>
  ${qrRects(url)}
  <text x="620" y="1572" text-anchor="middle" font-family="${textFont}" font-size="32" fill="#2a2218">${escapeXml(copy.scan)}</text>
  <text x="620" y="1624" text-anchor="middle" font-family="Liberation Serif" font-size="22" fill="#6a5b49">${escapeXml(displayUrl)}</text>
</svg>`;
}

function fontFiles() {
  const dir = path.join(process.cwd(), "assets", "fonts");
  return [
    path.join(dir, "LiberationSerif-Regular.ttf"),
    path.join(dir, "LiberationSerif-Bold.ttf"),
    path.join(dir, "LiberationSerif-Italic.ttf"),
    path.join(dir, "DroidSansFallbackFull.ttf"),
  ];
}

export function renderGiftCardPng(locale: Locale, url: string) {
  const svg = giftCardSvg(locale, url);
  const renderer = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
    font: {
      fontFiles: fontFiles(),
      loadSystemFonts: false,
    },
  });
  return renderer.render().asPng();
}

export async function renderGiftCardPdf(locale: Locale, url: string) {
  const png = renderGiftCardPng(locale, url);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([297.64, 419.53]);
  const image = await pdf.embedPng(png);
  page.drawImage(image, { x: 0, y: 0, width: 297.64, height: 419.53 });
  return Buffer.from(await pdf.save());
}

export function sampleOutputDir() {
  const dir = path.join(process.cwd(), "docs", "samples");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
