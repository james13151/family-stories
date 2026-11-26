import Link from "next/link";
import { redirect } from "next/navigation";
import { BookSwitcher } from "@/components/book-switcher";
import { MemoirEditor } from "@/components/memoir-editor";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRequestDictionary } from "@/lib/request-locale";
import { formatWhen } from "@/lib/locale";
import { accountStoryWhere } from "@/lib/account";
import { storyMemory } from "@/lib/memories";
import { storiesForBook } from "@/lib/memoir";
import { loadMemoirDraft } from "@/lib/memoir/compose";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ book?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const book = (await searchParams).book === "child" ? "child" : "life";
  const { locale, dict } = await getRequestDictionary();
  const stories = storiesForBook(await prisma.story.findMany({
    where: { ...accountStoryWhere(user.id), kind: book },
    orderBy: { createdAt: "asc" },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  }), book);
  const draft = await loadMemoirDraft(user.id, user.name, dict, book);

  return (
    <div>
      <div className="no-print">
        <BookSwitcher book={book} dict={dict} />
        <h1 className="mt-4 text-4xl">{book === "child" ? dict.booklet.childTitle : dict.booklet.title}</h1>
        <p className="mt-2 text-lg text-[#4d4032]">{book === "child" ? dict.booklet.childLead : dict.booklet.lead}</p>
        <p className="mt-3">
          <Link href="/children" className="text-[#8d3b2e] underline decoration-[#a6844a] underline-offset-4">{dict.child.title}</Link>
        </p>
        {stories.length ? null : <p className="mt-3 text-lg">{book === "child" ? dict.booklet.childEmpty : dict.booklet.empty}</p>}
      </div>
      <div className="mt-6">
        <MemoirEditor
            key={book}
            dict={dict}
            author={user.name}
            book={book}
            initial={{
              title: draft.title,
              subtitle: draft.subtitle,
              authorName: draft.authorName,
              grouping: draft.grouping,
              dedication: draft.dedication,
              preface: draft.preface,
              trim: draft.trim,
              cover: draft.cover,
              paper: draft.paper,
              coverStyle: draft.coverStyle,
              storyTemplate: draft.storyTemplate,
              chapters: draft.structure.chapters,
              excluded: draft.structure.excluded,
            }}
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
