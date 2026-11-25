import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { renderGiftCardPdf, renderGiftCardPng, signUpUrl } from "@/lib/gift/render";
import { isLocale, type Locale } from "@/lib/locale";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const requested = url.searchParams.get("locale");
  const locale: Locale = isLocale(requested) ? requested : isLocale(user.locale) ? user.locale : "en";
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "png";
  const download = url.searchParams.get("download") === "1";
  const target = signUpUrl();
  if (format === "pdf") {
    const pdf = await renderGiftCardPdf(locale, target);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="hearthlight-gift-card.pdf"`,
      },
    });
  }
  const png = renderGiftCardPng(locale, target);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="hearthlight-gift-card.png"`,
    },
  });
}
