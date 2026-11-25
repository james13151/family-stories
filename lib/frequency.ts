export const FREQUENCIES = ["weekly", "twice_weekly", "monthly", "custom"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export function isFrequency(value: string): value is Frequency {
  return (FREQUENCIES as readonly string[]).includes(value);
}

export function clampDays(days: number) {
  if (!Number.isFinite(days)) return 14;
  return Math.min(365, Math.max(1, Math.round(days)));
}

export function computeNextPrompt(
  from: Date,
  frequency: string,
  customDays: number,
  cycle: number,
) {
  const date = new Date(from.getTime());
  let nextCycle = cycle;
  if (frequency === "weekly") {
    date.setDate(date.getDate() + 7);
  } else if (frequency === "twice_weekly") {
    date.setDate(date.getDate() + (cycle % 2 === 0 ? 3 : 4));
    nextCycle = cycle + 1;
  } else if (frequency === "monthly") {
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + 1);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(day, last));
  } else {
    date.setDate(date.getDate() + clampDays(customDays));
  }
  return { date, cycle: nextCycle };
}

export function isPromptDue(nextPromptAt: Date | null | undefined, now = new Date()) {
  if (!nextPromptAt) return true;
  return nextPromptAt.getTime() <= now.getTime();
}
