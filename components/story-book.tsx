import { formatClass, firstLetterIsLatin } from "@/lib/format";
import type { StoryFormat } from "@/lib/format";
import { sanitizeStoryHtml, storyToPlain } from "@/lib/sanitize";

export function StoryBook({
  question,
  title,
  bodyHtml,
  format,
  photos,
}: {
  question: string;
  title: string;
  bodyHtml: string;
  format: StoryFormat;
  photos: { id: string; caption: string }[];
}) {
  const clean = sanitizeStoryHtml(bodyHtml);
  const plain = storyToPlain(clean);
  const className = formatClass(format, firstLetterIsLatin(plain));

  return (
    <div className="space-y-6">
      <article className={`book-sheet p-6 sm:p-10 ${className}`}>
        <p className="mb-4 text-sm tracking-wide text-[#8d3b2e]">{question}</p>
        {title && title !== question ? <h2 className="mb-4 text-3xl">{title}</h2> : null}
        {plain ? (
          <div dangerouslySetInnerHTML={{ __html: clean }} />
        ) : null}
      </article>
      {photos.map((photo) => (
        <figure key={photo.id} className="book-sheet overflow-hidden">
          {/* User photos are served from this app, not a remote optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/media/photo/${photo.id}`} alt={photo.caption || ""} className="max-h-[70vh] w-full object-contain bg-[#f7f1e7]" />
          {photo.caption ? <figcaption className="px-5 py-4 text-center text-lg">{photo.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}
