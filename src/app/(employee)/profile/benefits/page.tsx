import dynamic from "next/dynamic";

const MyBenefitsPage = dynamic(() =>
  import("@/src/components/shared/coming-soon").then((m) => m.default),
);

export default function Page() {
  return <MyBenefitsPage />;
}
