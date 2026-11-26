import { QUESTIONS } from "../lib/questions/bank";
import { CHILD_QUESTIONS } from "../lib/questions/child-bank";
import { CHILD_PLACES, CHILD_STAGES, CHILD_THEMES } from "../lib/questions/child";
import { FACETS, questionCategories } from "../lib/questions/facets";
import { LIFE_STAGES, LOCATIONS, THEMES, type LifeStage, type Location } from "../lib/questions/types";

const errors: string[] = [];
const ids = new Set<string>();
const stages = new Set<LifeStage>();
const locations = new Set<Location>();
let multiCategory = 0;
let selfDevelopment = 0;
let withPlace = 0;

if (QUESTIONS.length < 290) errors.push(`question bank has ${QUESTIONS.length}, need about 300`);

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
  const facet = FACETS[question.id];
  if (!facet) {
    errors.push(`missing facet ${question.id}`);
  } else {
    if (!LIFE_STAGES.includes(facet.stage)) errors.push(`bad stage ${question.id}`);
    stages.add(facet.stage);
    for (const location of facet.locations ?? []) {
      if (!LOCATIONS.includes(location)) errors.push(`bad location ${question.id} ${location}`);
      locations.add(location);
    }
    if ((facet.locations ?? []).length) withPlace += 1;
    for (const theme of facet.also ?? []) {
      if (!THEMES.includes(theme)) errors.push(`bad extra theme ${question.id} ${theme}`);
      if (theme === question.theme || question.also?.includes(theme)) {
        errors.push(`extra theme repeats ${question.id} ${theme}`);
      }
    }
  }
  const categories = questionCategories(question);
  if (new Set(categories).size !== categories.length) errors.push(`duplicate category ${question.id}`);
  if (categories.length > 1) multiCategory += 1;
  if (categories.includes("self-development")) selfDevelopment += 1;
}

for (const id of Object.keys(FACETS)) {
  if (!ids.has(id)) errors.push(`orphan facet ${id}`);
}
for (const stage of LIFE_STAGES) {
  if (!stages.has(stage)) errors.push(`unused life stage ${stage}`);
}
for (const location of LOCATIONS) {
  if (!locations.has(location)) errors.push(`unused location ${location}`);
}
const countTheme = (theme: (typeof THEMES)[number]) => QUESTIONS.filter((question) => questionCategories(question).includes(theme)).length;
if (multiCategory < 20) errors.push(`only ${multiCategory} questions belong to more than one category`);
if (selfDevelopment < 8) errors.push(`self-development has ${selfDevelopment} questions`);
if (countTheme("work") < 8) errors.push("career category is thin");
if (countTheme("marriage") < 5) errors.push("marriage category is thin");
if (countTheme("children") < 8) errors.push("children category is thin");
if (countTheme("family") < 8) errors.push("family category is thin");
if (withPlace < 20) errors.push(`only ${withPlace} questions have a place`);

if (CHILD_QUESTIONS.length < 40) errors.push(`child bank has ${CHILD_QUESTIONS.length}, need at least 40`);
const childIds = new Set<string>();
const childStages = new Set<string>();
const childPlaces = new Set<string>();
let childMulti = 0;
for (const question of CHILD_QUESTIONS) {
  if (ids.has(question.id) || childIds.has(question.id)) errors.push(`duplicate child id ${question.id}`);
  childIds.add(question.id);
  if (!question.id.startsWith("kid-")) errors.push(`child id should start with kid- ${question.id}`);
  if (question.hans === question.hant) errors.push(`child hans and hant match ${question.id}`);
  if (!CHILD_THEMES.includes(question.theme)) errors.push(`bad child theme ${question.id}`);
  if (!CHILD_STAGES.includes(question.stage)) errors.push(`bad child stage ${question.id}`);
  childStages.add(question.stage);
  for (const place of question.places ?? []) {
    if (!CHILD_PLACES.includes(place)) errors.push(`bad child place ${question.id}`);
    childPlaces.add(place);
  }
  for (const theme of question.also ?? []) {
    if (!CHILD_THEMES.includes(theme) || theme === question.theme) errors.push(`bad child also ${question.id}`);
  }
  if ((question.also?.length ?? 0) > 0) childMulti += 1;
  const pairs: [string, string | undefined][] = [
    [question.en, question.enFallback],
    [question.hans, question.hansFallback],
    [question.hant, question.hantFallback],
  ];
  for (const [text, fallback] of pairs) {
    if (text.includes("{") && (!fallback || fallback.includes("{"))) errors.push(`child missing fallback ${question.id}`);
  }
}
for (const stage of CHILD_STAGES) {
  if (!childStages.has(stage)) errors.push(`unused child stage ${stage}`);
}
for (const place of CHILD_PLACES) {
  if (!childPlaces.has(place)) errors.push(`unused child place ${place}`);
}
if (childMulti < 4) errors.push("child questions should belong to more than one theme");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Question bank OK: ${QUESTIONS.length} life questions and ${CHILD_QUESTIONS.length} child questions, in English, Simplified Chinese, and Traditional Chinese.`);
