import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storageGet } from "@/lib/storage";
import { transcribeRecording } from "@/lib/stt/transcribe";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const story = await prisma.story.findFirst({
    where: { id, userId: user.id },
    include: { audio: true },
  });
  if (!story?.audio) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!story.audio.mimeType.includes("wav") && !story.audio.storageKey.endsWith(".wav")) {
    return NextResponse.json({ error: "stt_needs_wav" }, { status: 422 });
  }
  const wav = await storageGet(story.audio.storageKey);
  if (!wav) return NextResponse.json({ error: "missing" }, { status: 404 });
  try {
    const result = await transcribeRecording(wav, user.locale);
    await prisma.audio.update({
      where: { id: story.audio.id },
      data: { transcript: result.text, sttProvider: result.provider },
    });
    return NextResponse.json({ text: result.text, provider: result.provider });
  } catch (error) {
    console.error("transcription failed", error);
    return NextResponse.json({ error: "stt_failed" }, { status: 502 });
  }
}
