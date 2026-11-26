import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { getCurrentUser } from "@/lib/auth";
import { getRequestDictionary } from "@/lib/request-locale";
import { profileFromUser } from "@/lib/profile";
import { isLocale } from "@/lib/locale";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { locale, dict } = await getRequestDictionary();
  const profile = profileFromUser(user);
  return (
    <OnboardingWizard
      dict={dict}
      initial={{
        name: user.name,
        locale: isLocale(user.locale) ? user.locale : locale,
        familyRole: profile.familyRole,
        childhoodPlace: profile.childhoodPlace,
        placesLived: profile.placesLived,
        occupation: profile.occupation,
        importantPeople: profile.importantPeople,
        hobbies: profile.hobbies,
        openTopics: profile.openTopics,
        skipTopics: profile.skipTopics,
        frequency: user.frequency || "weekly",
        customIntervalDays: user.customIntervalDays || 14,
        promptsPerDay: user.promptsPerDay || 1,
      }}
    />
  );
}
