import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offboarding" };

const OffboardingPage = dynamic(() =>
  import("@/src/components/hr/offboarding").then((m) => m.OffboardingPage),
);

export default function OffboardingRoute() {
  return <OffboardingPage />;
}
