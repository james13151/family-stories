import Link from "next/link";
import { redirect } from "next/navigation";
import { Booklet } from "@/components/booklet";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRequestDictionary } from "@/lib/request-locale";
import { formatWhen } from "@/lib/locale";
import { storyMemory } from "@/lib/memories";

export default async function BookPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { locale, dict } = await getRequestDictionary();
  const stories = await prisma.story.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div>
      <div className="no-print">
        <h1 className="text-4xl">{dict.booklet.title}</h1>
        <p className="mt-2 text-lg text-[#4d4032]">{dict.booklet.lead}</p>
        <p className="mt-3">
          <Link href="/children" className="text-[#8d3b2e] underline decoration-[#a6844a] underline-offset-4">{dict.child.title}</Link>
        </p>
      </div>
      <div className="mt-6">
        <Booklet
          dict={dict}
          author={user.name}
          stories={stories.map((story) => {
            const memory = storyMemory(story);
            return {
              id: story.id,
              title: story.title,
              question: story.questionText,
              bodyHtml: story.bodyHtml,
              when: formatWhen(story.createdAt, locale),
              createdAt: story.createdAt.toISOString(),
              kind: memory.kind,
              childName: story.childName,
              theme: memory.theme,
              stage: memory.stage,
              places: memory.places,
              photos: story.photos.map((photo) => ({ id: photo.id, caption: photo.caption })),
            };
          })}
        />
      </div>
    </div>
  );
}
