import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Benefits",
};

const BenefitPlansPage = dynamic(() =>
  import("@/src/components/hr/benefit-plans").then((m) => m.BenefitPlansPage),
);

export default function BenefitPlansRoute() {
  return <BenefitPlansPage />;
}
