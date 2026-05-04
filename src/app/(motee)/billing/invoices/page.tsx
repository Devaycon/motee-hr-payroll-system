import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Invoices — Motee Admin",
};

const BillingInvoicesPage = dynamic(() =>
  import("@/src/components/motee/billing/invoices").then(
    (m) => m.BillingInvoicesPage,
  ),
);

export default function InvoicesPage() {
  return <BillingInvoicesPage />;
}
