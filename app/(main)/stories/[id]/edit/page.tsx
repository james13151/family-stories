import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StoryEditor } from "@/components/story-editor";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRequestDictionary } from "@/lib/request-locale";
import { serializeStory } from "@/lib/stories";

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { id } = await params;
  const story = await prisma.story.findFirst({
    where: { id, userId: user.id },
    include: { audio: true, photos: true },
  });
  if (!story) notFound();
  const { locale, dict } = await getRequestDictionary();

  return (
    <div>
      <Link href={`/stories/${story.id}`} className="text-sm text-[#6d5e4c] underline decoration-[#a6844a] underline-offset-4">
        {dict.common.back}
      </Link>
      <div className="mt-4">
        <StoryEditor dict={dict} story={serializeStory(story, locale)} />
      </div>
    </div>
  );
}
