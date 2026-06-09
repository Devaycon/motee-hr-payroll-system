import type { Metadata } from "next";
import { PreboardingFormPage } from "@/src/components/hr/onboarding/components/preboarding-form-page";

export const metadata: Metadata = {
  title: "Initiate Preboarding",
};

export default function PreboardRoute() {
  return <PreboardingFormPage />;
}
