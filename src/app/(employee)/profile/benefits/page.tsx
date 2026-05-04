import dynamic from "next/dynamic";

const MyBenefitsPage = dynamic(() =>
  import("@/src/components/employee/benefits").then((m) => m.MyBenefitsPage),
);

export default function Page() {
  return <MyBenefitsPage />;
}
