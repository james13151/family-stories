import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { accountMayExport, exportText } from "@/lib/export/load";
import { bookFileStem, bookFromRequest } from "@/lib/memoir";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!accountMayExport(user.plan)) return NextResponse.json({ error: "plan" }, { status: 403 });
  const book = bookFromRequest(request);
  const bytes = await exportText(user.id, user.name, "csv", book);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${bookFileStem(book)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
