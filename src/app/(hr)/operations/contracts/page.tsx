import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contracts" };

const ContractsPage = dynamic(() =>
  import("@/src/components/hr/contracts").then((m) => m.ContractsPage),
);

export default function ContractsRoute() {
  return <ContractsPage />;
}
