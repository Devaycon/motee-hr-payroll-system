import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Billing Overview — Motee Admin",
};

const BillingOverviewPage = dynamic(() =>
  import("@/src/components/motee/billing/overview").then(
    (m) => m.BillingOverviewPage,
  ),
);

export default function BillingPage() {
  return <BillingOverviewPage />;
}
