import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Plans — Motee Admin",
};

const BillingPlansPage = dynamic(() =>
  import("@/src/components/motee/billing/plans").then(
    (m) => m.BillingPlansPage,
  ),
);

export default function PlansPage() {
  return <BillingPlansPage />;
}
