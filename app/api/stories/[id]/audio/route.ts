import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { keptTranscript } from "@/lib/stories";
import { storageDelete, storagePut } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 40 * 1024 * 1024;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const story = await prisma.story.findFirst({
    where: { id, userId: user.id },
    include: { audio: true },
  });
  if (!story) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file" }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "size" }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const extension = mimeType.includes("wav") ? "wav" : "bin";
  const storageKey = `users/${user.id}/stories/${story.id}/audio-${Date.now()}.${extension}`;
  await storagePut(storageKey, bytes, mimeType);
  if (story.audio) await storageDelete(story.audio.storageKey);
  const durationRaw = Number(form.get("duration"));
  const durationSec = Number.isFinite(durationRaw) ? durationRaw : null;
  const audio = await prisma.$transaction(async (tx) => {
    if (story.transcript) {
      await tx.story.update({ where: { id: story.id }, data: { transcript: "" } });
    }
    if (story.audio) {
      return tx.audio.update({
        where: { id: story.audio.id },
        data: {
          storageKey,
          mimeType,
          bytes: bytes.length,
          durationSec,
          transcript: "",
          sttProvider: "",
        },
      });
    }
    return tx.audio.create({
      data: {
        storyId: story.id,
        storageKey,
        mimeType,
        bytes: bytes.length,
        durationSec,
      },
    });
  });
  return NextResponse.json({
    audio: {
      id: audio.id,
      mimeType: audio.mimeType,
      transcript: audio.transcript,
      durationSec: audio.durationSec,
    },
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const story = await prisma.story.findFirst({
    where: { id, userId: user.id },
    include: { audio: true },
  });
  if (!story?.audio) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const audio = story.audio;
  await storageDelete(audio.storageKey);
  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.audio.findUnique({ where: { id: audio.id } });
      if (!current) return;
      const transcript = keptTranscript(story.transcript, current.transcript);
      if (transcript !== story.transcript) {
        await tx.story.update({ where: { id: story.id }, data: { transcript } });
      }
      await tx.audio.delete({ where: { id: current.id } });
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2025") throw error;
  }
  return NextResponse.json({ ok: true });
}
