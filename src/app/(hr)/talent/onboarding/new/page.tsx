import type { Metadata } from "next";
import { OnboardingFormPage } from "@/src/components/hr/onboarding/components/onboarding-form-page";

export const metadata: Metadata = {
  title: "New Employee Onboarding",
};

export default function NewOnboardingRoute() {
  return <OnboardingFormPage />;
}
