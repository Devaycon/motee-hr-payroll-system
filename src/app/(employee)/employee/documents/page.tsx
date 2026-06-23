import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Personal Documents" };

const MyDocumentsPage = dynamic(() =>
  import("@/src/components/employee/documents").then((m) => m.MyDocumentsPage),
);

export default function MyDocumentsRoute() {
  return <MyDocumentsPage />;
}
