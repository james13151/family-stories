import { consumeDueSlot, computeNextPrompt, quotaFor, reconcileWindow } from "../lib/frequency";

const errors: string[] = [];
function assert(condition: boolean, message: string) {
  if (!condition) errors.push(message);
}

const now = new Date("2026-06-01T08:00:00Z");

assert(quotaFor("daily", 3) === 3, "daily quota");
assert(quotaFor("daily", 9) === 5, "daily quota cap");
assert(quotaFor("weekly", 4) === 1, "weekly stays one");

const first = consumeDueSlot({
  now,
  nextPromptAt: now,
  promptsLeft: 3,
  frequency: "daily",
  promptsPerDay: 3,
  customDays: 14,
  cycle: 0,
});
assert(first.promptsLeft === 2 && !first.closed, "first daily answer keeps the window open");
assert(first.nextPromptAt.getTime() <= now.getTime(), "open window stays due");

const second = consumeDueSlot({
  now,
  nextPromptAt: first.nextPromptAt,
  promptsLeft: first.promptsLeft,
  frequency: "daily",
  promptsPerDay: 3,
  customDays: 14,
  cycle: 0,
});
assert(second.promptsLeft === 1 && !second.closed, "second daily answer still due");

const third = consumeDueSlot({
  now,
  nextPromptAt: second.nextPromptAt,
  promptsLeft: second.promptsLeft,
  frequency: "daily",
  promptsPerDay: 3,
  customDays: 14,
  cycle: 0,
});
assert(third.closed && third.promptsLeft === 0, "last daily answer closes the window");
const day = 24 * 60 * 60 * 1000;
assert(third.nextPromptAt.getTime() - now.getTime() >= day - 60_000, "next daily window is about a day later");

const weekly = consumeDueSlot({
  now,
  nextPromptAt: now,
  promptsLeft: 1,
  frequency: "weekly",
  promptsPerDay: 3,
  customDays: 14,
  cycle: 0,
});
assert(weekly.closed, "weekly answer closes");
assert(weekly.nextPromptAt.getTime() - now.getTime() >= 7 * day - 60_000, "weekly waits seven days");

const refill = reconcileWindow({
  now,
  nextPromptAt: now,
  promptsLeft: 0,
  frequency: "daily",
  promptsPerDay: 3,
  customDays: 14,
  cycle: 0,
});
assert(refill.due && refill.refilled && refill.promptsLeft === 3, "empty due window refills");

const waiting = reconcileWindow({
  now,
  nextPromptAt: new Date(now.getTime() + day),
  promptsLeft: 0,
  frequency: "daily",
  promptsPerDay: 3,
  customDays: 14,
  cycle: 0,
});
assert(!waiting.due && !waiting.refilled && waiting.promptsLeft === 0, "future window does not refill early");

const kept = reconcileWindow({
  now,
  nextPromptAt: now,
  promptsLeft: 2,
  frequency: "daily",
  promptsPerDay: 3,
  customDays: 14,
  cycle: 0,
});
assert(kept.due && !kept.refilled && kept.promptsLeft === 2, "remaining slots are not reshuffled");

const twiceA = computeNextPrompt(now, "twice_weekly", 14, 0);
const twiceB = computeNextPrompt(twiceA.date, "twice_weekly", 14, twiceA.cycle);
assert(twiceA.cycle === 1 && twiceA.date.getTime() - now.getTime() >= 3 * day - 60_000, "twice weekly first gap");
assert(twiceB.cycle === 2 && twiceB.date.getTime() - twiceA.date.getTime() >= 4 * day - 60_000, "twice weekly second gap");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Prompt schedule OK: daily slots stay open until the last one, then the next day.");
