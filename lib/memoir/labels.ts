import type { Dictionary } from "@/lib/i18n/types";
import { fillTemplate } from "@/lib/locale";
import { childThemeLabel, memoryStageLabel } from "@/lib/memory-labels";
import type { MemoirGrouping } from "@/lib/memoir";

export function memoirChapterTitle(dict: Dictionary, author: string, id: string, grouping: MemoirGrouping) {
  if (grouping === "person") {
    if (id === "self") return fillTemplate(dict.booklet.ownLife, { name: author });
    const name = id.startsWith("child:") ? id.slice("child:".length) : "";
    return name && name !== "_" ? fillTemplate(dict.booklet.forChild, { name }) : dict.booklet.forAChild;
  }
  if (id === "other") return dict.booklet.other;
  if (grouping === "theme") return childThemeLabel(dict, id);
  return memoryStageLabel(dict, id || "across-life");
}
