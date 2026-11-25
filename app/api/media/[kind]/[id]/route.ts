import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storageGet } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ kind: string; id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { kind, id } = await context.params;
  const owned =
    kind === "photo"
      ? await prisma.photo.findFirst({ where: { id, story: { userId: user.id } } })
      : kind === "audio"
        ? await prisma.audio.findFirst({ where: { id, story: { userId: user.id } } })
        : null;
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const bytes = await storageGet(owned.storageKey);
  if (!bytes) return NextResponse.json({ error: "missing" }, { status: 404 });
  const range = request.headers.get("range");
  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (match) {
      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : bytes.length - 1;
      if (start <= end && end < bytes.length) {
        const slice = bytes.subarray(start, end + 1);
        return new Response(new Uint8Array(slice), {
          status: 206,
          headers: {
            "Content-Type": owned.mimeType,
            "Content-Length": String(slice.length),
            "Content-Range": `bytes ${start}-${end}/${bytes.length}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "private, max-age=3600",
          },
        });
      }
    }
  }
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": owned.mimeType,
      "Content-Length": String(bytes.length),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
