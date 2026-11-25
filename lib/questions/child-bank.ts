import type { ChildPlace, ChildQuestion, ChildStage, ChildTheme } from "@/lib/questions/child";
import type { Locale } from "@/lib/locale";

function q(
  id: string,
  theme: ChildTheme,
  stage: ChildStage,
  en: string,
  hans: string,
  hant: string,
  extra?: {
    also?: ChildTheme[];
    places?: ChildPlace[];
    enFallback?: string;
    hansFallback?: string;
    hantFallback?: string;
  },
): ChildQuestion {
  return { id, theme, stage, en, hans, hant, ...extra };
}

export const CHILD_QUESTIONS: ChildQuestion[] = [
  q(
    "kid-knew-coming",
    "arrival",
    "waiting",
    "What did you feel on the day you knew {childName} was coming?",
    "你知道{childName}要来的那天，心里是什么感觉？",
    "你知道{childName}要來的那天，心裡是什麼感覺？",
    {
      also: ["family"],
      enFallback: "What did you feel on the day you knew a child was coming?",
      hansFallback: "你知道有孩子要来的那天，心里是什么感觉？",
      hantFallback: "你知道有孩子要來的那天，心裡是什麼感覺？",
    },
  ),
  q(
    "kid-room",
    "arrival",
    "newborn",
    "Who was with you when they arrived, and what do you remember of that room?",
    "他们来到身边的时候，谁在旁边？那间屋子你还记得什么？",
    "他們來到身邊的時候，誰在旁邊？那間屋子你還記得什麼？",
    { places: ["home"] },
  ),
  q(
    "kid-first-hold",
    "firsts",
    "newborn",
    "What was it like the first time you held them?",
    "你第一次抱起他们，是什么感觉？",
    "你第一次抱起他們，是什麼感覺？",
    { also: ["arrival"] },
  ),
  q(
    "kid-cry",
    "everyday",
    "newborn",
    "What did the house sound like in those first weeks?",
    "最初那几个星期，家里是什么声音？",
    "最初那幾個星期，家裡是什麼聲音？",
    { places: ["home"] },
  ),
  q(
    "kid-night",
    "everyday",
    "first-year",
    "Tell about one night you were up with them, and what finally let you both rest.",
    "说说你陪着他们醒着的一个夜晚，后来是什么让你们都安下来。",
    "說說你陪著他們醒著的一個夜晚，後來是什麼讓你們都安下來。",
    { places: ["home"] },
  ),
  q(
    "kid-song",
    "everyday",
    "first-year",
    "Which song, or which few words, did you use to settle them?",
    "你用哪首歌，或者哪几句话，来哄他们安静？",
    "你用哪首歌，或者哪幾句話，來哄他們安靜？",
  ),
  q(
    "kid-steps",
    "firsts",
    "toddler",
    "Where were you when {childName} took their first steps?",
    "{childName}第一次自己走路的时候，你在哪里？",
    "{childName}第一次自己走路的時候，你在哪裡？",
    {
      places: ["home"],
      enFallback: "Where were you when they took their first steps?",
      hansFallback: "他们第一次自己走路的时候，你在哪里？",
      hantFallback: "他們第一次自己走路的時候，你在哪裡？",
    },
  ),
  q(
    "kid-word",
    "firsts",
    "toddler",
    "What was the first word you were sure they meant?",
    "你确定他们说出口、并且是有意思的第一个词是什么？",
    "你確定他們說出口、並且是有意思的第一個詞是什麼？",
  ),
  q(
    "kid-food",
    "everyday",
    "toddler",
    "What did they refuse to eat, and what did they ask for again and again?",
    "他们不肯吃什么？又一遍遍要吃什么？",
    "他們不肯吃什麼？又一遍遍要吃什麼？",
    { also: ["family"], places: ["home"] },
  ),
  q(
    "kid-play",
    "everyday",
    "toddler",
    "What did you play together until someone had to call you in?",
    "你们一起玩什么，要玩到有人喊才肯停？",
    "你們一起玩什麼，要玩到有人喊才肯停？",
    { places: ["home"] },
  ),
  q(
    "kid-birthday",
    "birthdays",
    "first-year",
    "What was their first birthday like?",
    "他们的第一个生日是怎样过的？",
    "他們的第一個生日是怎樣過的？",
    { also: ["family"], places: ["home"] },
  ),
  q(
    "kid-birthday-later",
    "birthdays",
    "growing",
    "Which birthday still makes you smile, and what happened that day?",
    "哪一个生日你现在想起来还会笑？那天发生了什么？",
    "哪一個生日你現在想起來還會笑？那天發生了什麼？",
    { also: ["family"] },
  ),
  q(
    "kid-school",
    "school",
    "school-years",
    "Describe the first day they went to school. What did you notice when they came home?",
    "说说他们第一天上学。回到家的时候，你看出了什么？",
    "說說他們第一天上學。回到家的時候，你看出了什麼？",
    { also: ["firsts"], places: ["city", "home"] },
  ),
  q(
    "kid-school-friend",
    "school",
    "school-years",
    "Who did they talk about when they came home from school?",
    "他们放学回家，嘴里说的是哪一个同学？",
    "他們放學回家，嘴裡說的是哪一個同學？",
    { places: ["home"] },
  ),
  q(
    "kid-outing",
    "outings",
    "growing",
    "Tell about a family outing you hope {childName} still remembers.",
    "说说一次出门，你希望{childName}以后还记得。",
    "說說一次出門，你希望{childName}以後還記得。",
    {
      also: ["family"],
      places: ["travel"],
      enFallback: "Tell about a family outing you hope they still remember.",
      hansFallback: "说说一次出门，你希望他们以后还记得。",
      hantFallback: "說說一次出門，你希望他們以後還記得。",
    },
  ),
  q(
    "kid-noticed",
    "outings",
    "growing",
    "What did they notice on a journey, or in a city, that you had stopped seeing?",
    "在路上，或者在一座城里，他们看见了哪件你已经不留意的事？",
    "在路上，或者在一座城裡，他們看見了哪件你已經不留意的事？",
    { places: ["city", "travel"] },
  ),
  q(
    "kid-habit",
    "character",
    "growing",
    "What small habit of theirs is already theirs alone?",
    "他们哪一个小小的习惯，已经完全是他们自己的？",
    "他們哪一個小小的習慣，已經完全是他們自己的？",
  ),
  q(
    "kid-kindness",
    "character",
    "growing",
    "When were you surprised by their kindness?",
    "哪一次，他们的体贴让你没想到？",
    "哪一次，他們的體貼讓你沒想到？",
    { also: ["family"] },
  ),
  q(
    "kid-house",
    "everyday",
    "growing",
    "What does the house sound like when they are home?",
    "他们在家的时候，屋子里是什么声音？",
    "他們在家的時候，屋子裡是什麼聲音？",
    { places: ["home"] },
  ),
  q(
    "kid-ordinary",
    "family",
    "growing",
    "What do you want them to know about how you loved them on an ordinary day?",
    "在平常的一天里，你怎样爱他们？你希望他们知道哪一件？",
    "在平常的一天裡，你怎樣愛他們？你希望他們知道哪一件？",
    { also: ["everyday"], places: ["home"] },
  ),
  q(
    "kid-hometown",
    "family",
    "growing",
    "What do you want them to know about the place you came from?",
    "关于你长大的地方，你希望他们知道什么？",
    "關於你長大的地方，你希望他們知道什麼？",
    { places: ["hometown"] },
  ),
  q(
    "kid-now",
    "character",
    "growing",
    "What are they learning now that you are glad to watch?",
    "他们眼下正在学的哪一件事，是你乐意在旁边看着的？",
    "他們眼下正在學的哪一件事，是你樂意在旁邊看著的？",
    { also: ["school"] },
  ),
];

export function childQuestionById(id: string) {
  return CHILD_QUESTIONS.find((question) => question.id === id) || null;
}

export function childQuestionCategories(question: ChildQuestion): ChildTheme[] {
  const seen = new Set<ChildTheme>();
  const categories: ChildTheme[] = [];
  for (const theme of [question.theme, ...(question.also ?? [])]) {
    if (seen.has(theme)) continue;
    seen.add(theme);
    categories.push(theme);
  }
  return categories;
}

export function childQuestionText(id: string, locale: Locale, childName: string) {
  const question = childQuestionById(id);
  if (!question) return "";
  const template = locale === "zh-Hans" ? question.hans : locale === "zh-Hant" ? question.hant : question.en;
  const fallback = locale === "zh-Hans" ? question.hansFallback : locale === "zh-Hant" ? question.hantFallback : question.enFallback;
  const name = childName.trim();
  if (!template.includes("{")) return template;
  if (!name) return fallback || template;
  return template.replaceAll("{childName}", name);
}
