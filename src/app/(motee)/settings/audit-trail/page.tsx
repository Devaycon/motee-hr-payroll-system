import dynamic from "next/dynamic";

const AuditTrailPage = dynamic(
  () => import("@/src/components/motee/settings/audit-trail").then((m) => m.AuditTrailPage)
);

export default function Page() {
  return <AuditTrailPage />;
}
