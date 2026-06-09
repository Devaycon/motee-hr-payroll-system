import dynamic from "next/dynamic";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Workspace — Motee HR",
  description: "",
};

const MyWorkspacePage = dynamic(() =>
  import("@/src/components/hr/hr-action-center").then((m) => m.MyWorkspacePage),
);

export default function MyWorkspaceRoute() {
  return <MyWorkspacePage />;
}
