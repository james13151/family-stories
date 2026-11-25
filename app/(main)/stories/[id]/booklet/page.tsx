import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PieceBooklet } from "@/components/piece-booklet";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRequestDictionary } from "@/lib/request-locale";
import { toPieceStory } from "@/lib/piece";

export default async function StoryBookletPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { id } = await params;
  const story = await prisma.story.findFirst({
    where: { id, userId: user.id },
    include: { photos: true },
  });
  if (!story) notFound();
  const { locale, dict } = await getRequestDictionary();

  return (
    <div>
      <div className="no-print">
        <p className="text-sm tracking-wide text-[#8d3b2e]">{dict.piece.open}</p>
        <h1 className="mt-2 text-4xl leading-tight">{story.title || story.questionText}</h1>
        <p className="mt-2 text-lg text-[#4d4032]">{dict.piece.lead}</p>
        <p className="mt-3">
          <Link href={`/stories/${story.id}`} className="text-[#8d3b2e] underline decoration-[#a6844a] underline-offset-4">{dict.common.back}</Link>
        </p>
      </div>
      <div className="mt-6">
        <PieceBooklet dict={dict} author={user.name} stories={[toPieceStory(story, locale)]} />
      </div>
    </div>
  );
}
