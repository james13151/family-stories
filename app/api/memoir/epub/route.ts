import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRequestDictionary } from "@/lib/request-locale";
import { composeMemoirPdf } from "@/lib/memoir/compose";
import { renderMemoirEpub } from "@/lib/memoir/render-epub";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { locale, dict } = await getRequestDictionary();
  const book = await composeMemoirPdf(user.id, user.name, dict, locale);
  const bytes = await renderMemoirEpub(book);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/epub+zip",
      "Content-Disposition": 'attachment; filename="hearthlight-memoir.epub"',
      "Cache-Control": "private, no-store",
    },
  });
}
