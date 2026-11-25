import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPromptDue } from "@/lib/frequency";
import { getRequestDictionary } from "@/lib/request-locale";
import { fillTemplate, formatWhen } from "@/lib/locale";
import { excerpt } from "@/lib/sanitize";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { locale, dict } = await getRequestDictionary();
  const stories = await prisma.story.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { photos: { take: 1, orderBy: { sortOrder: "asc" } } },
  });
  const due = isPromptDue(user.nextPromptAt);

  return (
    <div>
      <p className="text-[#6d5e4c]">{fillTemplate(dict.home.hello, { name: user.name })}</p>
      <section className="book-sheet mt-4 p-6 sm:p-8">
        {due ? (
          <>
            <h1 className="text-4xl leading-tight">{dict.home.dueTitle}</h1>
            <p className="mt-3 text-lg text-[#4d4032]">{dict.home.dueBody}</p>
          </>
        ) : (
          <>
            <h1 className="text-4xl leading-tight">{fillTemplate(dict.home.notDueTitle, { date: formatWhen(user.nextPromptAt || new Date(), locale) })}</h1>
            <p className="mt-3 text-lg text-[#4d4032]">{dict.home.notDueBody}</p>
          </>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/questions" className="inline-flex h-14 items-center rounded-2xl bg-[#8d3b2e] px-6 text-lg text-[#fffaf3]">
            {due ? dict.home.choose : dict.home.writeAnyway}
          </Link>
        </div>
      </section>
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
