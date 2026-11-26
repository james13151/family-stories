"use client";

import { useMemo, useState } from "react";
import { Booklet, type BookletStory } from "@/components/booklet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/lib/i18n/types";
import { memoirChapterTitle } from "@/lib/memoir/labels";
import {
  chapterKey,
  mergeStructure,
  type MemoirGrouping,
  type MemoirSource,
  type MemoirTrim,
} from "@/lib/memoir";

type Chapter = { id: string; title: string; storyIds: string[] };

export function MemoirEditor({
  dict,
  author,
  compiled,
  stories,
  initial,
}: {
  dict: Dictionary;
  author: string;
  compiled: string;
  stories: BookletStory[];
  initial: {
    title: string;
    subtitle: string;
    authorName: string;
    grouping: MemoirGrouping;
    dedication: string;
    preface: string;
    trim: MemoirTrim;
    chapters: Chapter[];
    excluded: string[];
  };
}) {
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [authorName, setAuthorName] = useState(initial.authorName);
  const [grouping, setGrouping] = useState<MemoirGrouping>(initial.grouping);
  const [dedication, setDedication] = useState(initial.dedication);
  const [preface, setPreface] = useState(initial.preface);
  const [trim, setTrim] = useState<MemoirTrim>(initial.trim);
  const [chapters, setChapters] = useState<Chapter[]>(initial.chapters);
  const [excluded, setExcluded] = useState<string[]>(initial.excluded);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  const byId = useMemo(() => new Map(stories.map((story) => [story.id, story])), [stories]);
  const sources = useMemo<MemoirSource[]>(
    () => stories.map((story) => ({
      id: story.id,
      title: story.title,
      question: story.question,
      createdAt: story.createdAt,
      kind: story.kind,
      childName: story.childName,
      theme: story.theme,
      stage: story.stage,
    })),
    [stories],
  );
  const displayAuthor = authorName.trim() || author;

  function payload() {
    return { title, subtitle, authorName, grouping, dedication, preface, trim, chapters, excluded };
  }

  async function save() {
    setPending(true);
    setNote("");
    const response = await fetch("/api/memoir", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload()),
    });
    setPending(false);
    if (!response.ok) {
      setNote(dict.errors.generic);
      return false;
    }
    const saved = await response.json();
    setChapters(saved.chapters);
    setExcluded(saved.excluded);
    setNote(dict.booklet.saved);
    return true;
  }

  async function download(kind: "pdf" | "epub") {
    const ok = await save();
    if (!ok) return;
    setPending(true);
    try {
      const response = await fetch(`/api/memoir/${kind}`);
      if (!response.ok) {
        setNote(dict.errors.generic);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = kind === "pdf" ? "hearthlight-memoir.pdf" : "hearthlight-memoir.epub";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setPending(false);
    }
  }

  function changeGrouping(next: MemoirGrouping) {
    const merged = mergeStructure(sources, next, { grouping, chapters, excluded }, (id) => memoirChapterTitle(dict, displayAuthor, id, next));
    setGrouping(next);
    setChapters(merged.chapters);
    setExcluded(merged.excluded);
  }

  function moveChapter(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= chapters.length) return;
    const copy = [...chapters];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    setChapters(copy);
  }

  function moveStory(chapterIndex: number, storyIndex: number, delta: number) {
    const ids = [...chapters[chapterIndex].storyIds];
    const target = storyIndex + delta;
    if (target < 0 || target >= ids.length) return;
    const [id] = ids.splice(storyIndex, 1);
    ids.splice(target, 0, id);
    setChapters(chapters.map((chapter, index) => (index === chapterIndex ? { ...chapter, storyIds: ids } : chapter)));
  }

  function leaveOut(id: string) {
    setExcluded((current) => current.includes(id) ? current : [...current, id]);
    setChapters((current) => current
      .map((chapter) => ({ ...chapter, storyIds: chapter.storyIds.filter((storyId) => storyId !== id) }))
      .filter((chapter) => chapter.storyIds.length > 0));
  }

  function putBack(id: string) {
    const story = sources.find((item) => item.id === id);
    if (!story) return;
    const key = chapterKey(story, grouping);
    setExcluded((current) => current.filter((item) => item !== id));
    setChapters((current) => {
      if (current.some((chapter) => chapter.id === key)) {
        return current.map((chapter) => chapter.id === key ? { ...chapter, storyIds: [...chapter.storyIds, id] } : chapter);
      }
      return [...current, { id: key, title: memoirChapterTitle(dict, displayAuthor, key, grouping), storyIds: [id] }];
    });
  }

  return (
    <div>
      <form
        className="no-print book-sheet space-y-5 p-5 sm:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={dict.booklet.bookTitle} value={title} onChange={setTitle} placeholder={dict.booklet.coverTitle} maxLength={120} />
          <Field label={dict.booklet.bookSubtitle} value={subtitle} onChange={setSubtitle} placeholder={dict.booklet.coverSubtitle} maxLength={180} />
          <Field label={dict.booklet.authorName} value={authorName} onChange={setAuthorName} placeholder={author} maxLength={80} />
          <div className="space-y-2">
            <Label htmlFor="memoir-trim">{dict.booklet.trim}</Label>
            <select id="memoir-trim" className="h-12 w-full rounded-xl border border-[#e0d3bf] bg-[#fffaf3] px-3 text-lg" value={trim} onChange={(event) => setTrim(event.target.value as MemoirTrim)}>
              <option value="a5">{dict.booklet.trimA5}</option>
              <option value="trade">{dict.booklet.trimTrade}</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="memoir-dedication">{dict.booklet.dedication}</Label>
          <Textarea id="memoir-dedication" value={dedication} onChange={(event) => setDedication(event.target.value)} className="min-h-24 text-lg" maxLength={800} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="memoir-preface">{dict.booklet.preface}</Label>
          <Textarea id="memoir-preface" value={preface} onChange={(event) => setPreface(event.target.value)} className="min-h-32 text-lg" maxLength={4000} />
        </div>
        <div className="flex flex-wrap gap-2" role="group">
          {([
            ["stage", dict.booklet.byStage],
            ["theme", dict.booklet.byTheme],
            ["person", dict.booklet.byPerson],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" className={`min-h-12 rounded-full border px-4 text-base ${grouping === id ? "border-[#8d3b2e] bg-[#8d3b2e] text-[#fffaf3]" : "border-[#e0d3bf] bg-[#fffaf3]"}`} aria-pressed={grouping === id} onClick={() => changeGrouping(id)}>
              {label}
            </button>
          ))}
        </div>
        <ol className="space-y-4">
          {chapters.map((chapter, chapterIndex) => (
            <li key={chapter.id} className="rounded-2xl border border-[#e0d3bf] p-4">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-48 flex-1 space-y-2">
                  <Label htmlFor={`chapter-${chapter.id}`}>{dict.booklet.chapterTitle}</Label>
                  <Input id={`chapter-${chapter.id}`} value={chapter.title} maxLength={120} className="h-12 text-lg" onChange={(event) => {
                    const value = event.target.value;
                    setChapters((current) => current.map((item, index) => index === chapterIndex ? { ...item, title: value } : item));
                  }} />
                </div>
                <Button type="button" variant="outline" className="h-12" onClick={() => moveChapter(chapterIndex, -1)} disabled={chapterIndex === 0}>{dict.booklet.moveUp}</Button>
                <Button type="button" variant="outline" className="h-12" onClick={() => moveChapter(chapterIndex, 1)} disabled={chapterIndex === chapters.length - 1}>{dict.booklet.moveDown}</Button>
              </div>
              <ol className="mt-3 space-y-2">
                {chapter.storyIds.map((id, storyIndex) => {
                  const story = byId.get(id);
                  if (!story) return null;
                  return (
                    <li key={id} className="flex flex-wrap items-center gap-2">
                      <span className="min-w-40 flex-1 text-lg">{story.title || story.question}</span>
                      <Button type="button" variant="outline" className="h-11" onClick={() => moveStory(chapterIndex, storyIndex, -1)} disabled={storyIndex === 0}>{dict.booklet.moveUp}</Button>
                      <Button type="button" variant="outline" className="h-11" onClick={() => moveStory(chapterIndex, storyIndex, 1)} disabled={storyIndex === chapter.storyIds.length - 1}>{dict.booklet.moveDown}</Button>
                      <Button type="button" variant="outline" className="h-11" onClick={() => leaveOut(id)}>{dict.booklet.leaveOut}</Button>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>
        {excluded.length ? (
          <div>
            <h2 className="text-xl">{dict.booklet.leftOut}</h2>
            <ul className="mt-2 space-y-2">
              {excluded.map((id) => {
                const story = byId.get(id);
                if (!story) return null;
                return (
                  <li key={id} className="flex flex-wrap items-center gap-2">
                    <span className="min-w-40 flex-1 text-lg">{story.title || story.question}</span>
                    <Button type="button" variant="outline" className="h-11" onClick={() => putBack(id)}>{dict.booklet.putBack}</Button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="h-12 px-5" disabled={pending}>{dict.booklet.save}</Button>
          <Button type="button" variant="outline" className="h-12 px-5" disabled={pending} onClick={() => void download("pdf")}>{dict.booklet.downloadPdf}</Button>
          <Button type="button" variant="outline" className="h-12 px-5" disabled={pending} onClick={() => void download("epub")}>{dict.booklet.downloadEpub}</Button>
        </div>
        {note ? <p className="text-lg text-[#4d4032]">{note}</p> : null}
        <p className="text-base leading-relaxed text-[#4d4032]">{dict.booklet.printerNote}</p>
      </form>
      <div className="mt-8">
        <Booklet
          dict={dict}
          author={author}
          compiled={compiled}
          stories={stories}
          edition={{ title, subtitle, author: displayAuthor, dedication, preface, chapters }}
        />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, maxLength }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; maxLength: number }) {
  const id = `memoir-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} placeholder={placeholder} maxLength={maxLength} className="h-12 text-lg" onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
