import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { reconcileWindow } from "@/lib/frequency";
import { getRequestDictionary } from "@/lib/request-locale";
import { fillTemplate, formatWhen } from "@/lib/locale";
import { excerpt } from "@/lib/sanitize";
import { profileFromUser } from "@/lib/profile";
import { personalizeQuestions } from "@/lib/questions/personalize";
import { HomePrompt } from "@/components/home-prompt";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { locale, dict } = await getRequestDictionary();
  const window = reconcileWindow({
    nextPromptAt: user.nextPromptAt,
    promptsLeft: user.promptsLeft,
    frequency: user.frequency,
    promptsPerDay: user.promptsPerDay,
    customDays: user.customIntervalDays,
    cycle: user.cycleIndex,
  });
  if (window.refilled && window.promptsLeft !== user.promptsLeft) {
    await prisma.user.update({ where: { id: user.id }, data: { promptsLeft: window.promptsLeft } });
  }
  const stories = await prisma.story.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { photos: { take: 1, orderBy: { sortOrder: "asc" } } },
  });
  const answered = await prisma.story.findMany({
    where: { userId: user.id, kind: "life", questionId: { not: null } },
    select: { questionId: true },
  });
  const suggestions = personalizeQuestions(
    profileFromUser(user),
    locale,
    answered.map((story) => story.questionId).filter((id): id is string => Boolean(id)),
  )
    .filter((card) => !card.hidden)
    .slice(0, 16)
    .map((card) => ({ id: card.id, text: card.text, personalized: card.personalized }));

  return (
    <div>
      <p className="text-[#6d5e4c]">{fillTemplate(dict.home.hello, { name: user.name })}</p>
      <HomePrompt
        dict={dict}
        due={window.due}
        promptsLeft={window.promptsLeft}
        nextDateLabel={formatWhen(user.nextPromptAt || new Date(), locale)}
        nextPromptAt={user.nextPromptAt ? user.nextPromptAt.toISOString() : null}
        suggestions={suggestions}
      />
      <section className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl">{dict.home.recent}</h2>
          <Link href="/stories" className="text-[#8d3b2e] underline decoration-[#a6844a] underline-offset-4">{dict.home.seeAll}</Link>
        </div>
        {stories.length ? (
          <div className="mt-4 space-y-3">
            {stories.map((story) => (
              <Link key={story.id} href={`/stories/${story.id}`} className="book-sheet block p-4">
                <p className="text-sm text-[#6d5e4c]">{formatWhen(story.createdAt, locale)}</p>
                <h3 className="text-xl">{story.title || story.questionText}</h3>
                <p className="text-[#4d4032]">{excerpt(story.bodyHtml) || story.questionText}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="book-sheet mt-4 p-6">
            <h3 className="text-2xl">{dict.home.emptyTitle}</h3>
            <p className="mt-2 text-[#4d4032]">{dict.home.emptyBody}</p>
          </div>
        )}
      </section>
    </div>
  );
}
