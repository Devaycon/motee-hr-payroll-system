import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "My Contracts — Motee HR",
  description: "",
};

const MyContractsPage = dynamic(
  () => import("@/src/components/employee/contracts"),
);

export default function HrMyContractsRoute() {
  return <MyContractsPage />;
}
