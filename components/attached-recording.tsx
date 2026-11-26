"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Dictionary } from "@/lib/i18n/types";

export function AttachedRecording({
  dict,
  storyId,
  audioId,
  label,
  framed = false,
  disabled = false,
  onRemoved,
}: {
  dict: Dictionary;
  storyId: string;
  audioId: string;
  label: string;
  framed?: boolean;
  disabled?: boolean;
  onRemoved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [gone, setGone] = useState(false);

  async function remove() {
    setPending(true);
    setFailed(false);
    const response = await fetch(`/api/stories/${storyId}/audio`, { method: "DELETE" });
    setPending(false);
    if (!response.ok) {
      setFailed(true);
      return;
    }
    setOpen(false);
    setGone(true);
    onRemoved?.();
  }

  if (gone) {
    if (!framed) return null;
    return <p className="no-print mb-6 text-base text-[#6d5e4c]">{dict.editor.recordingRemoved}</p>;
  }

  const player = (
    <>
      <p className={framed ? "mb-2" : "mb-2 text-sm text-[#6d5e4c]"}>{label}</p>
      <audio className="w-full" controls preload="metadata" src={`/api/media/audio/${audioId}`} />
      <div className="mt-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full px-5 text-base text-[#8d3b2e] sm:w-auto"
          disabled={disabled || pending}
          onClick={() => {
            setFailed(false);
            setOpen(true);
          }}
        >
          {dict.editor.removeRecording}
        </Button>
      </div>
      <Dialog open={open} onOpenChange={(next) => { if (!pending) setOpen(next); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg">{dict.editor.removeRecordingTitle}</DialogTitle>
            <DialogDescription className="text-base leading-relaxed text-[#4d4032]">{dict.editor.removeRecordingBody}</DialogDescription>
          </DialogHeader>
          {failed ? <p className="text-base text-[#8d3b2e]">{dict.common.error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="h-12 px-5 text-base" disabled={pending} onClick={() => setOpen(false)}>
              {dict.common.cancel}
            </Button>
            <Button type="button" className="h-12 px-5 text-base" disabled={pending} onClick={() => void remove()}>
              {pending ? dict.common.loading : dict.editor.removeRecording}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (!framed) return <div className="mt-4">{player}</div>;
  return <div className="no-print mb-6 rounded-2xl bg-[#fffaf3] p-4 ring-1 ring-[#e0d3bf]">{player}</div>;
}
