import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseFormat } from "@/lib/format";
import { sanitizeStoryHtml } from "@/lib/sanitize";
import { storageDelete } from "@/lib/storage";

const schema = z.object({
  title: z.string().max(200).optional(),
  bodyHtml: z.string().max(200_000).optional(),
  format: z.record(z.any()).optional(),
});

async function owned(userId: string, id: string) {
  return prisma.story.findFirst({
    where: { id, userId },
    include: { audio: true, photos: true },
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const story = await owned(user.id, id);
  if (!story) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const format = parsed.data.format ? parseFormat(JSON.stringify(parsed.data.format), user.locale) : undefined;
  await prisma.story.update({
    where: { id: story.id },
    data: {
      title: parsed.data.title?.trim(),
      bodyHtml: parsed.data.bodyHtml !== undefined ? sanitizeStoryHtml(parsed.data.bodyHtml) : undefined,
      formatJson: format ? JSON.stringify(format) : undefined,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const story = await owned(user.id, id);
  if (!story) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (story.audio) await storageDelete(story.audio.storageKey);
  await Promise.all(story.photos.map((photo) => storageDelete(photo.storageKey)));
  await prisma.story.delete({ where: { id: story.id } });
  return NextResponse.json({ ok: true });
}
