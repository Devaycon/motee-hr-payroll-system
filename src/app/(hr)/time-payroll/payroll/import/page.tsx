import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Import new starters" };

const StarterImportPage = dynamic(() => import("@/src/components/hr/payroll/starter-import").then((m) => m.StarterImportPage));

export default function StarterImportRoute() {
  return <StarterImportPage />;
}
