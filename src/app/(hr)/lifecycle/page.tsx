import dynamic from "next/dynamic";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employee Lifecycle — Motee HR",
  description: "",
};

const LifecyclePage = dynamic(() =>
  import("@/src/components/hr/lifecycle").then((m) => m.LifecyclePage),
);

export default function LifecyclePageRoute() {
  return <LifecyclePage />;
}
