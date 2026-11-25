import Link from "next/link";
import { redirect } from "next/navigation";
import { PieceBooklet } from "@/components/piece-booklet";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRequestDictionary } from "@/lib/request-locale";
import { parseStoryIds, toPieceStory } from "@/lib/piece";

export default async function PieceSetPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { locale, dict } = await getRequestDictionary();
  const ids = parseStoryIds((await searchParams).ids);
  const found = ids.length
    ? await prisma.story.findMany({
        where: { userId: user.id, id: { in: ids } },
        include: { photos: true },
      })
    : [];
  const byId = new Map(found.map((story) => [story.id, story]));
  const stories = ids.flatMap((id) => {
    const story = byId.get(id);
    return story ? [toPieceStory(story, locale)] : [];
  });

  return (
    <div>
      <div className="no-print">
        <h1 className="text-4xl">{dict.piece.setTitle}</h1>
        <p className="mt-2 text-lg text-[#4d4032]">{stories.length ? dict.piece.setLead : dict.piece.empty}</p>
        <p className="mt-3 flex flex-wrap gap-4">
          <Link href="/stories" className="text-[#8d3b2e] underline decoration-[#a6844a] underline-offset-4">{dict.stories.title}</Link>
          <Link href="/book" className="text-[#8d3b2e] underline decoration-[#a6844a] underline-offset-4">{dict.booklet.open}</Link>
        </p>
      </div>
      <div className="mt-6">
        <PieceBooklet dict={dict} author={user.name} stories={stories} />
      </div>
    </div>
  );
}
