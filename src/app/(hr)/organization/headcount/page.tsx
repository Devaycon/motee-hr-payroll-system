import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Headcount Planning",
};

const HeadcountPage = dynamic(() =>
  import("@/src/components/hr/headcount").then((m) => m.HeadcountPage),
);

export default function HeadcountRoute() {
  return <HeadcountPage />;
}
