import dynamic from "next/dynamic";

const ModulesPage = dynamic(() =>
  import("@/src/components/motee/platform/modules").then((m) => m.ModulesPage),
);

export default function Page() {
  return <ModulesPage />;
}
