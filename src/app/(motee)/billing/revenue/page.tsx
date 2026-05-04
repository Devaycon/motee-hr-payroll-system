import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Revenue — Motee Admin",
};

const BillingRevenuePage = dynamic(() =>
  import("@/src/components/motee/billing/revenue").then(
    (m) => m.BillingRevenuePage,
  ),
);

export default function RevenuePage() {
  return <BillingRevenuePage />;
}
