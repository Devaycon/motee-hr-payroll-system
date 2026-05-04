import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Surveys & Engagement",
};

const SurveysPage = dynamic(() =>
  import("@/src/components/hr/surveys").then((m) => ({
    default: m.SurveysPage,
  })),
);

export default function Page() {
  return <SurveysPage />;
}
