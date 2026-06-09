import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Preboarding & Onboarding" };

const PreboardingOnboardingPage = dynamic(() =>
  import("@/src/components/hr/onboarding/preboarding-onboarding").then(
    (m) => m.PreboardingOnboardingPage,
  ),
);

export default function OnboardingRoute() {
  return <PreboardingOnboardingPage />;
}
