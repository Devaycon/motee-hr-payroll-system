import dynamic from "next/dynamic";

const EmployeeKnowledgeBase = dynamic(() =>
  import("@/src/components/employee/knowledge").then(
    (m) => m.EmployeeKnowledgeBase
  )
);

export default function KnowledgePage() {
  return <EmployeeKnowledgeBase />;
}
