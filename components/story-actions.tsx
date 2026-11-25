"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Dictionary } from "@/lib/i18n/types";

export function StoryActions({ dict, storyId }: { dict: Dictionary; storyId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    const response = await fetch(`/api/stories/${storyId}`, { method: "DELETE" });
    if (response.ok) window.location.href = "/stories";
    setPending(false);
  }

  return (
    <div className="no-print mb-4 flex flex-wrap gap-2">
      <Link href={`/stories/${storyId}/edit`} className="inline-flex h-12 items-center rounded-xl bg-[#8d3b2e] px-5 text-[#fffaf3]">{dict.common.edit}</Link>
      <Link href={`/stories/${storyId}/booklet`} className="inline-flex h-12 items-center rounded-xl border border-[#e0d3bf] bg-white px-5">{dict.piece.open}</Link>
      <Button type="button" variant="ghost" className="h-12 px-5 text-[#8d3b2e]" onClick={() => setOpen(true)}>{dict.common.delete}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.stories.deleteTitle}</DialogTitle>
            <DialogDescription>{dict.stories.deleteBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{dict.common.cancel}</Button>
            <Button type="button" disabled={pending} onClick={() => void remove()}>{dict.common.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
