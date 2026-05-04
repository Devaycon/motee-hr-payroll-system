import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "HR Management Dashboard",
  description: "",
};

const Index = dynamic(() => import("@/src/components/hr/dashboard"));

const HrDashboardPag = () => {
  return <Index />;
};

export default HrDashboardPag;
