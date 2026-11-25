import { redirect } from "next/navigation";
import { QuestionBrowser } from "@/components/question-browser";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRequestDictionary } from "@/lib/request-locale";
import { profileFromUser } from "@/lib/profile";
import { personalizeQuestions } from "@/lib/questions/personalize";

export default async function QuestionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { locale, dict } = await getRequestDictionary();
  const stories = await prisma.story.findMany({
    where: { userId: user.id, questionId: { not: null } },
    select: { questionId: true },
  });
  const answered = stories.map((story) => story.questionId).filter((id): id is string => Boolean(id));
  const cards = personalizeQuestions(profileFromUser(user), locale, answered).map((card) => ({
    ...card,
    answered: answered.includes(card.id),
  }));

  return (
    <div>
      <h1 className="text-4xl">{dict.questions.title}</h1>
      <p className="mt-2 text-lg text-[#4d4032]">{dict.questions.lead}</p>
      <div className="mt-6">
        <QuestionBrowser dict={dict} cards={cards} />
      </div>
    </div>
  );
}
