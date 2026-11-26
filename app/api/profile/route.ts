import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clampDays, clampPrompts, isFrequency, isPromptDue, quotaFor } from "@/lib/frequency";
import { isLocale } from "@/lib/locale";
import { FAMILY_ROLES, OPEN_TOPIC_IDS, SKIP_TOPIC_IDS } from "@/lib/profile";

const schema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  locale: z.string().optional(),
  familyRole: z.string().max(40).optional(),
  childhoodPlace: z.string().max(160).optional(),
  placesLived: z.string().max(240).optional(),
  occupation: z.string().max(160).optional(),
  importantPeople: z.string().max(240).optional(),
  hobbies: z.string().max(240).optional(),
  openTopics: z.array(z.string()).optional(),
  skipTopics: z.array(z.string()).optional(),
  frequency: z.string().optional(),
  customIntervalDays: z.number().optional(),
  promptsPerDay: z.number().optional(),
  onboarded: z.boolean().optional(),
});

function keep(values: string[] | undefined, allowed: readonly string[]) {
  return (values || []).filter((value) => allowed.includes(value));
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const data = parsed.data;
  const becomingReady = data.onboarded === true && !user.onboarded;
  const nextFrequency = data.frequency && isFrequency(data.frequency) ? data.frequency : user.frequency;
  const nextPerDay = data.promptsPerDay !== undefined ? clampPrompts(data.promptsPerDay) : user.promptsPerDay;
  const paceChanged = nextFrequency !== user.frequency || nextPerDay !== user.promptsPerDay;
  const quota = quotaFor(nextFrequency, nextPerDay);
  const windowPatch = becomingReady
    ? { nextPromptAt: new Date(), promptsLeft: quota }
    : paceChanged
      ? isPromptDue(user.nextPromptAt)
        ? { promptsLeft: quota }
        : { promptsLeft: 0 }
      : {};
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name?.trim() || undefined,
      locale: data.locale && isLocale(data.locale) ? data.locale : undefined,
      familyRole: data.familyRole !== undefined && (data.familyRole === "" || FAMILY_ROLES.includes(data.familyRole as (typeof FAMILY_ROLES)[number])) ? data.familyRole : undefined,
      childhoodPlace: data.childhoodPlace?.trim(),
      placesLived: data.placesLived?.trim(),
      occupation: data.occupation?.trim(),
      importantPeople: data.importantPeople?.trim(),
      hobbies: data.hobbies?.trim(),
      openTopics: data.openTopics ? JSON.stringify(keep(data.openTopics, OPEN_TOPIC_IDS)) : undefined,
      skipTopics: data.skipTopics ? JSON.stringify(keep(data.skipTopics, SKIP_TOPIC_IDS)) : undefined,
      frequency: data.frequency && isFrequency(data.frequency) ? data.frequency : undefined,
      customIntervalDays: data.customIntervalDays !== undefined ? clampDays(data.customIntervalDays) : undefined,
      promptsPerDay: data.promptsPerDay !== undefined ? clampPrompts(data.promptsPerDay) : undefined,
      onboarded: data.onboarded ?? undefined,
      ...windowPatch,
    },
  });
  return NextResponse.json({ ok: true, onboarded: updated.onboarded });
}
