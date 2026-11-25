import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storagePut } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

function sniff(bytes: Buffer) {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length > 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (bytes.length > 6 && (bytes.subarray(0, 6).toString("ascii") === "GIF87a" || bytes.subarray(0, 6).toString("ascii") === "GIF89a")) return "image/gif";
  return null;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const story = await prisma.story.findFirst({
    where: { id, userId: user.id },
    include: { photos: true },
  });
  if (!story) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (story.photos.length >= 12) return NextResponse.json({ error: "limit" }, { status: 400 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file" }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "size" }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = sniff(bytes);
  if (!mimeType) return NextResponse.json({ error: "type" }, { status: 400 });
  const extension = mimeType.split("/")[1] === "jpeg" ? "jpg" : mimeType.split("/")[1];
  const photoId = crypto.randomUUID();
  const storageKey = `users/${user.id}/stories/${story.id}/photos/${photoId}.${extension}`;
  await storagePut(storageKey, bytes, mimeType);
  const photo = await prisma.photo.create({
    data: {
      id: photoId,
      storyId: story.id,
      storageKey,
      mimeType,
      bytes: bytes.length,
      sortOrder: story.photos.length,
    },
  });
  return NextResponse.json({ photo: { id: photo.id, caption: photo.caption } });
}
