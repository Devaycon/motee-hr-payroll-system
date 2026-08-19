"use client";

import { useParams } from "next/navigation";
import { ProjectDetail } from "@/src/components/hr/projects/detail";

export default function ProjectDetailRoute() {
  const params = useParams<{ id: string }>();
  return <ProjectDetail projectId={params.id} />;
}
