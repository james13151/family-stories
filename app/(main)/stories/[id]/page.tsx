import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AttachedRecording } from "@/components/attached-recording";
import { StoryActions } from "@/components/story-actions";
import { StoryBook } from "@/components/story-book";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseFormat } from "@/lib/format";
import { getRequestDictionary } from "@/lib/request-locale";
import { fillTemplate, formatWhen } from "@/lib/locale";

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { id } = await params;
  const story = await prisma.story.findFirst({
    where: { id, userId: user.id },
    include: { audio: true, photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!story) notFound();
  const { locale, dict } = await getRequestDictionary();

  return (
    <div>
      <p className="text-sm tracking-wide text-[#8d3b2e]">{dict.preview.kicker}</p>
      <h1 className="mt-2 text-4xl leading-tight">{story.title || story.questionText}</h1>
      <p className="mt-2 text-[#6d5e4c]">
        {fillTemplate(dict.preview.by, { name: user.name })} · {formatWhen(story.createdAt, locale)}
        {story.childName ? ` · ${fillTemplate(dict.child.forChild, { name: story.childName })}` : ""}
      </p>
      <p className="no-print mt-2">
        <Link href="/book" className="text-[#8d3b2e] underline decoration-[#a6844a] underline-offset-4">{dict.booklet.open}</Link>
      </p>
      <div className="mt-5">
        <StoryActions dict={dict} storyId={story.id} />
      </div>
      {story.audio ? (
        <AttachedRecording dict={dict} storyId={story.id} audioId={story.audio.id} label={dict.preview.listen} framed />
      ) : null}
      <StoryBook
        question={story.questionText}
        title={story.title}
        bodyHtml={story.bodyHtml}
        format={parseFormat(story.formatJson, locale)}
        photos={story.photos.map((photo) => ({ id: photo.id, caption: photo.caption }))}
      />
      {!story.bodyHtml && !story.photos.length ? <p className="mt-4 text-[#6d5e4c]">{dict.preview.empty}</p> : null}
    </div>
  );
}
