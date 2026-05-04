import dynamic from "next/dynamic";

const MyDocumentsPage = dynamic(() =>
  import("@/src/components/employee/documents").then((m) => m.MyDocumentsPage),
);

export default function Page() {
  return <MyDocumentsPage />;
}
