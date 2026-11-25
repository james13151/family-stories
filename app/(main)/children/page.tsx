import { redirect } from "next/navigation";
import { ChildMemories } from "@/components/child-memories";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRequestDictionary } from "@/lib/request-locale";
import { formatWhen } from "@/lib/locale";
import { storyMemory } from "@/lib/memories";

export default async function ChildrenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { locale, dict } = await getRequestDictionary();
  const stories = await prisma.story.findMany({
    where: { userId: user.id, kind: "child" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-4xl">{dict.child.title}</h1>
      <p className="mt-2 text-lg text-[#4d4032]">{dict.child.lead}</p>
      <div className="mt-6">
        <ChildMemories
          dict={dict}
          locale={locale}
          answeredIds={stories.map((story) => story.questionId).filter((id): id is string => Boolean(id))}
          saved={stories.map((story) => {
            const memory = storyMemory(story);
            return {
              id: story.id,
              title: story.title,
              question: story.questionText,
              childName: story.childName,
              when: formatWhen(story.createdAt, locale),
              theme: memory.theme,
              themes: memory.themes,
              stage: memory.stage,
              places: memory.places,
            };
          })}
        />
      </div>
    </div>
  );
}
