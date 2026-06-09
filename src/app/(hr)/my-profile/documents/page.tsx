import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "My Documents — Motee HR",
  description: "",
};

const MyDocumentsPage = dynamic(() =>
  import("@/src/components/employee/documents").then((m) => m.MyDocumentsPage),
);

export default function HrMyDocumentsRoute() {
  return <MyDocumentsPage />;
}
