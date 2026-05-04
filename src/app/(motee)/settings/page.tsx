import dynamic from "next/dynamic";

const SystemConfigPage = dynamic(
  () => import("@/src/components/motee/settings/system-config").then((m) => m.SystemConfigPage)
);

export default function Page() {
  return <SystemConfigPage />;
}
