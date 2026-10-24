import dynamic from "next/dynamic";

const SchemesPage = dynamic(() =>
  import("@/src/components/hr/sickness/schemes").then((m) => m.SchemesPage),
);

export default function SchemesRoute() {
  return <SchemesPage />;
}
