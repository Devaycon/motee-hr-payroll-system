import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "My Performance — Motee HR",
  description: "",
};

const MyPerformancePage = dynamic(() =>
  import("@/src/components/employee/performance").then(
    (m) => m.MyPerformancePage,
  ),
);

export default function HrMyPerformanceRoute() {
  return <MyPerformancePage />;
}
