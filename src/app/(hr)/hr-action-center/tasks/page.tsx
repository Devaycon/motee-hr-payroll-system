import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Work" };

const MyWorkPage = dynamic(() =>
  import("@/src/components/hr/my-work").then((m) => m.MyWorkPage),
);

export default function TasksRoute() {
  return <MyWorkPage />;
}
