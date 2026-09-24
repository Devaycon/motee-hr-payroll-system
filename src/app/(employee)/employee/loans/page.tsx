import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Loans" };

const MyLoansPage = dynamic(() =>
  import("@/src/components/employee/loans").then((m) => m.MyLoansPage),
);

export default function MyLoansRoute() {
  return <MyLoansPage />;
}
