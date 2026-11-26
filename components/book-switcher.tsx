import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/types";
import type { BookKind } from "@/lib/memoir";
import { cn } from "cn";

const options: { id: BookKind; href: string; label: "bookLife" | "bookChild" }[] = [
  { id: "life", href: "/book", label: "bookLife" },
  { id: "child", href: "/book?book=child", label: "bookChild" },
];

export function BookSwitcher({ book, dict }: { book: BookKind; dict: Dictionary }) {
  return (
    <div className="flex w-fit max-w-full flex-nowrap gap-0.5 rounded-full bg-[#fffaf3]/80 p-0.5 ring-1 ring-[#e0d3bf]" role="group" aria-label={dict.booklet.bookPicker}>
      {options.map((option) => {
        const selected = book === option.id;
        return (
          <Link
            key={option.id}
            href={option.href}
            aria-current={selected ? "true" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-3 text-sm",
              selected ? "bg-[#8d3b2e] text-[#fffaf3]" : "text-[#2a2218] hover:bg-[#efe4d2]",
            )}
          >
            {dict.booklet[option.label]}
          </Link>
        );
      })}
    </div>
  );
}
