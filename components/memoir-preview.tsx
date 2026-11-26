"use client";

import type { ReactNode } from "react";
import type { BookletStory } from "@/components/booklet";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/types";
import type { CoverStyle, StoryTemplate } from "@/lib/memoir/design";
import { LANE_IMAGE, storyLayout } from "@/lib/memoir/design";
import type { PrintCoverCode } from "@/lib/print/catalog";
import { sanitizeStoryHtml } from "@/lib/sanitize";

type Chapter = { id: string; title: string; storyIds: string[] };

export function MemoirPreview({
  dict,
  author,
  stories,
  title,
  subtitle,
  dedication,
  preface,
  chapters,
  coverStyle,
  binding,
  template,
}: {
  dict: Dictionary;
  author: string;
  stories: BookletStory[];
  title: string;
  subtitle: string;
  dedication: string;
  preface: string;
  chapters: Chapter[];
  coverStyle: CoverStyle;
  binding: PrintCoverCode;
  template: StoryTemplate;
}) {
  const byId = new Map(stories.map((story) => [story.id, story]));
  const coverTitle = title.trim() || dict.booklet.fallbackTitle;
  const coverSubtitle = subtitle.trim() || dict.booklet.fallbackSubtitle;
  const hard = binding !== "softcover";
  let folio = 0;
  const nextFolio = () => {
    folio += 1;
    return folio;
  };

  return (
    <div className="memoir-face" data-cover-style={coverStyle} data-binding={hard ? "hardcover" : "softcover"} data-story-template={template}>
      <div className="no-print mb-4 flex items-center justify-between gap-3 px-1">
        <h2 className="text-2xl">{dict.booklet.preview}</h2>
        <Button type="button" variant="outline" className="h-12 px-5" onClick={() => window.print()}>{dict.booklet.print}</Button>
      </div>
      <article className={`bound ${hard ? "hard" : "soft"} style-${coverStyle}`}>
        <div className="bound-spine" aria-hidden="true"><span>{coverTitle}</span></div>
        <div className="bound-board">
          <CoverFace style={coverStyle} title={coverTitle} subtitle={coverSubtitle} author={author} brand={dict.meta.appNameZh} />
        </div>
      </article>
      {dedication.trim() ? (
        <Sheet folio={nextFolio()} kicker={dict.booklet.dedication}>
          <p className="memoir-dedication">{dedication.trim()}</p>
        </Sheet>
      ) : null}
      {preface.trim() ? (
        <Sheet folio={nextFolio()} kicker={dict.booklet.preface}>
          <div className="memoir-body">
            {preface.trim().split(/\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        </Sheet>
      ) : null}
      {chapters.map((chapter) => {
        const items = chapter.storyIds.flatMap((id) => {
          const story = byId.get(id);
          return story ? [story] : [];
        });
        if (!items.length) return null;
        return items.map((story, index) => {
          const layout = storyLayout(template, story.photos.length > 0, index === 0);
          const photo = story.photos[0];
          const image = photo ? `/api/media/photo/${photo.id}` : LANE_IMAGE;
          const imageAlt = photo?.caption || story.title || story.question;
          if (layout === "spread") {
            const left = nextFolio();
            const right = nextFolio();
            return (
              <div className="memoir-spread" key={story.id}>
                <figure className="memoir-sheet memoir-bleed">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={imageAlt} />
                  <span className="memoir-folio">{left}</span>
                </figure>
                <ClassicPage story={story} chapter={chapter.title} author={author} folio={right} brand={dict.meta.appNameZh} />
              </div>
            );
          }
          if (layout === "photo") {
            return (
              <Sheet key={story.id} folio={nextFolio()} kicker={`${dict.meta.appNameZh} · ${chapter.title}`}>
                <figure className="memoir-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={imageAlt} />
                  {photo?.caption ? <figcaption>{photo.caption}</figcaption> : null}
                </figure>
                <StoryHead story={story} author={author} />
                <Body html={story.bodyHtml} />
              </Sheet>
            );
          }
          return <ClassicPage key={story.id} story={story} chapter={chapter.title} author={author} folio={nextFolio()} brand={dict.meta.appNameZh} />;
        });
      })}
    </div>
  );
}

function CoverFace({ style, title, subtitle, author, brand }: { style: CoverStyle; title: string; subtitle: string; author: string; brand: string }) {
  return (
    <div className={`cover-face cover-${style}`}>
      <div className="cover-seal-mark" aria-hidden="true"><span>家</span></div>
      <p className="cover-mark">hearthlight</p>
      <h3 className="cover-title">{title}</h3>
      <p className="cover-subtitle">{subtitle}</p>
      <div className="cover-rule" />
      <p className="cover-author">{author}</p>
      <p className="cover-footer">{brand}</p>
    </div>
  );
}

function Sheet({ folio, kicker, children }: { folio: number; kicker: string; children: ReactNode }) {
  return (
    <section className="memoir-sheet">
      <p className="memoir-kicker">{kicker}</p>
      {children}
      <span className="memoir-folio">{folio}</span>
    </section>
  );
}

function ClassicPage({ story, chapter, author, folio, brand }: { story: BookletStory; chapter: string; author: string; folio: number; brand: string }) {
  return (
    <Sheet folio={folio} kicker={`${brand} · ${chapter}`}>
      <StoryHead story={story} author={author} />
      <Body html={story.bodyHtml} />
    </Sheet>
  );
}

function StoryHead({ story, author }: { story: BookletStory; author: string }) {
  const place = story.places.filter(Boolean).join(" · ");
  const teller = story.kind === "child" && story.childName ? story.childName : author;
  return (
    <header>
      {story.question && story.question !== story.title ? <p className="memoir-question">{story.question}</p> : null}
      <h3 className="memoir-title">{story.title || story.question}</h3>
      <p className="memoir-meta">{[teller, story.when, place].filter(Boolean).join(" · ")}</p>
    </header>
  );
}

function Body({ html }: { html: string }) {
  const clean = sanitizeStoryHtml(html);
  if (!clean) return null;
  return <div className="memoir-body" dangerouslySetInnerHTML={{ __html: clean }} />;
}
