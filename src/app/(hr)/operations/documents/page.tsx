import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Documents & Compliance" };

const DocumentsPage = dynamic(() =>
  import("@/src/components/hr/documents").then((m) => m.DocumentsPage),
);

export default function DocumentsRoute() {
  return <DocumentsPage />;
}
