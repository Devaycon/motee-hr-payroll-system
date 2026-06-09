import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Requisition — Motee HR",
  description: "",
};

const RequisitionsPage = dynamic(() =>
  import("@/src/components/hr/requisitions").then((m) => m.RequisitionsPage),
);

export default function RequisitionRoute() {
  return <RequisitionsPage />;
}
