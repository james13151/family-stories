import Link from "next/link";
import { getRequestDictionary } from "@/lib/request-locale";

export default async function NotFound() {
  const { dict } = await getRequestDictionary();
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-4xl">{dict.errors.notFound}</h1>
      <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-xl bg-[#8d3b2e] px-5 text-[#fffaf3]">{dict.nav.home}</Link>
    </div>
  );
}
