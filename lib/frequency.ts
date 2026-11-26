export const FREQUENCIES = ["daily", "weekly", "twice_weekly", "monthly", "custom"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const MAX_PROMPTS_PER_DAY = 5;

export function isFrequency(value: string): value is Frequency {
  return (FREQUENCIES as readonly string[]).includes(value);
}

export function clampDays(days: number) {
  if (!Number.isFinite(days)) return 14;
  return Math.min(365, Math.max(1, Math.round(days)));
}

export function clampPrompts(count: number) {
  if (!Number.isFinite(count)) return 1;
  return Math.min(MAX_PROMPTS_PER_DAY, Math.max(1, Math.round(count)));
}

/** How many due life questions a window offers. Only a daily pace offers more than one. */
export function quotaFor(frequency: string, promptsPerDay: number) {
  if (frequency === "daily") return clampPrompts(promptsPerDay);
  return 1;
}

export function computeNextPrompt(
  from: Date,
  frequency: string,
  customDays: number,
  cycle: number,
) {
  const date = new Date(from.getTime());
  let nextCycle = cycle;
  if (frequency === "daily") {
    date.setDate(date.getDate() + 1);
  } else if (frequency === "weekly") {
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

export type WindowInput = {
  now?: Date;
  nextPromptAt: Date | null;
  promptsLeft: number;
  frequency: string;
  promptsPerDay: number;
  customDays: number;
  cycle: number;
};

/**
 * A due window with an empty counter is a new day (or the first day).
 * Fill it with today's quota. A future invitation is left alone.
 */
export function reconcileWindow(input: WindowInput) {
  const now = input.now ?? new Date();
  const due = isPromptDue(input.nextPromptAt, now);
  if (!due) return { due: false, promptsLeft: input.promptsLeft, refilled: false };
  if (input.promptsLeft > 0) return { due: true, promptsLeft: input.promptsLeft, refilled: false };
  return { due: true, promptsLeft: quotaFor(input.frequency, input.promptsPerDay), refilled: true };
}

/**
 * Starting a due life story uses one slot. Switching a suggestion does not call this.
 * The window stays open until the last slot is used.
 */
export function consumeDueSlot(input: WindowInput) {
  const now = input.now ?? new Date();
  const opened = reconcileWindow({ ...input, now });
  if (!opened.due) {
    return {
      promptsLeft: input.promptsLeft,
      nextPromptAt: input.nextPromptAt ?? now,
      cycleIndex: input.cycle,
      closed: false,
    };
  }
  const left = opened.promptsLeft - 1;
  if (left > 0) {
    return {
      promptsLeft: left,
      nextPromptAt: input.nextPromptAt && input.nextPromptAt.getTime() <= now.getTime() ? input.nextPromptAt : now,
      cycleIndex: input.cycle,
      closed: false,
    };
  }
  const next = computeNextPrompt(now, input.frequency, input.customDays, input.cycle);
  return {
    promptsLeft: 0,
    nextPromptAt: next.date,
    cycleIndex: next.cycle,
    closed: true,
  };
}
