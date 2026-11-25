import { QUESTIONS } from "../lib/questions/bank";

const errors: string[] = [];
const ids = new Set<string>();

if (QUESTIONS.length < 100) errors.push(`question bank has ${QUESTIONS.length}, need at least 100`);

for (const question of QUESTIONS) {
  if (ids.has(question.id)) errors.push(`duplicate id ${question.id}`);
  ids.add(question.id);
  if (question.en.trim().length < 12) errors.push(`short en ${question.id}`);
  if (question.hans.trim().length < 8) errors.push(`short hans ${question.id}`);
  if (question.hant.trim().length < 8) errors.push(`short hant ${question.id}`);
  if (question.hans === question.hant) errors.push(`simplified and traditional are identical for ${question.id}`);
  const pairs: [string, string | undefined][] = [
    [question.en, question.enFallback],
    [question.hans, question.hansFallback],
    [question.hant, question.hantFallback],
  ];
  for (const [text, fallback] of pairs) {
    if (text.includes("{") && (!fallback || fallback.includes("{"))) {
      errors.push(`missing fallback for ${question.id}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Question bank OK: ${QUESTIONS.length} questions in English, Simplified Chinese, and Traditional Chinese.`);
