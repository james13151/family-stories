import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getRequestDictionary } from "@/lib/request-locale";
import { isMemoirGrouping, isMemoirTrim, type MemoirStructure } from "@/lib/memoir";
import { saveMemoirDraft } from "@/lib/memoir/compose";

const schema = z.object({
  title: z.string().max(120),
  subtitle: z.string().max(180),
  authorName: z.string().max(80),
  grouping: z.string(),
  dedication: z.string().max(800),
  preface: z.string().max(4000),
  trim: z.string(),
  chapters: z.array(z.object({
    id: z.string().min(1).max(80),
    title: z.string().max(120),
    storyIds: z.array(z.string().min(1).max(80)).max(500),
  })).max(80),
  excluded: z.array(z.string().max(80)).max(500),
});

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const data = parsed.data;
  if (!isMemoirGrouping(data.grouping) || !isMemoirTrim(data.trim)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const { dict } = await getRequestDictionary();
  const structure: MemoirStructure = {
    grouping: data.grouping,
    chapters: data.chapters,
    excluded: data.excluded,
  };
  const saved = await saveMemoirDraft(user.id, user.name, dict, {
    title: data.title,
    subtitle: data.subtitle,
    authorName: data.authorName,
    grouping: data.grouping,
    dedication: data.dedication,
    preface: data.preface,
    trim: data.trim,
    structure,
  });
  return NextResponse.json({
    title: saved.title,
    subtitle: saved.subtitle,
    authorName: saved.authorName,
    grouping: saved.grouping,
    dedication: saved.dedication,
    preface: saved.preface,
    trim: saved.trim,
    chapters: saved.structure.chapters,
    excluded: saved.structure.excluded,
  });
}
