import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Diversity & Inclusion" };

const MyDiversityPage = dynamic(() =>
  import("@/src/components/employee/diversity").then((m) => ({
    default: m.MyDiversityPage,
  })),
);

export default function Page() {
  return <MyDiversityPage />;
}
