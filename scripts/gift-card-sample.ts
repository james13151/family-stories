import fs from "fs";
import path from "path";
import { loadEnv } from "./load-env";

loadEnv();

async function main() {
  const { renderGiftCardPdf, renderGiftCardPng } = await import("../lib/gift/render");
  const dir = path.join(process.cwd(), "docs", "samples");
  fs.mkdirSync(dir, { recursive: true });
  const url = "https://stories.example.com/sign-up";
  for (const locale of ["zh-Hant", "zh-Hans", "en"] as const) {
    fs.writeFileSync(path.join(dir, `gift-card-${locale}.png`), renderGiftCardPng(locale, url));
    fs.writeFileSync(path.join(dir, `gift-card-${locale}.pdf`), await renderGiftCardPdf(locale, url));
    console.log(`wrote ${locale}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
