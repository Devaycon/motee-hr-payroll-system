import type { Metadata } from "next";
import { OnboardingDetailPage } from "@/src/components/hr/onboarding/detail";

export const metadata: Metadata = {
  title: "Onboarding Detail — Motee HR",
};

export default async function OnboardingDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OnboardingDetailPage recordId={id} />;
}
