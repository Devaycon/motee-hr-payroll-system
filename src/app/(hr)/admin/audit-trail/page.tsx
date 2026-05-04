import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Audit Trail" };

const AuditTrailPage = dynamic(() =>
  import("@/src/components/hr/audit-trail").then((m) => ({
    default: m.AuditTrailPage,
  })),
);

export default function Page() {
  return <AuditTrailPage />;
}
