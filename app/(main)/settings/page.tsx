import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { getCurrentUser } from "@/lib/auth";
import { getRequestDictionary } from "@/lib/request-locale";
import { fillTemplate, isLocale } from "@/lib/locale";
import { normalizePlan } from "@/lib/billing/plans";
import { profileFromUser } from "@/lib/profile";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { locale, dict } = await getRequestDictionary();
  const profile = profileFromUser(user);
  const planName = normalizePlan(user.plan) === "family" ? dict.settings.planFamily : dict.settings.planGift;
  return (
    <div>
      <h1 className="text-4xl">{dict.settings.title}</h1>
      <p className="mt-2 text-lg text-[#4d4032]">{dict.settings.lead}</p>
      <div className="mt-6">
        <SettingsForm
          dict={dict}
          email={user.email}
          initial={{
            name: user.name,
            locale: isLocale(user.locale) ? user.locale : locale,
            ...profile,
            frequency: user.frequency,
            customIntervalDays: user.customIntervalDays,
            promptsPerDay: user.promptsPerDay,
          }}
        />
      </div>
      <section className="book-sheet mt-6 p-5 sm:p-8">
        <h2 className="text-2xl">{dict.settings.planTitle}</h2>
        <p className="mt-2 text-lg">{fillTemplate(dict.settings.planLine, { plan: planName })}</p>
        <p className="mt-3 text-base leading-relaxed text-[#4d4032]">{dict.settings.planBody}</p>
      </section>
    </div>
  );
}
