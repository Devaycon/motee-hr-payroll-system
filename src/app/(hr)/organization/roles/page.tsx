import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Line Managers",
};

const RolesPage = dynamic(() =>
  import("@/src/components/hr/roles").then((m) => m.RolesPage),
);

export default function RolesRoute() {
  return <RolesPage />;
}
