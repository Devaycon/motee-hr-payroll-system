import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Employee Relations Cases" };

const GrievancePage = dynamic(() =>
  import("@/src/components/hr/grievance").then((m) => ({
    default: m.GrievancePage,
  })),
);

export default function Page() {
  return <GrievancePage />;
}
