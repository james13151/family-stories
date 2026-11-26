import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { defaultFormat } from "@/lib/format";
import { consumeDueSlot, isPromptDue } from "@/lib/frequency";
import { fillTemplate, isLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";
import { profileFromUser } from "@/lib/profile";
import { CHILD_PLACES, CHILD_STAGES, CHILD_THEMES } from "@/lib/questions/child";
import { childQuestionById, childQuestionText } from "@/lib/questions/child-bank";
import { questionTextFor } from "@/lib/questions/personalize";

const schema = z.object({
  questionId: z.string().min(1).optional(),
  childName: z.string().max(80).optional(),
  theme: z.string().max(40).optional(),
  stage: z.string().max(40).optional(),
  place: z.string().max(40).optional(),
  free: z.boolean().optional(),
});

function clip(text: string) {
  return text.length > 80 ? `${text.slice(0, 80).trim()}…` : text;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const locale = isLocale(user.locale) ? user.locale : "en";
  const childName = parsed.data.childName?.trim() || "";
  const formatJson = JSON.stringify(defaultFormat(locale));

  if (parsed.data.free) {
    if (!childName) return NextResponse.json({ error: "name" }, { status: 400 });
    const theme = parsed.data.theme || "everyday";
    const stage = parsed.data.stage || "growing";
    const place = parsed.data.place || "home";
    if (!CHILD_THEMES.includes(theme as (typeof CHILD_THEMES)[number])) return NextResponse.json({ error: "theme" }, { status: 400 });
    if (!CHILD_STAGES.includes(stage as (typeof CHILD_STAGES)[number])) return NextResponse.json({ error: "stage" }, { status: 400 });
    if (!CHILD_PLACES.includes(place as (typeof CHILD_PLACES)[number])) return NextResponse.json({ error: "place" }, { status: 400 });
    const text = fillTemplate(getDictionary(locale).child.freeKicker, { name: childName });
    const story = await prisma.story.create({
      data: {
        userId: user.id,
        questionText: text,
        title: text,
        formatJson,
        kind: "child",
        childName,
        theme,
        stage,
        place,
      },
    });
    return NextResponse.json({ id: story.id });
  }

  if (!parsed.data.questionId) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const childQuestion = childQuestionById(parsed.data.questionId);
  if (childQuestion) {
    const text = childQuestionText(childQuestion.id, locale, childName);
    const story = await prisma.story.create({
      data: {
        userId: user.id,
        questionId: childQuestion.id,
        questionText: text,
        title: clip(text),
        formatJson,
        kind: "child",
        childName,
        theme: childQuestion.theme,
        stage: childQuestion.stage,
        place: childQuestion.places?.[0] || "",
      },
    });
    return NextResponse.json({ id: story.id });
  }

  const text = questionTextFor(parsed.data.questionId, profileFromUser(user), locale);
  if (!text) return NextResponse.json({ error: "question" }, { status: 404 });
  const due = isPromptDue(user.nextPromptAt);
  const story = await prisma.story.create({
    data: {
      userId: user.id,
      questionId: parsed.data.questionId,
      questionText: text,
      title: clip(text),
      formatJson,
    },
  });
  if (due) {
    const next = consumeDueSlot({
      nextPromptAt: user.nextPromptAt,
      promptsLeft: user.promptsLeft,
      frequency: user.frequency,
      promptsPerDay: user.promptsPerDay,
      customDays: user.customIntervalDays,
      cycle: user.cycleIndex,
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { nextPromptAt: next.nextPromptAt, promptsLeft: next.promptsLeft, cycleIndex: next.cycleIndex },
    });
  }
  return NextResponse.json({ id: story.id });
}
