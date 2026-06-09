import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "My Assets — Motee HR",
  description: "",
};

const MyAssetsPage = dynamic(() =>
  import("@/src/components/employee/assets").then((m) => m.MyAssetsPage),
);

export default function HrMyAssetsRoute() {
  return <MyAssetsPage />;
}
