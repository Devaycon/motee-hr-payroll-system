import type { Metadata } from "next";
import { OnboardingFormPage } from "@/src/components/hr/onboarding/components/onboarding-form-page";

export const metadata: Metadata = {
  title: "New Employee Onboarding",
};

export default async function NewOnboardingRoute({
  searchParams,
}: {
  searchParams: Promise<{ preboarding?: string }>;
}) {
  const sp = await searchParams;
  return <OnboardingFormPage preboardingId={sp.preboarding} />;
}
