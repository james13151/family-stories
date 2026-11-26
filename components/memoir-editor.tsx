"use client";

import { useMemo, useRef, useState } from "react";
import type { BookletStory } from "@/components/booklet";
import { MemoirPreview } from "@/components/memoir-preview";
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
import type { CoverStyle, StoryTemplate } from "@/lib/memoir/design";
import type { PrintCoverCode, PrintPaperCode } from "@/lib/print/catalog";

type Chapter = { id: string; title: string; storyIds: string[] };
type Drag =
  | { list: "chapter"; index: number; chapters: Chapter[] }
  | { list: "story"; chapterIndex: number; index: number; ids: string[] };

const selectClass = "h-12 w-full rounded-xl border border-[#e0d3bf] bg-[#fffaf3] px-3 text-lg";

export function MemoirEditor({
  dict,
  author,
  stories,
  initial,
}: {
  dict: Dictionary;
  author: string;
  stories: BookletStory[];
  initial: {
    title: string;
    subtitle: string;
    authorName: string;
    grouping: MemoirGrouping;
    dedication: string;
    preface: string;
    trim: MemoirTrim;
    cover: PrintCoverCode;
    paper: PrintPaperCode;
    coverStyle: CoverStyle;
    storyTemplate: StoryTemplate;
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
  const [cover, setCover] = useState<PrintCoverCode>(initial.cover);
  const [paper, setPaper] = useState<PrintPaperCode>(initial.paper);
  const [coverStyle, setCoverStyle] = useState<CoverStyle>(initial.coverStyle);
  const [storyTemplate, setStoryTemplate] = useState<StoryTemplate>(initial.storyTemplate);
  const [chapters, setChapters] = useState<Chapter[]>(initial.chapters);
  const [excluded, setExcluded] = useState<string[]>(initial.excluded);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const drag = useRef<Drag | null>(null);

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
    return { title, subtitle, authorName, grouping, dedication, preface, trim, cover, paper, coverStyle, storyTemplate, chapters, excluded };
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
    setCover(saved.cover);
    setPaper(saved.paper);
    setCoverStyle(saved.coverStyle);
    setStoryTemplate(saved.storyTemplate);
    setTrim(saved.trim);
    setNote(dict.booklet.saved);
    return true;
  }

  async function download(kind: "pdf" | "epub" | "txt" | "csv" | "zip") {
    const ok = await save();
    if (!ok) return;
    setPending(true);
    try {
      const path = kind === "pdf" || kind === "epub" ? `/api/memoir/${kind}` : `/api/export/${kind === "zip" ? "archive" : kind}`;
      const filename = {
        pdf: "hearthlight-memoir.pdf",
        epub: "hearthlight-memoir.epub",
        txt: "hearthlight-stories.txt",
        csv: "hearthlight-stories.csv",
        zip: "hearthlight-archive.zip",
      }[kind];
      const response = await fetch(path);
      if (!response.ok) {
        setNote(dict.errors.generic);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
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

  function moveChapter(from: number, to: number) {
    setChapters((current) => reorder(current, from, to));
  }

  function moveStory(chapterIndex: number, from: number, to: number) {
    setChapters((current) => current.map((chapter, index) => {
      if (index !== chapterIndex) return chapter;
      return { ...chapter, storyIds: reorder(chapter.storyIds, from, to) };
    }));
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

  function startDrag(event: React.PointerEvent<HTMLButtonElement>, next: Drag) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = next;
  }

  function moveDrag(event: React.PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current) return;
    const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-drag-list]");
    if (!hit) return;
    const list = hit.getAttribute("data-drag-list");
    const index = Number(hit.getAttribute("data-drag-index"));
    if (!Number.isInteger(index)) return;
    if (current.list === "chapter" && list === "chapter" && index !== current.index) {
      const chaptersNext = reorder(current.chapters, current.index, index);
      current.chapters = chaptersNext;
      current.index = index;
      setChapters(chaptersNext);
    }
    if (current.list === "story" && list === "story" && Number(hit.getAttribute("data-chapter-index")) === current.chapterIndex && index !== current.index) {
      const ids = reorder(current.ids, current.index, index);
      const chapterIndex = current.chapterIndex;
      current.ids = ids;
      current.index = index;
      setChapters((existing) => existing.map((chapter, position) => position === chapterIndex ? { ...chapter, storyIds: ids } : chapter));
    }
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
          <Choice id="memoir-trim" label={dict.booklet.trim} value={trim} onChange={(value) => setTrim(value as MemoirTrim)} options={[
            ["a5", dict.booklet.trimA5],
            ["trade", dict.booklet.trimTrade],
            ["trade-6x9", dict.booklet.trimSixNine],
          ]} />
          <Choice id="memoir-cover" label={dict.booklet.cover} value={cover} onChange={(value) => setCover(value as PrintCoverCode)} options={[
            ["hardcover", dict.booklet.coverHardcover],
            ["softcover", dict.booklet.coverSoftcover],
          ]} />
          <Choice id="memoir-paper" label={dict.booklet.paper} value={paper} onChange={(value) => setPaper(value as PrintPaperCode)} options={[
            ["uncoated", dict.booklet.paperUncoated],
            ["ivory", dict.booklet.paperIvory],
            ["coated", dict.booklet.paperCoated],
          ]} />
          <Choice id="memoir-style" label={dict.booklet.styleLabel} value={coverStyle} onChange={(value) => setCoverStyle(value as CoverStyle)} options={[
            ["seal", dict.booklet.styleSeal],
            ["cloth", dict.booklet.styleCloth],
            ["lane", dict.booklet.styleLane],
          ]} />
          <Choice id="memoir-template" label={dict.booklet.templateLabel} value={storyTemplate} onChange={(value) => setStoryTemplate(value as StoryTemplate)} options={[
            ["classic", dict.booklet.templateClassic],
            ["photo", dict.booklet.templatePhoto],
            ["spread", dict.booklet.templateSpread],
          ]} />
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
            <li key={chapter.id} data-drag-list="chapter" data-drag-index={chapterIndex} className="rounded-2xl border border-[#e0d3bf] bg-[#fffaf3] p-4">
              <div className="flex flex-wrap items-end gap-2">
                <button
                  type="button"
                  className="book-grip mb-1 flex h-12 w-12 items-center justify-center rounded-xl border border-[#e0d3bf] text-xl text-[#6d5e4c]"
                  aria-label={dict.booklet.drag}
                  onPointerDown={(event) => startDrag(event, { list: "chapter", index: chapterIndex, chapters })}
                  onPointerMove={moveDrag}
                  onPointerUp={() => { drag.current = null; }}
                >
                  ⋮⋮
                </button>
                <div className="min-w-48 flex-1 space-y-2">
                  <Label htmlFor={`chapter-${chapter.id}`}>{dict.booklet.chapterTitle}</Label>
                  <Input id={`chapter-${chapter.id}`} value={chapter.title} maxLength={120} className="h-12 text-lg" onChange={(event) => {
                    const value = event.target.value;
                    setChapters((current) => current.map((item, index) => index === chapterIndex ? { ...item, title: value } : item));
                  }} />
                </div>
                <Button type="button" variant="outline" className="h-12" onClick={() => moveChapter(chapterIndex, chapterIndex - 1)} disabled={chapterIndex === 0}>{dict.booklet.moveUp}</Button>
                <Button type="button" variant="outline" className="h-12" onClick={() => moveChapter(chapterIndex, chapterIndex + 1)} disabled={chapterIndex === chapters.length - 1}>{dict.booklet.moveDown}</Button>
              </div>
              <ol className="mt-3 space-y-2">
                {chapter.storyIds.map((id, storyIndex) => {
                  const story = byId.get(id);
                  if (!story) return null;
                  return (
                    <li key={id} data-drag-list="story" data-drag-index={storyIndex} data-chapter-index={chapterIndex} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#f7f1e7] px-2 py-2">
                      <button
                        type="button"
                        className="book-grip flex h-11 w-11 items-center justify-center rounded-lg text-lg text-[#6d5e4c]"
                        aria-label={dict.booklet.drag}
                        onPointerDown={(event) => startDrag(event, { list: "story", chapterIndex, index: storyIndex, ids: chapter.storyIds })}
                        onPointerMove={moveDrag}
                        onPointerUp={() => { drag.current = null; }}
                      >
                        ⋮⋮
                      </button>
                      <span className="min-w-40 flex-1 text-lg">{story.title || story.question}</span>
                      <Button type="button" variant="outline" className="h-11" onClick={() => moveStory(chapterIndex, storyIndex, storyIndex - 1)} disabled={storyIndex === 0}>{dict.booklet.moveUp}</Button>
                      <Button type="button" variant="outline" className="h-11" onClick={() => moveStory(chapterIndex, storyIndex, storyIndex + 1)} disabled={storyIndex === chapter.storyIds.length - 1}>{dict.booklet.moveDown}</Button>
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
          <Button type="button" variant="outline" className="h-12 px-5" disabled={pending} onClick={() => void download("txt")}>{dict.booklet.downloadTxt}</Button>
          <Button type="button" variant="outline" className="h-12 px-5" disabled={pending} onClick={() => void download("csv")}>{dict.booklet.downloadCsv}</Button>
          <Button type="button" variant="outline" className="h-12 px-5" disabled={pending} onClick={() => void download("zip")}>{dict.booklet.downloadZip}</Button>
        </div>
        {note ? <p className="text-lg text-[#4d4032]">{note}</p> : null}
        <p className="text-base leading-relaxed text-[#4d4032]">{dict.booklet.printerNote}</p>
        <p className="text-base leading-relaxed text-[#4d4032]">{dict.booklet.exportsNote}</p>
      </form>
      <div className="book-preview mt-8">
        <MemoirPreview
          dict={dict}
          author={displayAuthor}
          stories={stories}
          title={title}
          subtitle={subtitle}
          dedication={dedication}
          preface={preface}
          chapters={chapters}
          coverStyle={coverStyle}
          binding={cover}
          template={storyTemplate}
        />
      </div>
    </div>
  );
}

function reorder<T>(list: T[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
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

function Choice({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={selectClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([option, name]) => <option key={option} value={option}>{name}</option>)}
      </select>
    </div>
  );
}
