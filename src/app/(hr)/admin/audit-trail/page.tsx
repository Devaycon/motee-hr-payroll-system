import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Audit Trail" };

const LiveAuditTrailPage = dynamic(() =>
  import("@/src/components/hr/audit-trail/live").then((m) => ({
    default: m.LiveAuditTrailPage,
  })),
);

export default function Page() {
  return (
    <Suspense>
      <LiveAuditTrailPage />
    </Suspense>
  );
}
