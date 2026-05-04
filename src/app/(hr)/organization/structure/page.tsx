import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Structure & Hierarchy",
};

const StructurePage = dynamic(() =>
  import("@/src/components/hr/structure").then((m) => m.StructurePage),
);

export default function StructureRoute() {
  return <StructurePage />;
}
