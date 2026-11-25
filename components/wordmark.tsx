import type { Locale } from "@/lib/locale";

export function Lantern({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M32 4v7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22 12h20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="16" y="15" width="32" height="30" rx="13" fill="currentColor" />
      <path d="M25 22v16M32 20v20M39 22v16" stroke="#fffaf3" strokeWidth="1.6" />
      <path d="M32 45v8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="32" cy="56" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ locale }: { locale: Locale }) {
  if (locale === "en") {
    return (
      <span className="font-book text-xl tracking-tight text-[#2a2218]">
        Hearthlight <span className="text-[#8d3b2e]">家燈</span>
      </span>
    );
  }
  return (
    <span className="font-book text-2xl tracking-tight text-[#2a2218]">
      家燈 <span className="font-sans text-sm font-medium tracking-normal text-[#6d5e4c]">Hearthlight</span>
    </span>
  );
}
