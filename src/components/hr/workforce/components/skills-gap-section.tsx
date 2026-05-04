import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  SKILLS_GAPS,
  SKILL_CATEGORY_LABELS,
  SKILL_CATEGORY_STYLES,
  GAP_SEVERITY_LABELS,
  GAP_SEVERITY_STYLES,
} from "../data";
import type { SkillCategory, SkillsGap } from "../types";
import { SkillsGapDetailModal } from "./detail-modals";

const CATEGORY_FILTER_OPTIONS: {
  value: SkillCategory | "all";
  label: string;
}[] = [
  { value: "all", label: "All Categories" },
  { value: "technical", label: "Technical" },
  { value: "leadership", label: "Leadership" },
  { value: "communication", label: "Communication" },
  { value: "domain", label: "Domain" },
  { value: "tools", label: "Tools" },
];

export function SkillsGapSection() {
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | "all">(
    "all",
  );
  const [selectedSkill, setSelectedSkill] = useState<SkillsGap | null>(null);

  const filtered =
    categoryFilter === "all"
      ? SKILLS_GAPS
      : SKILLS_GAPS.filter((s) => s.category === categoryFilter);

  const criticalCount = SKILLS_GAPS.filter(
    (s) => s.severity === "critical",
  ).length;
  const moderateCount = SKILLS_GAPS.filter(
    (s) => s.severity === "moderate",
  ).length;
  const adequateCount = SKILLS_GAPS.filter(
    (s) => s.severity === "adequate",
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Critical Gaps",
            value: criticalCount,
            color: "text-red-600 dark:text-red-400",
          },
          {
            label: "Moderate Gaps",
            value: moderateCount,
            color: "text-amber-600 dark:text-amber-400",
          },
          {
            label: "Adequate Coverage",
            value: adequateCount,
            color: "text-emerald-600 dark:text-emerald-400",
          },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">
                of {SKILLS_GAPS.length} tracked skills
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-2xl font-semibold text-foreground">
          Skills Inventory & Gap Analysis
        </p>
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as SkillCategory | "all")}
        >
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Skill
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Required
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Available
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Gap
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground min-w-44">
                    Coverage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((skill) => (
                  <tr
                    key={skill.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{skill.skill}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${SKILL_CATEGORY_STYLES[skill.category]}`}
                      >
                        {SKILL_CATEGORY_LABELS[skill.category]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {skill.requiredCount}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {skill.availableCount}
                    </td>
                    <td className="px-4 py-3">
                      {skill.gapCount > 0 ? (
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          −{skill.gapCount}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          0
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${
                              skill.coveragePct < 50
                                ? "bg-red-500"
                                : skill.coveragePct < 80
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                            style={{ width: `${skill.coveragePct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                          {skill.coveragePct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${GAP_SEVERITY_STYLES[skill.severity]}`}
                      >
                        {GAP_SEVERITY_LABELS[skill.severity]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setSelectedSkill(skill)}
                          >
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Skills coverage is derived from employee profile skill fields linked to
        position requirements. Update employee profiles to improve accuracy.
      </p>
      <SkillsGapDetailModal
        skill={selectedSkill}
        open={selectedSkill !== null}
        onClose={() => setSelectedSkill(null)}
      />
    </div>
  );
}
