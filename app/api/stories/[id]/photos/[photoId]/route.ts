import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storageDelete } from "@/lib/storage";

const schema = z.object({ caption: z.string().max(240) });

async function findPhoto(userId: string, storyId: string, photoId: string) {
  return prisma.photo.findFirst({
    where: { id: photoId, storyId, story: { userId } },
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, photoId } = await context.params;
  const photo = await findPhoto(user.id, id, photoId);
  if (!photo) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await prisma.photo.update({ where: { id: photo.id }, data: { caption: parsed.data.caption.trim() } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, photoId } = await context.params;
  const photo = await findPhoto(user.id, id, photoId);
  if (!photo) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await storageDelete(photo.storageKey);
  await prisma.photo.delete({ where: { id: photo.id } });
  return NextResponse.json({ ok: true });
}
