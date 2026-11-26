import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { accountMayExport, exportText } from "@/lib/export/load";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!accountMayExport(user.plan)) return NextResponse.json({ error: "plan" }, { status: 403 });
  const bytes = await exportText(user.id, user.name, "csv");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="hearthlight-stories.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
