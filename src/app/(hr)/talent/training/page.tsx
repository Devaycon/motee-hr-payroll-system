import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Learning & Development" };

const LearningPage = dynamic(() =>
  import("@/src/components/hr/learning").then((m) => m.LearningPage),
);

export default function LearningRoute() {
  return <LearningPage />;
}
