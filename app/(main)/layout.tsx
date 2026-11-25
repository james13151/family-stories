import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { getRequestDictionary } from "@/lib/request-locale";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const path = (await headers()).get("x-hl-path") || "";
  if (!user.onboarded && !path.startsWith("/onboarding")) redirect("/onboarding");
  if (user.onboarded && path.startsWith("/onboarding")) redirect("/home");
  const { locale, dict } = await getRequestDictionary();
  return (
    <AppShell locale={locale} dict={dict} name={user.name} showNav={user.onboarded}>
      {children}
    </AppShell>
  );
}
