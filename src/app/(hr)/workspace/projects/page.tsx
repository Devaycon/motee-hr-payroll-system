import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projects" };

const ProjectsPage = dynamic(() =>
  import("@/src/components/hr/projects").then((m) => ({
    default: m.ProjectsPage,
  })),
);

export default function Page() {
  return <ProjectsPage />;
}
