"use client";

import { Briefcase, FileText, Users, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { JobRequisition, Applicant } from "../types";

interface StatCardsProps {
  requisitions: JobRequisition[];
  applicants: Applicant[];
}

export function StatCards({ requisitions, applicants }: StatCardsProps) {
  const openRoles = requisitions.filter((r) => r.status === "approved").length;
  const totalApplicants = applicants.length;
  const hired = applicants.filter((a) => a.stage === "hired").length;

  const cards = [
    {
      label: "Total Requisitions",
      value: requisitions.length,
      sub: `${openRoles} currently open`,
      icon: FileText,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Open Roles",
      value: openRoles,
      sub: "Approved & actively hiring",
      icon: Briefcase,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Total Applicants",
      value: totalApplicants,
      sub: "Across all requisitions",
      icon: Users,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Hired",
      value: hired,
      sub: "Candidates converted",
      icon: UserCheck,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label}>
            <CardContent className="flex items-start gap-4 py-5">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${c.bg}`}
              >
                <Icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">
                  {c.value}
                </p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {c.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
