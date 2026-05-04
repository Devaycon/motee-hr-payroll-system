import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Performance" };

const PerformancePage = dynamic(() =>
  import("@/src/components/hr/performance").then((m) => m.PerformancePage),
);

export default function PerformanceRoute() {
  return <PerformancePage />;
}
