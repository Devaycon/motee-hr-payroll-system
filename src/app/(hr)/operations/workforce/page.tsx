import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Workforce Planning" };

const WorkforcePage = dynamic(() =>
  import("@/src/components/hr/workforce").then((m) => m.WorkforcePage),
);

export default function WorkforceRoute() {
  return <WorkforcePage />;
}
