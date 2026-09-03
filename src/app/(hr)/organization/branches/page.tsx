import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Branches",
};

const BranchesPage = dynamic(() =>
  import("@/src/components/hr/branches").then((m) => m.BranchesPage),
);

export default function BranchesRoute() {
  return <BranchesPage />;
}
