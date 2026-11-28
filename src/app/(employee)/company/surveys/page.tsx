import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Surveys" };

const MySurveysPage = dynamic(() =>
  import("@/src/components/employee/surveys").then((m) => m.MySurveysPage),
);

export default function MySurveysRoute() {
  return <MySurveysPage />;
}
