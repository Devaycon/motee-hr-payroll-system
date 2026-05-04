import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Company Setup — Motee Solutions",
  description: "Configure your organisation on Motee Solutions",
};

const CompanyOnboardingIndex = dynamic(
  () => import("@/src/components/auth/company-onboarding"),
);

export default function OnboardingPage() {
  return <CompanyOnboardingIndex />;
}
