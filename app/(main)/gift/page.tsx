import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isSampleBaseUrl, publicBaseUrl, signUpUrl } from "@/lib/gift/render";
import { getRequestDictionary } from "@/lib/request-locale";

export default async function GiftPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { locale, dict } = await getRequestDictionary();
  const url = signUpUrl();
  const sample = isSampleBaseUrl();
  const png = `/api/gift-card?format=png&locale=${locale}`;
  const pdf = `/api/gift-card?format=pdf&locale=${locale}`;

  return (
    <div>
      <h1 className="text-4xl">{dict.gift.title}</h1>
      <p className="mt-2 text-lg text-[#4d4032]">{dict.gift.lead}</p>
      <p className="mt-2 text-[#6d5e4c]">{dict.gift.printHint}</p>
      {sample ? <p className="mt-4 rounded-2xl bg-[#fff1ea] p-4 text-[#8d3b2e]">{dict.gift.placeholder}</p> : null}
      <p className="mt-4 text-sm text-[#6d5e4c]">
        {dict.gift.urlLabel}: {url}
      </p>
      <div className="no-print mt-4 flex flex-wrap gap-3">
        <a className="inline-flex h-12 items-center rounded-xl bg-[#8d3b2e] px-5 text-[#fffaf3]" href={`${png}&download=1`}>{dict.gift.downloadPng}</a>
        <a className="inline-flex h-12 items-center rounded-xl border border-[#e0d3bf] bg-white px-5" href={`${pdf}&download=1`}>{dict.gift.downloadPdf}</a>
      </div>
      <div className="mx-auto mt-6 max-w-md">
        {/* The card is rendered by this app from local fonts. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={png} alt={dict.gift.title} className="w-full rounded-sm shadow-lg" />
      </div>
      <p className="sr-only">{publicBaseUrl()}</p>
    </div>
  );
}
