import dynamic from "next/dynamic";

const MyContractsPage = dynamic(
  () => import("@/src/components/employee/contracts"),
  { ssr: true },
);

export default function ContractsPage() {
  return <MyContractsPage />;
}
