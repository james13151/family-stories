import fs from "fs";
import path from "path";

const paper = "#f6efe4";
const ink = "#2c2416";
const seal = "#8d3b2e";
const gold = "#c4a36a";
const moss = "#3f5c4b";
const blush = "#e7cfc3";

function frame(inner: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <rect width="1200" height="900" fill="${paper}"/>
  <rect x="36" y="36" width="1128" height="828" fill="none" stroke="${gold}" stroke-width="3"/>
  ${inner}
</svg>`;
}

function spool(x: number, y: number, color: string) {
  return `
    <ellipse cx="${x}" cy="${y}" rx="46" ry="16" fill="${color}" stroke="${ink}" stroke-width="3"/>
    <rect x="${x - 28}" y="${y}" width="56" height="130" fill="${color}" stroke="${ink}" stroke-width="3"/>
    <ellipse cx="${x}" cy="${y + 130}" rx="46" ry="16" fill="${color}" stroke="${ink}" stroke-width="3"/>
  `;
}

const plates: Record<string, string> = {
  tea: frame(`
    <rect x="160" y="150" width="260" height="360" rx="6" fill="#fbf7f0" stroke="${gold}" stroke-width="3"/>
    <rect x="190" y="190" width="200" height="250" fill="#f3e7d2"/>
    <line x1="140" y1="700" x2="1060" y2="700" stroke="${ink}" stroke-width="4"/>
    <ellipse cx="720" cy="660" rx="210" ry="26" fill="${blush}" stroke="${ink}" stroke-width="3"/>
    <path d="M610 430 h180 c18 70 18 130 -8 190 h-164 c-26 -60 -26 -120 -8 -190z" fill="#fffaf3" stroke="${ink}" stroke-width="4"/>
    <ellipse cx="700" cy="430" rx="100" ry="22" fill="#f6e7cf" stroke="${ink}" stroke-width="4"/>
    <path d="M790 490c40 8 62 36 48 72-12 28-48 34-78 22" fill="none" stroke="${ink}" stroke-width="4"/>
    <path d="M660 360c8-34 6-62 16-96M720 350c10-40 4-74 14-112M780 362c6-30 16-58 8-92" fill="none" stroke="${gold}" stroke-width="3" stroke-linecap="round"/>
  `),
  sewing: frame(`
    <rect x="180" y="520" width="840" height="150" rx="24" fill="#efe2cf" stroke="${ink}" stroke-width="4"/>
    ${spool(320, 300, seal)}
    ${spool(470, 270, moss)}
    ${spool(610, 320, gold)}
    <path d="M820 470c40-90 90-120 140-80" fill="none" stroke="${ink}" stroke-width="3"/>
    <path d="M960 390 l46-70" stroke="${ink}" stroke-width="3"/>
    <circle cx="1006" cy="314" r="5" fill="${ink}"/>
  `),
  market: frame(`
    <path d="M150 300 h900 l-70 80 H220z" fill="${seal}"/>
    <rect x="210" y="380" width="780" height="22" fill="${ink}"/>
    <rect x="250" y="402" width="18" height="250" fill="${ink}"/>
    <rect x="930" y="402" width="18" height="250" fill="${ink}"/>
    <ellipse cx="390" cy="560" rx="70" ry="70" fill="${seal}"/>
    <ellipse cx="540" cy="575" rx="58" ry="58" fill="${gold}"/>
    <ellipse cx="690" cy="555" rx="74" ry="74" fill="${moss}"/>
    <ellipse cx="840" cy="580" rx="52" ry="52" fill="${blush}" stroke="${ink}" stroke-width="3"/>
    <rect x="280" y="660" width="640" height="18" rx="4" fill="#efe2cf" stroke="${ink}" stroke-width="3"/>
  `),
  congee: frame(`
    <ellipse cx="600" cy="640" rx="300" ry="36" fill="${blush}"/>
    <path d="M360 390 h480 l-46 190 c-12 54-78 96-194 96s-182-42-194-96z" fill="#fffaf3" stroke="${ink}" stroke-width="4"/>
    <ellipse cx="600" cy="390" rx="240" ry="40" fill="#f4e3c8" stroke="${ink}" stroke-width="4"/>
    <ellipse cx="560" cy="470" rx="18" ry="12" fill="${gold}"/>
    <ellipse cx="640" cy="510" rx="14" ry="10" fill="${moss}"/>
    <ellipse cx="700" cy="460" rx="16" ry="11" fill="${seal}"/>
    <path d="M540 300c16-36 8-78 22-120M650 300c-8-44 12-86 2-128" fill="none" stroke="${gold}" stroke-width="3" stroke-linecap="round"/>
  `),
  wrench: frame(`
    <rect x="180" y="180" width="840" height="540" rx="8" fill="#efe6d6"/>
    <rect x="250" y="250" width="430" height="320" rx="10" fill="#e7d3b4" stroke="${ink}" stroke-width="4"/>
    <rect x="300" y="310" width="220" height="18" fill="${seal}"/>
    <rect x="300" y="360" width="280" height="14" fill="${moss}"/>
    <rect x="300" y="410" width="160" height="14" fill="${gold}"/>
    <path d="M760 470 h250 a36 36 0 1 0 0-72 h-40 v-28 h-70 v28 h-140z" fill="${ink}"/>
    <circle cx="1010" cy="434" r="14" fill="${paper}"/>
  `),
  bicycle: frame(`
    <circle cx="340" cy="560" r="130" fill="none" stroke="${ink}" stroke-width="10"/>
    <circle cx="860" cy="560" r="130" fill="none" stroke="${ink}" stroke-width="10"/>
    <circle cx="340" cy="560" r="16" fill="${ink}"/>
    <circle cx="860" cy="560" r="16" fill="${ink}"/>
    <path d="M340 560 L520 560 L690 390 L500 390 L430 560" fill="none" stroke="${seal}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M690 390 L860 560" stroke="${seal}" stroke-width="8"/>
    <path d="M690 390 L760 330" stroke="${ink}" stroke-width="6"/>
    <path d="M500 390 L560 330" stroke="${ink}" stroke-width="6"/>
    <rect x="180" y="710" width="840" height="10" fill="${gold}"/>
    <circle cx="160" cy="180" r="46" fill="${gold}" opacity="0.85"/>
  `),
};

export async function writeSeedArt(dir = path.join(process.cwd(), "seed", "photos")) {
  const { Resvg } = await import("@resvg/resvg-js");
  fs.mkdirSync(dir, { recursive: true });
  const font = path.join(process.cwd(), "assets", "fonts", "LiberationSerif-Regular.ttf");
  for (const [name, svg] of Object.entries(plates)) {
    const png = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
      font: { fontFiles: [font], loadSystemFonts: false },
    }).render().asPng();
    fs.writeFileSync(path.join(dir, `${name}.png`), png);
  }
}

if (process.argv[1] && process.argv[1].includes("seed-art")) {
  writeSeedArt().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
