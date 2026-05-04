"use client";

import { BookOpen, Users, Award, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { Course, Enrollment } from "../types";

interface StatCardsProps {
  courses: Course[];
  enrollments: Enrollment[];
}

export function StatCards({ courses, enrollments }: StatCardsProps) {
  const activeCourses = courses.filter((c) => c.status === "active").length;
  const activeEnrollments = enrollments.filter(
    (e) => e.status === "enrolled" || e.status === "in_progress",
  ).length;
  const completedEnrollments = enrollments.filter(
    (e) => e.status === "completed",
  ).length;
  const completionRate =
    enrollments.length > 0
      ? Math.round((completedEnrollments / enrollments.length) * 100)
      : 0;

  const cards = [
    {
      label: "Active Courses",
      value: activeCourses,
      sub: `${courses.length} total in catalog`,
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active Enrollments",
      value: activeEnrollments,
      sub: "Currently learning",
      icon: Users,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      sub: `${completedEnrollments} completions`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Certifications",
      value: completedEnrollments,
      sub: "Courses completed",
      icon: Award,
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
