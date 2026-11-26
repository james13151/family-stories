import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings-form";
import { getCurrentUser } from "@/lib/auth";
import { getRequestDictionary } from "@/lib/request-locale";
import { isLocale } from "@/lib/locale";
import { profileFromUser } from "@/lib/profile";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { locale, dict } = await getRequestDictionary();
  const profile = profileFromUser(user);
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
    </div>
  );
}
