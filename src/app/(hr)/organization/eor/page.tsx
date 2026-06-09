import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employer of Record",
};

const EorPage = dynamic(() =>
  import("@/src/components/hr/eor").then((m) => m.EorPage),
);

export default function EorRoute() {
  return <EorPage />;
}
