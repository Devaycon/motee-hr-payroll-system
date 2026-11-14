import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payroll settings" };

const PayrollSettingsPage = dynamic(() => import("@/src/components/hr/payroll/settings").then((m) => m.PayrollSettingsPage));

export default function PayrollSettingsRoute() {
  return (
    <Suspense>
      <PayrollSettingsPage />
    </Suspense>
  );
}
