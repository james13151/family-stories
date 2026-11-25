import Link from "next/link";
import { redirect } from "next/navigation";
import { StoryList } from "@/components/story-list";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRequestDictionary } from "@/lib/request-locale";
import { formatWhen } from "@/lib/locale";
import { excerpt } from "@/lib/sanitize";

export default async function StoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { locale, dict } = await getRequestDictionary();
  const stories = await prisma.story.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      audio: { select: { id: true } },
      photos: { orderBy: { sortOrder: "asc" }, select: { id: true } },
    },
  });

  return (
    <div>
      <h1 className="text-4xl">{dict.stories.title}</h1>
      <p className="mt-2 text-lg text-[#4d4032]">{dict.stories.lead}</p>
      <p className="mt-3 flex flex-wrap gap-4">
        <Link href="/book" className="text-[#8d3b2e] underline decoration-[#a6844a] underline-offset-4">{dict.booklet.open}</Link>
        <Link href="/children" className="text-[#8d3b2e] underline decoration-[#a6844a] underline-offset-4">{dict.child.title}</Link>
      </p>
      <div className="mt-6">
        <StoryList
          dict={dict}
          stories={stories.map((story) => ({
            id: story.id,
            title: story.title,
            question: story.questionText,
            excerpt: excerpt(story.bodyHtml),
            when: formatWhen(story.createdAt, locale),
            childName: story.childName,
            hasAudio: Boolean(story.audio),
            photoCount: story.photos.length,
            photoId: story.photos[0]?.id || null,
          }))}
        />
      </div>
    </div>
  );
}
