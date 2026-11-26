import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRequestDictionary } from "@/lib/request-locale";
import { bookFileStem, bookFromRequest } from "@/lib/memoir";
import { composeMemoirPdf } from "@/lib/memoir/compose";
import { renderMemoirPdf } from "@/lib/memoir/render-pdf";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { locale, dict } = await getRequestDictionary();
  const kind = bookFromRequest(request);
  const book = await composeMemoirPdf(user.id, user.name, dict, locale, kind);
  const bytes = await renderMemoirPdf(book);
  const filename = `${bookFileStem(kind)}.pdf`;
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
