import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { accountMayExport, exportArchive } from "@/lib/export/load";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!accountMayExport(user.plan)) return NextResponse.json({ error: "plan" }, { status: 403 });
  const bytes = await exportArchive(user.id, user.name);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="hearthlight-archive.zip"',
      "Cache-Control": "private, no-store",
    },
  });
}
