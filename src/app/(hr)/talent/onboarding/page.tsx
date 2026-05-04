import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Onboarding" };

const OnboardingPage = dynamic(() =>
  import("@/src/components/hr/onboarding").then((m) => m.OnboardingPage),
);

export default function OnboardingRoute() {
  return <OnboardingPage />;
}
