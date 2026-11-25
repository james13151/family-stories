import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { defaultFormat } from "@/lib/format";
import { computeNextPrompt, isPromptDue } from "@/lib/frequency";
import { isLocale } from "@/lib/locale";
import { profileFromUser } from "@/lib/profile";
import { questionTextFor } from "@/lib/questions/personalize";

const schema = z.object({ questionId: z.string().min(1) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const locale = isLocale(user.locale) ? user.locale : "en";
  const text = questionTextFor(parsed.data.questionId, profileFromUser(user), locale);
  if (!text) return NextResponse.json({ error: "question" }, { status: 404 });
  const due = isPromptDue(user.nextPromptAt);
  const story = await prisma.story.create({
    data: {
      userId: user.id,
      questionId: parsed.data.questionId,
      questionText: text,
      title: text.length > 80 ? `${text.slice(0, 80).trim()}…` : text,
      formatJson: JSON.stringify(defaultFormat(locale)),
    },
  });
  if (due) {
    const next = computeNextPrompt(new Date(), user.frequency, user.customIntervalDays, user.cycleIndex);
    await prisma.user.update({
      where: { id: user.id },
      data: { nextPromptAt: next.date, cycleIndex: next.cycle },
    });
  }
  return NextResponse.json({ id: story.id });
}
