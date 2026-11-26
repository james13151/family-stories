"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AttachedRecording } from "@/components/attached-recording";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { encodeWavPcm16, mixAndDownsample } from "@/lib/audio/wav";
import { formatClass, firstLetterIsLatin, type StoryFormat } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/types";
import { fillTemplate } from "@/lib/locale";
import { storyToPlain } from "@/lib/sanitize";
import type { StoryPayload } from "@/lib/stories";
import { cn } from "cn";

function clock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function StoryEditor({ dict, story }: { dict: Dictionary; story: StoryPayload }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef(story.title);
  const formatRef = useRef(story.format);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const tick = useRef<number | null>(null);
  const elapsed = useRef(0);
  const saveTimer = useRef<number | null>(null);
  const recordingPresent = useRef(Boolean(story.audio));
  const [title, setTitle] = useState(story.title);
  const [format, setFormat] = useState<StoryFormat>(story.format);
  const [photos, setPhotos] = useState(story.photos);
  const [audio, setAudio] = useState(story.audio);
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const [phase, setPhase] = useState<"idle" | "recording" | "uploading" | "transcribing">("idle");
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState("");
  const [empty, setEmpty] = useState(!storyToPlain(story.bodyHtml));

  useEffect(() => {
    if (editorRef.current && !editorRef.current.dataset.ready) {
      editorRef.current.innerHTML = story.bodyHtml || "<p><br></p>";
      editorRef.current.dataset.ready = "true";
    }
  }, [story.bodyHtml]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);
  useEffect(() => {
    formatRef.current = format;
  }, [format]);

  async function saveNow() {
    setStatus("saving");
    const response = await fetch(`/api/stories/${story.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: titleRef.current,
        bodyHtml: editorRef.current?.innerHTML || "",
        format: formatRef.current,
      }),
    });
    setStatus(response.ok ? "saved" : "error");
    if (!response.ok) setNote(dict.editor.saveFailed);
  }

  function schedule() {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setStatus("saving");
    saveTimer.current = window.setTimeout(() => void saveNow(), 700);
  }

  function refreshEmpty() {
    setEmpty(!storyToPlain(editorRef.current?.innerHTML || ""));
  }

  function command(name: "bold" | "italic" | "underline") {
    editorRef.current?.focus();
    document.execCommand(name);
    schedule();
  }

  function updateFormat(next: Partial<StoryFormat>) {
    const value = { ...formatRef.current, ...next };
    formatRef.current = value;
    setFormat(value);
    schedule();
  }

  function stopRecording() {
    if (tick.current) window.clearInterval(tick.current);
    recorder.current?.stop();
  }

  async function blobToWav(blob: Blob) {
    const context = new AudioContext();
    try {
      const decoded = await context.decodeAudioData(await blob.arrayBuffer());
      const samples = mixAndDownsample(decoded, 16000);
      return new Blob([encodeWavPcm16(samples, 16000)], { type: "audio/wav" });
    } catch {
      return null;
    } finally {
      await context.close();
    }
  }

  async function finishRecording(blob: Blob) {
    stream.current?.getTracks().forEach((track) => track.stop());
    setPhase("uploading");
    const wav = await blobToWav(blob);
    const file = wav || blob;
    const body = new FormData();
    body.set("file", new File([file], wav ? "story.wav" : "story.bin", { type: file.type || "application/octet-stream" }));
    body.set("duration", String(elapsed.current));
    const saved = await fetch(`/api/stories/${story.id}/audio`, { method: "POST", body });
    const savedPayload = (await saved.json()) as { audio?: StoryPayload["audio"]; error?: string };
    if (!saved.ok || !savedPayload.audio) {
      setPhase("idle");
      setNote(dict.editor.sttFailed);
      return;
    }
    recordingPresent.current = true;
    setAudio(savedPayload.audio);
    setNote(dict.editor.savedAudio);
    if (!wav) {
      setPhase("idle");
      setNote(dict.editor.sttFailed);
      return;
    }
    setPhase("transcribing");
    setNote(dict.editor.transcribing);
    const slow = window.setTimeout(() => setNote(dict.editor.preparing), 2500);
    const transcribed = await fetch(`/api/stories/${story.id}/transcribe`, { method: "POST" });
    window.clearTimeout(slow);
    if (!recordingPresent.current) {
      setPhase("idle");
      return;
    }
    const payload = (await transcribed.json()) as { text?: string; error?: string };
    setPhase("idle");
    if (!transcribed.ok) {
      setNote(dict.editor.sttFailed);
      return;
    }
    if (!payload.text) {
      setNote(dict.editor.sttEmpty);
      return;
    }
    const root = editorRef.current;
    if (root) {
      if (!storyToPlain(root.innerHTML)) root.innerHTML = "";
      const paragraph = document.createElement("p");
      paragraph.textContent = payload.text;
      root.appendChild(paragraph);
      refreshEmpty();
      await saveNow();
    }
    setNote(dict.editor.savedAudio);
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNote(dict.editor.micMissing);
      return;
    }
    try {
      const live = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = live;
      chunks.current = [];
      const media = new MediaRecorder(live);
      recorder.current = media;
      media.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      media.onstop = () => {
        const recorded = new Blob(chunks.current, { type: media.mimeType || "audio/webm" });
        void finishRecording(recorded);
      };
      elapsed.current = 0;
      setSeconds(0);
      media.start();
      setPhase("recording");
      setNote(dict.editor.limit);
      tick.current = window.setInterval(() => {
        elapsed.current += 1;
        setSeconds(elapsed.current);
        if (elapsed.current >= 15 * 60) stopRecording();
      }, 1000);
    } catch {
      setNote(dict.editor.micDenied);
    }
  }

  async function addPhoto(file: File | undefined) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setNote(dict.editor.tooBig);
      return;
    }
    const body = new FormData();
    body.set("file", file);
    const response = await fetch(`/api/stories/${story.id}/photos`, { method: "POST", body });
    const payload = (await response.json()) as { photo?: { id: string; caption: string }; error?: string };
    if (!response.ok || !payload.photo) {
      setNote(payload.error === "type" ? dict.editor.badType : dict.common.error);
      return;
    }
    setPhotos((current) => [...current, payload.photo!]);
  }

  async function saveCaption(id: string, caption: string) {
    setPhotos((current) => current.map((photo) => (photo.id === id ? { ...photo, caption } : photo)));
    await fetch(`/api/stories/${story.id}/photos/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ caption }),
    });
  }

  async function removePhoto(id: string) {
    const response = await fetch(`/api/stories/${story.id}/photos/${id}`, { method: "DELETE" });
    if (response.ok) setPhotos((current) => current.filter((photo) => photo.id !== id));
  }

  const plain = storyToPlain(editorRef.current?.innerHTML || story.bodyHtml);
  const pageClass = formatClass(format, firstLetterIsLatin(plain));

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#6d5e4c]">{status === "saving" ? dict.common.saving : status === "error" ? dict.editor.saveFailed : dict.common.saved}</p>
        <Link href={`/stories/${story.id}`} className="inline-flex h-12 items-center rounded-xl bg-[#8d3b2e] px-5 text-[#fffaf3]" onClick={(event) => { event.preventDefault(); void saveNow().then(() => { window.location.href = `/stories/${story.id}`; }); }}>
          {dict.editor.preview}
        </Link>
      </div>
      {story.childName ? <p className="text-sm text-[#6d5e4c]">{fillTemplate(dict.child.forChild, { name: story.childName })}</p> : null}
      <p className="text-lg text-[#8d3b2e]">{story.questionText}</p>
      <label className="mt-4 block text-sm text-[#6d5e4c]">
        {dict.editor.titleLabel}
        <Input className="mt-1 h-12 px-4 text-lg md:text-lg" value={title} onChange={(event) => { setTitle(event.target.value); schedule(); }} />
      </label>

      <div className="no-print mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="h-11" onClick={() => command("bold")}>{dict.editor.bold}</Button>
        <Button type="button" variant="outline" className="h-11" onClick={() => command("italic")}>{dict.editor.italic}</Button>
        <Button type="button" variant="outline" className="h-11" onClick={() => command("underline")}>{dict.editor.underline}</Button>
        <select className="h-11 rounded-xl border border-[#e0d3bf] bg-white px-3" aria-label={dict.editor.font} value={format.font} onChange={(event) => updateFormat({ font: event.target.value as StoryFormat["font"] })}>
          <option value="serif">{dict.editor.fontSerif}</option>
          <option value="sans">{dict.editor.fontSans}</option>
        </select>
        <select className="h-11 rounded-xl border border-[#e0d3bf] bg-white px-3" aria-label={dict.editor.size} value={format.size} onChange={(event) => updateFormat({ size: event.target.value as StoryFormat["size"] })}>
          <option value="comfortable">{dict.editor.sizeComfortable}</option>
          <option value="large">{dict.editor.sizeLarge}</option>
          <option value="xlarge">{dict.editor.sizeXlarge}</option>
        </select>
        <select className="h-11 rounded-xl border border-[#e0d3bf] bg-white px-3" aria-label={dict.editor.align} value={format.align} onChange={(event) => updateFormat({ align: event.target.value as StoryFormat["align"] })}>
          <option value="left">{dict.editor.alignLeft}</option>
          <option value="center">{dict.editor.alignCenter}</option>
          <option value="justify">{dict.editor.alignJustify}</option>
        </select>
        <select className="h-11 rounded-xl border border-[#e0d3bf] bg-white px-3" aria-label={dict.editor.spacing} value={format.lineHeight} onChange={(event) => updateFormat({ lineHeight: event.target.value as StoryFormat["lineHeight"] })}>
          <option value="normal">{dict.editor.spacingNormal}</option>
          <option value="relaxed">{dict.editor.spacingRelaxed}</option>
          <option value="loose">{dict.editor.spacingLoose}</option>
        </select>
        <Button type="button" variant={format.indent ? "default" : "outline"} className="h-11" onClick={() => updateFormat({ indent: !format.indent })}>{dict.editor.indent}</Button>
        <Button type="button" variant={format.dropCap ? "default" : "outline"} className="h-11" onClick={() => updateFormat({ dropCap: !format.dropCap })}>{dict.editor.dropCap}</Button>
      </div>

      <div className={cn("book-sheet mt-4 min-h-[50vh] p-6 sm:p-10", pageClass)}>
        <div
          ref={editorRef}
          className="book-editor min-h-[40vh]"
          contentEditable
          role="textbox"
          aria-multiline="true"
          data-placeholder={dict.editor.placeholder}
          data-empty={empty ? "true" : "false"}
          onInput={() => { refreshEmpty(); schedule(); }}
          onPaste={(event) => {
            event.preventDefault();
            const text = event.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
            schedule();
          }}
        />
      </div>
      <p className="mt-3 text-[#6d5e4c]">{dict.editor.typeHint}</p>

      <div className="no-print mt-4">
        {phase === "recording" ? (
          <div className="rounded-3xl bg-[#8d3b2e] p-6 text-center text-[#fffaf3]">
            <p className="text-lg">{dict.editor.listening}</p>
            <p className="mt-2 font-book text-5xl">{clock(seconds)}</p>
            <Button type="button" className="mt-4 h-14 bg-[#fffaf3] px-6 text-lg text-[#8d3b2e]" onClick={stopRecording}>{dict.editor.stop}</Button>
          </div>
        ) : (
          <Button type="button" className="h-14 w-full text-lg" disabled={phase !== "idle"} onClick={() => void startRecording()}>
            {phase === "idle" ? (audio ? dict.editor.recordAgain : dict.editor.speak) : dict.common.loading}
          </Button>
        )}
        {note ? <p className="mt-3 text-base">{note}</p> : null}
        {audio ? (
          <AttachedRecording
            dict={dict}
            storyId={story.id}
            audioId={audio.id}
            label={dict.editor.savedAudio}
            disabled={phase === "recording" || phase === "uploading"}
            onRemoved={() => {
              recordingPresent.current = false;
              setAudio(null);
              setNote(dict.editor.recordingRemoved);
            }}
          />
        ) : null}
      </div>

      <div className="mt-8">
        <label className="inline-flex h-12 cursor-pointer items-center rounded-xl border border-[#e0d3bf] bg-white px-4">
          {dict.editor.addPhoto}
          <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { void addPhoto(event.target.files?.[0]); event.target.value = ""; }} />
        </label>
        <p className="mt-2 text-sm text-[#6d5e4c]">{dict.editor.photoHint}</p>
        <div className="mt-4 space-y-4">
          {photos.map((photo) => (
            <figure key={photo.id} className="book-sheet overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/media/photo/${photo.id}`} alt={photo.caption || ""} className="max-h-80 w-full object-contain bg-[#f7f1e7]" />
              <div className="space-y-2 p-4">
                <Input aria-label={dict.editor.caption} placeholder={dict.editor.captionPh} defaultValue={photo.caption} onBlur={(event) => void saveCaption(photo.id, event.target.value)} />
                <button type="button" className="text-sm text-[#8d3b2e]" onClick={() => void removePhoto(photo.id)}>{dict.editor.removePhoto}</button>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
