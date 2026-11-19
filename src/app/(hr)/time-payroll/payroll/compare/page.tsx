import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payroll comparison" };

const RunComparePage = dynamic(() => import("@/src/components/hr/payroll/run-compare").then((m) => m.RunComparePage));

export default function RunCompareRoute() {
  return <RunComparePage />;
}
