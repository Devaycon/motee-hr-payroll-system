import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Recruitment" };

const RecruitmentPage = dynamic(() =>
  import("@/src/components/hr/recruitment").then((m) => m.RecruitmentPage),
);

export default function RecruitmentRoute() {
  return <RecruitmentPage />;
}
