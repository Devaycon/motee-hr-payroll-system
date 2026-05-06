import dynamic from "next/dynamic";

const MyPayslipsPage = dynamic(() =>
  import("@/src/components/shared/coming-soon").then((m) => m.default),
);

export default function Page() {
  return <MyPayslipsPage />;
}
