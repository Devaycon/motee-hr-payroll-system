import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Complete your onboarding — Motee",
  description: "",
};

const LiveJoinPage = dynamic(() =>
  import("@/src/components/onboarding/join-live").then((m) => m.LiveJoinPage),
);

// The folder is still named `[recordId]`; the segment is the invitation token
// emailed to the joiner.
export default async function JoinOnboardingRoute({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  return <LiveJoinPage token={recordId} />;
}
